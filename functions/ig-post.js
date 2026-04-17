import { vanityRedirect } from './_vanity.js';
export function onRequest(context) {
  return vanityRedirect(context.request, { source: 'instagram', medium: 'post' });
}
