function handler(event) {
  var request = event.request;
  var uri = request.uri;
  var regex = /^(\/[a-z-]+)(\/|\/index\.html)$/

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
