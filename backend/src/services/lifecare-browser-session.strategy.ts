import { setTimeout as sleep } from 'node:timers/promises';

import {
  LIFECARE_ACTOR,
  LIFECARE_BASE_URL,
  LIFECARE_BROWSER_HEADED,
  LIFECARE_DOMAIN,
  LIFECARE_IDP_METHOD,
  LIFECARE_INSECURE_TLS,
  LIFECARE_PASSWORD,
  LIFECARE_USERNAME,
} from '@config';
import { HttpException } from '@exceptions/HttpException';
import { LifecareAuthStrategy } from '@interfaces/lifecare.interface';
import { LifecareCookieStore, SIGNED_IN_COOKIE } from '@utils/lifecare-cookies';
import { logger } from '@utils/logger';
import { BrowserContext, chromium, Locator, Page } from 'playwright';

/** Reaching the login page: two hosts and a redirect or two, no human in the way. */
const NAVIGATION_TIMEOUT = 30_000;

/** Waiting for the page to finish building its fields. Generous, but not a coffee break. */
const FORM_TIMEOUT = 30_000;

/** The assertion still has to travel back to Lifecare after the form goes in. */
const SESSION_TIMEOUT = 45_000;

/** How often the cookie jar is checked while the flow finishes redirecting. */
const POLL_INTERVAL = 250;

/**
 * Signs drakel in to Lifecare by driving a real browser.
 *
 * A fallback, not the default: {@link ServiceAccountLifecareSession} signs in over plain HTTP by
 * posting straight to the hidden `uid`/`otp` fields MobilityGuard's page script fills on submit.
 * This stays for the day the identity provider changes into something only a browser can get
 * through — turned on with LIFECARE_BROWSER_SIGN_IN.
 *
 * It runs the page instead of reading it. Headless Chromium opens Lifecare's entry URL, lets
 * the login page assemble itself, fills it in, and waits for the SAML round trip to come back with
 * a session. The cookies are then lifted out of the browser and handed to the same cookie store
 * every other strategy fills, and the browser is closed. Everything above this — the transport, the
 * bootstrap, the retry on a dead session — neither knows nor cares that a browser was involved.
 *
 * The cost is real and worth stating: a browser in the image, a few hundred megabytes of memory
 * while it runs, and seconds rather than milliseconds to sign in. It is paid once per session.
 */
export class BrowserLifecareSession implements LifecareAuthStrategy {
  public readonly name = `the Lifecare account ${LIFECARE_USERNAME}, through a browser`;

  public async authenticate(cookies: LifecareCookieStore): Promise<void> {
    if (!LIFECARE_USERNAME || !LIFECARE_PASSWORD) {
      throw new HttpException(502, 'No Lifecare account configured (LIFECARE_USERNAME / LIFECARE_PASSWORD)');
    }

    const browser = await chromium.launch({
      headless: !LIFECARE_BROWSER_HEADED,
      // Only when watching: pace the actions so the keypad clicks are followable by eye.
      slowMo: LIFECARE_BROWSER_HEADED ? 400 : undefined,
    });

    try {
      const context = await browser.newContext({
        // Chromium has its own view of which certificates to trust, and neither LIFECARE_CA_CERT
        // nor Node's trust store reaches it. On a workstation it trusts the internal CA because
        // Windows does; in a container the CA has to be installed in the image, or this turned on.
        ignoreHTTPSErrors: LIFECARE_INSECURE_TLS,
        locale: 'sv-SE',
      });

      const page = await context.newPage();
      await page.goto(this.entryUrl(), { waitUntil: 'domcontentloaded', timeout: NAVIGATION_TIMEOUT });
      logger.info(`Lifecare sign-in: the browser landed on ${page.url()}`);

      await this.signIn(page);
      await this.waitForSession(context, page);

      this.collect(await context.cookies(), cookies);
      logger.info('Lifecare accepted the integration account');
    } finally {
      await browser.close();
    }
  }

  /** Fills the login page once it has finished building itself, and submits it. */
  private async signIn(page: Page): Promise<void> {
    const password = page.locator('input[type="password"]').first();

    try {
      await password.waitFor({ state: 'visible', timeout: FORM_TIMEOUT });
    } catch {
      // No password field ever appeared. Either the page is asking for something else entirely —
      // a one-time code, a certificate — or it never got as far as the login form.
      throw new HttpException(502, `No password field appeared on the Lifecare sign-in page at ${page.url()}`);
    }

    const username = await this.usernameField(page);

    // Naming the fields chosen, not what goes in them: picking the wrong input looks exactly like
    // a wrong password from the outside, and this is what tells the two apart.
    logger.info(
      `Lifecare sign-in: filling '${(await username.getAttribute('name')) ?? 'unnamed'}' and '${(await password.getAttribute('name')) ?? 'unnamed'}'`,
    );

    await username.fill(LIFECARE_USERNAME);
    await this.enterPassword(page, password);

    const submit = page.locator('button[type="submit"], input[type="submit"]').first();
    if ((await submit.count()) > 0) {
      await submit.click();
    } else {
      await password.press('Enter');
    }

    logger.info('Lifecare sign-in: submitted, waiting for the session to come back');
  }

