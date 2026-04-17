import { vanityRedirect } from './_vanity.js';
export function onRequest(context) {
  return vanityRedirect(context, { source: 'email', medium: 'newsletter' });
}
