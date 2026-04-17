// Vanity redirect: assosukesfet.com/ig → /?utm_source=instagram&utm_medium=bio
export function onRequest(context) {
  const url = new URL(context.request.url);
  const target = url.origin + '/?utm_source=instagram&utm_medium=bio&utm_campaign=profile';
  return Response.redirect(target, 302);
}
