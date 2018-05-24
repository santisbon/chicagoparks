/* eslint-env mocha */

const chai = require('chai');
const expect = chai.expect;
const assert = chai.assert;
const httpsHelper = require('./httpsHelper');

// from ssmlHelper.getSlotValues()
// TODO: Replace with mocks
const slotValues = {

};

const params = [
    [
        'reservation_start_date',
        `${slotValues.StartDate.resolved}`
    ],
    [
        'permit_status',
        'Approved'
    ]
    // ['$where',
    //    `${eventsSoQL}`]
];

const apiEndpoint = {
    host: 'data.cityofchicago.org',
    resource: '/resource/v8cj-2mjk.json'
};

const token = '';

describe('Build options', function() {
    it('Should build https options for the API call', function() {
        var options = httpsHelper.buildOptions(params, apiEndpoint, token);

        // console.log('options:');
        // console.log(options);

        expect(options.host).to.be.equal('data.cityofchicago.org');
        /**
         * %20 = space
         * %24 = $
         * %3E = >
         */
        expect(options.path).to.be.equal(`/resource/v8cj-2mjk.json?reservation_start_date='2018-05-19'&permit_status=Approved`);
        expect(options.port).to.be.equal(443);
        expect(options.method).to.be.equal('GET');
    });
});

describe('Call API - async', function() {
    it('Should get the results of the API call with async', async function() {
        this.timeout(3000); // To disable timeout: this.timeout(0);
        var options = httpsHelper.buildOptions(params, apiEndpoint, token);

        // console.log('options:');
        // console.log(options);

        try {
            const response = await httpsHelper.httpGet(options);

            if (response.length > 0) {
                // console.log('First element in async response:')
                // console.log(response[0]);

                expect(response[0]).to.have.property('reservation_start_date');
            } else {
                console.log('Response had no elements.');
            }
        } catch (error) {
            assert.fail(0, 1, error);
        }
    });
});
