// CloudFront viewer-request function — canonicalizes URLs to the abstract,
// extension-less shape this site prefers.
//
//     /index.html  ->  301 -> /
//     /about/      ->  301 -> /about
//     /about/index.html -> 301 -> /about
//
// Anything else (e.g. /about, /img/foo.png, /assets/app-XXX.css) passes through
// untouched and is served from S3 as-is. The flatten-dist + apply-metadata
// build steps make sure those extension-less keys exist in the bucket with
// Content-Type: text/html.
//
// This file is the source of truth for the function; the deployed copy lives
// in the CloudFront distribution under the function name `PhdcRedirects`.
// CloudFront does NOT auto-deploy from this repo — when this file changes,
// the function in AWS has to be updated manually (console or CLI) and then
// published to the distribution.
//
// Runtime constraints: CloudFront Functions runtime 1.0 only supports ES5.1
// plus a small set of extensions. No `let`/`const`, no arrow functions, no
// template literals — keep this file boring and ES5.

function handler(event) {
  var request = event.request;
  var uri = request.uri;
  var regex = /^(\/[a-z-]+)(\/|\/index\.html)$/;

  if (uri !== '/index.html' && !uri.match(regex)) {
    return request;
  }

  var newUri = uri === '/index.html'
    ? '/'
    : uri.replace(regex, '$1');

  return {
    statusCode: 301,
    statusDescription: 'Found',
    headers: {
      location: {
        value: newUri,
      }
    },
  };
}
