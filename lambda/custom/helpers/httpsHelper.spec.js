/* eslint-env mocha */

const chai = require('chai');
const expect = chai.expect;
const assert = chai.assert;
const httpsHelper = require('./httpsHelper');

const eventsSlotValues = {
    StartDate: {
        synonym: '2018-05-25',
        resolved: '2018-05-25',
        isValidated: false
    }
};

const moviesSlotValues = {
    Date: {
        synonym: undefined,
        resolved: undefined,
        isValidated: false
    }
};

const eventsParams = [
    [
        'reservation_start_date',
        `${eventsSlotValues.StartDate.resolved}`
    ],
    [
        'permit_status',
        'Approved'
    ]
    // ['$where',
    //    `${eventsSoQL}`]
];

const moviesParams = [
    [
        'date',
        `${moviesSlotValues.Date.resolved}`
    ]
    // ['$where',
    //    `${moviesSoQL}`]
];

const eventsApiEndpoint = {
    hostname: 'data.cityofchicago.org',
    resource: '/resource/v8cj-2mjk.json'
};

const moviesApiEndpoint = {
    hostname: 'data.cityofchicago.org',
    resource: '/resource/dan6-dh2g.json'
};

const token = '';

describe('httpsHelper tests', function() {
    describe('Build options', function() {
        it('Should build https options for the events API call', function() {
            var options = httpsHelper.buildOptions(eventsParams, eventsApiEndpoint, token);

            /**
             * %20 = space
             * %24 = $
             * %3E = >
             */

            expect(options.hostname).to.be.equal('data.cityofchicago.org');
            expect(options.path).to.be.equal(`/resource/v8cj-2mjk.json?reservation_start_date=2018-05-25&permit_status=Approved`);
            expect(options.port).to.be.equal(443);
            expect(options.method).to.be.equal('GET');
            expect(options.headers).to.have.property('X-App-Token');
        });

        it('Should build https options for the movies API call', function() {
            const options = httpsHelper.buildOptions(moviesParams, moviesApiEndpoint, token);

            /**
             * %20 = space
             * %24 = $
             * %3E = >
             */

            expect(options.hostname).to.be.equal('data.cityofchicago.org');
            expect(options.path).to.be.equal(`/resource/dan6-dh2g.json?date=undefined`);
            expect(options.port).to.be.equal(443);
            expect(options.method).to.be.equal('GET');
            expect(options.headers).to.have.property('X-App-Token');
        });
    });

    describe('Call API', function() {
        it('Should get the results of the API call', async function() {
            this.timeout(3000); // To disable timeout: this.timeout(0);
            var options = httpsHelper.buildOptions(eventsParams, eventsApiEndpoint, token);

            try {
                const response = await httpsHelper.httpGet(options);

                if (response.length > 0) {
                    expect(response[0]).to.have.property('event_description');
                    expect(response[0]).to.have.property('reservation_start_date');
                } else {
                    console.log('Response had no elements.');
                }
            } catch (error) {
                assert.fail(0, 1, error);
            }
        });
    });
});
