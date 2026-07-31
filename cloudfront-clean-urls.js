function handler(event) {
    var request = event.request;
    var uri = request.uri;

    // Send legacy home-page URLs to the canonical root URL.
    if (uri === '/index.html') {
        return {
            statusCode: 301,
            statusDescription: 'Moved Permanently',
            headers: {
                location: { value: '/' }
            }
        };
    }

    // Map clean visitor URLs to the existing S3 objects.
    var routes = {
        '/profile': '/index.html',
        '/resume': '/resume.html',
        '/projects': '/projects.html',
        '/contact': '/contact.html'
    };

    // Use one canonical URL for each page: no trailing slash.
    if (uri.length > 1 && uri.endsWith('/')) {
        var canonicalUri = uri.slice(0, -1);
        if (routes[canonicalUri]) {
            return {
                statusCode: 301,
                statusDescription: 'Moved Permanently',
                headers: {
                    location: { value: canonicalUri }
                }
            };
        }
    }

    if (routes[uri]) {
        request.uri = routes[uri];
    }

    return request;
}