  /**
   * Enters the password, letter by letter and digit by digit.
   *
   * The identity provider takes the two differently: letters can be typed into the field, but the
   * digits will not go in that way — "Du måste använda muspekaren för att mata in siffror" — and
   * must be clicked on a scrambled on-screen keypad, which is how the existing RPA robot signs the
   * same account in. So the password is walked in its own order: each letter typed, each digit
   * clicked, into the one field that accumulates them both.
   *
   * The keypad is only needed if the password has a digit in it. When it does and none is on the
   * page, that is a real failure rather than something to type around, since the digit cannot be
   * entered any other way. The layout is shuffled on every load, so the keys are read live.
   */
  private async enterPassword(page: Page, password: Locator): Promise<void> {
    const passwordHasDigits = /\d/.test(LIFECARE_PASSWORD);
    const keypad = passwordHasDigits ? await this.keypad(page) : new Map<string, Locator>();

    if (keypad.size === 0) {
      if (passwordHasDigits) {
        throw new HttpException(502, 'The password has digits that must be clicked on a keypad, but no keypad appeared on the Lifecare sign-in page');
      }
      // No digits, so nothing needs the keypad — the whole password can be typed.
      await password.fill(LIFECARE_PASSWORD);
      return;
    }

    logger.info('Lifecare sign-in: typing the letters and clicking the digits of the password');

    for (const character of LIFECARE_PASSWORD) {
      if (/\d/.test(character)) {
        const key = keypad.get(character);
        if (!key) {
          throw new HttpException(502, `The Lifecare keypad was missing a ${character} key`);
        }
        await key.click();
      } else {
        // pressSequentially focuses the field and appends, so the character lands after whatever
        // has already gone in — keeping the password in order as it is built up.
        await password.pressSequentially(character);
      }
    }
  }

  /**
   * The scrambled keypad as a map from digit to the key that enters it, or an empty map when the
   * page has no keypad.
   *
   * A key is a visible, clickable element whose whole text is a single digit. Only a full set of
   * ten is treated as a keypad: fewer means the single digits found are ordinary text that happens
   * to sit on the page, and clicking those would be worse than falling back to typing.
   */
  private async keypad(page: Page): Promise<Map<string, Locator>> {
    const keys = new Map<string, Locator>();

    for (const digit of '0123456789') {
      const candidate = page.getByText(digit, { exact: true }).first();
      if ((await candidate.count()) > 0 && (await candidate.isVisible())) {
        keys.set(digit, candidate);
      }
    }

    return keys.size === 10 ? keys : new Map();
  }

  /**
   * The field the username belongs in.
   *
   * A name that speaks for itself is trusted first, since login pages put a search box or a
   * language picker above the form often enough that "the first text input" is not safe on its own.
   */
  private async usernameField(page: Page): Promise<Locator> {
    const named = page.locator('input[name*="user" i], input[name*="login" i], input[name*="uid" i]').first();
    if ((await named.count()) > 0) return named;

    return page.locator('input[type="text"], input[type="email"]').first();
  }

  /**
   * Waits for the session cookie to appear.
   *
   * Submitting the form is not the end of it: the assertion still has to travel back to Lifecare
   * through a handful of redirects, and the session only exists when that lands.
   */
  private async waitForSession(context: BrowserContext, page: Page): Promise<void> {
    const deadline = Date.now() + SESSION_TIMEOUT;

    while (Date.now() < deadline) {
      const current = await context.cookies();
      if (current.some(cookie => cookie.name === SIGNED_IN_COOKIE)) return;

      await sleep(POLL_INTERVAL);
    }

    logger.warn(`Lifecare sign-in came to rest showing: ${await this.readPage(page)}`);

    throw new HttpException(
      502,
      `Lifecare never issued a ${SIGNED_IN_COOKIE} after the integration account signed in — the browser came to rest on ${page.url()}`,
    );
  }

  /**
   * What the page says, as a person would read it.
   *
   * A sign-in that does not finish looks the same from the outside whatever went wrong — a rejected
   * password, a second factor waiting on someone's phone, a locked account. The page has said which
   * one in plain Swedish the whole time; this is just reading it.
   */
  private async readPage(page: Page): Promise<string> {
    try {
      const text = await page.locator('body').innerText({ timeout: 5_000 });
      return text.replace(/\s+/g, ' ').trim().slice(0, 400) || '(an empty page)';
    } catch {
      return '(the page said nothing readable)';
    }
  }

  /**
   * Lifts the Lifecare cookies out of the browser and into the store the transport uses.
   *
   * Only Lifecare's own: the browser also holds the identity provider's cookies, and those belong
   * to the identity provider. Sending someone else's session cookies to Lifecare would be both
   * pointless and rude.
   */
  private collect(browserCookies: { name: string; value: string; domain: string }[], cookies: LifecareCookieStore): void {
    const lifecareHost = new URL(LIFECARE_BASE_URL).host;

    for (const cookie of browserCookies) {
      const domain = cookie.domain.replace(/^\./, '');
      if (lifecareHost === domain || lifecareHost.endsWith(`.${domain}`)) {
        cookies.set(cookie.name, cookie.value);
      }
    }
  }

  /** Lifecare's entry point for a handläggare, the URL a browser is pointed at to start the flow. */
  private entryUrl(): string {
    const url = new URL(`${LIFECARE_BASE_URL.replace(/\/+$/, '')}/WE.Flow.Html`);
    url.searchParams.set('domain', LIFECARE_DOMAIN);
    url.searchParams.set('Actor', LIFECARE_ACTOR);
    url.searchParams.set('IDPMethod', LIFECARE_IDP_METHOD);
    return url.toString();
  }
}
