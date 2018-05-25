const https = require('https');

function buildQueryString(params) {
    let paramList = '';
    params.forEach((paramGroup, index) => {
        paramList += `${index === 0 ? '?' : '&'}${encodeURIComponent(paramGroup[0])}=${encodeURIComponent(paramGroup[1])}`;
    });
    return paramList;
}

function buildHttpGetOptions(hostname, path, port, params, appToken) {
    return {
        hostname: hostname,
        path: path + buildQueryString(params),
        port,
        method: 'GET',
        headers: {'X-App-Token': appToken}
    };
}

function buildOptions(params, apiEndpoint, appToken) {
    const port = 443;
    return buildHttpGetOptions(apiEndpoint.hostname, apiEndpoint.resource, port, params, appToken);
}

function httpGet(options) {
    return new Promise((resolve, reject) => {
        const request = https.request(options, (response) => {
            response.setEncoding('utf8');
            let returnData = '';

            if (response.statusCode < 200 || response.statusCode >= 300) {
                return reject(new Error(`${response.statusCode}: ${response.req.getHeader('host')} ${response.req.path}`));
            }

            response.on('data', (chunk) => {
                returnData += chunk;
            });

            response.on('end', () => {
                resolve(JSON.parse(returnData));
            });

            response.on('error', (error) => {
                reject(error);
            });
        });
        request.end();
    });
}

// exports.buildQueryString = buildQueryString;
// exports.buildHttpGetOptions = buildHttpGetOptions;
// exports.buildEventsParams = buildEventsParams;
exports.buildOptions = buildOptions;
exports.httpGet = httpGet;
