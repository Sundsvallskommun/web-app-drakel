import { extractForm } from '@utils/lifecare-form';
import { describe, expect, it } from 'vitest';

const pageUrl = 'https://m02-mg-local.login.test/samlv2/idp/sign_in/174';

describe('extractForm', () => {
  it('reads the sign-in form and says where the credentials belong', () => {
    const page = `
      <html><body>
        <form method="post" action="/samlv2/idp/sign_in/174">
          <input type="hidden" name="mgvhostparam" value="0" />
          <input type="text" name="username" />
          <input type="password" name="password" />
          <input type="submit" value="Logga in" />
        </form>
      </body></html>`;

    const form = extractForm(page, pageUrl);

    expect(form?.action).toBe('https://m02-mg-local.login.test/samlv2/idp/sign_in/174');
    expect(form?.usernameField).toBe('username');
    expect(form?.passwordField).toBe('password');
    // Hidden state has to go back untouched, or the identity provider drops the request.
    expect(form?.fields.mgvhostparam).toBe('0');
    // A submit button is not a field to post.
    expect(form?.fields).not.toHaveProperty('Logga in');
  });

  it('picks the form with the password field, not merely the first one', () => {
    // Sign-in pages carry language pickers and search boxes above the form that matters.
    const page = `
      <form action="/language"><input type="text" name="lang" /></form>
      <form action="/samlv2/idp/sign_in/174">
        <input type="text" name="j_username" /><input type="password" name="j_password" />
      </form>`;

    const form = extractForm(page, pageUrl);

    expect(form?.passwordField).toBe('j_password');
    expect(form?.usernameField).toBe('j_username');
  });

  it('reads the assertion form a browser would post on load', () => {
    // The hop that carries the SAMLResponse back to Lifecare. No password field, nothing to fill —
    // it is posted exactly as delivered.
    const page = `
      <form method="post" action="https://lifecare.test/HCW.Welfare.Common.IdentityPortalWeb/redirectAuth.aspx">
        <input type="hidden" name="SAMLResponse" value="PHNhbWxwOl==" />
        <input type="hidden" name="RelayState" value="state-42" />
      </form>`;

    const form = extractForm(page, pageUrl);

    expect(form?.passwordField).toBeUndefined();
    expect(form?.fields.SAMLResponse).toBe('PHNhbWxwOl==');
    expect(form?.fields.RelayState).toBe('state-42');
  });

  it('resolves a relative action against the page it came from', () => {
    const form = extractForm('<form action="continue"><input type="hidden" name="a" value="1" /></form>', pageUrl);

    expect(form?.action).toBe('https://m02-mg-local.login.test/samlv2/idp/sign_in/continue');
  });

  it('posts back to the same page when the form names no action', () => {
    const form = extractForm('<form><input type="password" name="pw" /><input type="text" name="user" /></form>', pageUrl);

    expect(form?.action).toBe(pageUrl);
  });

  it('takes the field named like a username over an unrelated text box', () => {
    const page = `
      <form action="/in">
        <input type="text" name="searchTerm" />
        <input type="text" name="mg_user" />
        <input type="password" name="pw" />
      </form>`;

    expect(extractForm(page, pageUrl)?.usernameField).toBe('mg_user');
  });

  it('reads an action that carries no quotes at all', () => {
    // Exactly how the page that hands the SAML request to the identity provider writes it. Missing
    // this reads as "no action", which posts the form back to the page it came from and quietly
    // derails the sign-in.
    const page =
      '<form action=https://m00-mg-local.login.test/samlv2/idp/req/0/42?mgvhostparam=0 method="post">' +
      '<input type="hidden" name="SAMLRequest" value="PHNhbWxwOg==" /></form>';

    const form = extractForm(page, pageUrl);

    expect(form?.action).toBe('https://m00-mg-local.login.test/samlv2/idp/req/0/42?mgvhostparam=0');
    expect(form?.fields.SAMLRequest).toBe('PHNhbWxwOg==');
  });

  it('reads unquoted input attributes too', () => {
    const form = extractForm('<form action=/in><input type=password name=pw /><input type=text name=user /></form>', pageUrl);

    expect(form?.passwordField).toBe('pw');
    expect(form?.usernameField).toBe('user');
  });

  it('handles single-quoted attributes', () => {
    const form = extractForm("<form action='/in'><input type='password' name='pw' /><input type='text' name='user' /></form>", pageUrl);

    expect(form?.passwordField).toBe('pw');
    expect(form?.usernameField).toBe('user');
  });

  it('finds nothing on a page without a form', () => {
    expect(extractForm('<html><body>Du är utloggad.</body></html>', pageUrl)).toBeUndefined();
  });
});
