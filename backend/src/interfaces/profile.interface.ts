import { Profile as SamlProfile } from '@node-saml/passport-saml';

export interface Profile extends SamlProfile {
  givenName: string;
  surname: string;
  username: string;
  /** Comma-separated list of the user's AD groups */
  groups: string;
  attributes: { [key: string]: any };
}
