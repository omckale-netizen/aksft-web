import { vanityRedirect } from './_vanity.js';
export function onRequest(context) {
  return vanityRedirect(context, { source: 'instagram', medium: 'bio', campaign: 'profile' });
}
