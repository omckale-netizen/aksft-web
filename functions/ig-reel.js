export function onRequest(context) {
  const url = new URL(context.request.url);
  return Response.redirect(url.origin + '/?utm_source=instagram&utm_medium=reel', 302);
}
