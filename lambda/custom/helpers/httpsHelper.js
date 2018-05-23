const https = require('https');

const eventsApi = {
    host: 'data.cityofchicago.org',
    resource: '/resource/v8cj-2mjk.json'
};

function buildQueryString(params) {
    let paramList = '';
    params.forEach((paramGroup, index) => {
        paramList += `${index === 0 ? '?' : '&'}${encodeURIComponent(paramGroup[0])}=${encodeURIComponent(paramGroup[1])}`;
    });
    return paramList;
}

function buildHttpGetOptions(host, path, port, params) {
    return {
        host: host,
        path: path + buildQueryString(params),
        port,
        method: 'GET',
        headers: {'X-App-Token': process.env.EVENTS_APP_TOKEN}
    };
}

/**
 * The url params that the api takes.
 * @param {*} slotValues
 */
function buildEventsParams(slotValues) {
    return [
        [
            'reservation_start_date',
            `${slotValues.StartDate.resolved}`
        ],
        [
            'permit_status',
            'Approved'
        ]
        // ['$where',
        //    `${SoQL}`]
    ];
}

function buildEventsOptions(slotValues) {
    const params = buildEventsParams(slotValues);
    const port = 443;
    return buildHttpGetOptions(eventsApi.host, eventsApi.resource, port, params);
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

exports.buildQueryString = buildQueryString;
exports.buildHttpGetOptions = buildHttpGetOptions;
exports.buildEventsParams = buildEventsParams;
exports.buildEventsOptions = buildEventsOptions;
exports.httpGet = httpGet;
