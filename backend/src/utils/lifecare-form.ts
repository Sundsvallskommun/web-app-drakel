/**
 * The HTML forms the Lifecare login flow is carried by.
 *
 * Two hops of the flow are forms rather than redirects: the identity provider's sign-in page, and
 * the page that posts the `SAMLResponse` back to Lifecare (a browser submits that one with script,
 * the moment it loads). Both are read here rather than hardcoded, because their field names are
 * the identity provider's business and change without asking us.
 */
export interface LifecareForm {
  /** Absolute URL the form posts to. */
  action: string;
  /** Every field the form carries, hidden state included, ready to be posted back. */
  fields: Record<string, string>;
  /** The name of the password field, when this form is a sign-in form. */
  passwordField?: string;
  /** The name of the field the username belongs in, when this form is a sign-in form. */
  usernameField?: string;
}

const FORM_PATTERN = /<form\b[^>]*>([\s\S]*?)<\/form>/gi;
const INPUT_PATTERN = /<input\b[^>]*>/gi;
const TEXTAREA_PATTERN = /<textarea\b([^>]*)>([\s\S]*?)<\/textarea>/gi;

/**
 * Where MobilityGuard's web login actually posts the credentials.
 *
 * Its visible username and password boxes sit outside the form, next to a scrambled on-screen
 * keypad; on submit, `numpad.js` copies both values verbatim into these two hidden fields. The
 * keypad's order never reaches the server, so filling the hidden fields is exactly what the page
 * itself sends.
 */
const MOBILITYGUARD_CREDENTIAL_FIELDS = { username: 'uid', password: 'otp' } as const;

/**
 * Reads one attribute off a tag, quoted with `"`, quoted with `'`, or not quoted at all.
 *
 * The unquoted case is not a curiosity: the page that carries the SAML request onwards writes its
 * action bare — `action=https://…/samlv2/idp/req/0/42?mgvhostparam=0` — and a reader that only
 * understands quotes silently finds no action, falls back to posting the form back where it came
 * from, and derails the whole sign-in with nothing looking obviously wrong.
 */
const attribute = (tag: string, name: string): string | undefined => {
  const match = new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i').exec(tag);
  return match?.[2] ?? match?.[3] ?? match?.[4];
};

/**
 * Picks the field a username belongs in.
 *
 * Sign-in forms name it anything at all (`username`, `user`, `j_username`, `mg_user`), so the name
 * is only consulted as a hint; failing that, the first text-ish input on the form is taken, which is
 * what it is on every sign-in page worth the name.
 */
const findUsernameField = (inputs: { name: string; type: string }[]): string | undefined => {
  const named = inputs.find(input => /user|login|uid|account/i.test(input.name));
  if (named) return named.name;
  return inputs.find(input => input.type === 'text' || input.type === 'email' || input.type === '')?.name;
};

/**
 * Reads the form a page carries the flow forward with, hidden state already collected.
 *
 * A sign-in page is rarely one form — there is a language picker, a search box, a cookie banner —
 * so the form holding a password field wins when there is one, and the first form is only the
 * fallback for the pages that merely post a SAML assertion onwards.
 *
 * @param html The page as delivered
 * @param pageUrl The URL it was fetched from, so a relative action resolves correctly
 */
export const extractForm = (html: string, pageUrl: string): LifecareForm | undefined => {
  const forms = [...html.matchAll(FORM_PATTERN)].map(match => readForm(match[0], match[1] ?? '', pageUrl));
  return forms.find(form => form.passwordField !== undefined) ?? forms[0];
};

const readForm = (wholeForm: string, body: string, pageUrl: string): LifecareForm => {
  const openingTag = /<form\b[^>]*>/i.exec(wholeForm)?.[0] ?? '';
  const action = attribute(openingTag, 'action');

  const inputs = [...body.matchAll(INPUT_PATTERN)]
    .map(match => ({
      name: attribute(match[0], 'name') ?? '',
      type: (attribute(match[0], 'type') ?? '').toLowerCase(),
      value: attribute(match[0], 'value') ?? '',
    }))
    .filter(input => input.name !== '' && input.type !== 'submit' && input.type !== 'button');

  const fields: Record<string, string> = {};
  for (const input of inputs) {
    fields[input.name] = input.value;
  }
  // The identity provider hands the SAMLResponse back in textareas, not inputs.
  for (const textarea of readTextareas(body)) {
    fields[textarea.name] = textarea.value;
  }

  // An action of "" means the form posts back to the page it came from.
  const resolvedAction = new URL(action === undefined || action === '' ? pageUrl : action, pageUrl).toString();

  if (isMobilityGuardLogin(fields)) {
    return {
      action: resolvedAction,
      fields,
      passwordField: MOBILITYGUARD_CREDENTIAL_FIELDS.password,
      usernameField: MOBILITYGUARD_CREDENTIAL_FIELDS.username,
    };
  }

  const passwordField = inputs.find(input => input.type === 'password')?.name;
  const candidates = inputs.filter(input => input.type !== 'password' && input.type !== 'hidden');

  return {
    action: resolvedAction,
    fields,
    passwordField,
    usernameField: passwordField === undefined ? undefined : findUsernameField(candidates),
  };
};

const isMobilityGuardLogin = (fields: Record<string, string>): boolean =>
  MOBILITYGUARD_CREDENTIAL_FIELDS.username in fields && MOBILITYGUARD_CREDENTIAL_FIELDS.password in fields;

const readTextareas = (body: string): { name: string; value: string }[] =>
  [...body.matchAll(TEXTAREA_PATTERN)]
    .map(match => ({ name: attribute(match[1] ?? '', 'name') ?? '', value: (match[2] ?? '').trim() }))
    .filter(textarea => textarea.name !== '');
