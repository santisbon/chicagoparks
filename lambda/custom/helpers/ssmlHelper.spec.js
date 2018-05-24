/* eslint-env mocha */

const chai = require('chai');
const expect = chai.expect;

const ssmlHelper = require('./ssmlHelper');

// What the Alexa service sends to the lambda function in its request
// TODO: Get real resolutions object
const completedRequestWithSynonym =
{
    'request': {
        'type': 'IntentRequest',
        'locale': 'en-US',
        'intent': {
            'name': 'EventCheck',
            'slots': {
                'StartDate': {
                    'name': 'StartDate',
                    'value': 'this friday',
                    'resolutions': {
                    }
                }
            }
        },
        'dialogState': 'STARTED'
    }
};

// A request without resolutions
const incompleteRequest =
{
    'request': {
        'type': 'IntentRequest',
        'locale': 'en-US',
        'intent': {
            'name': 'EventCheck',
            'slots': {
                'StartDate': {
                    'name': 'StartDate'
                }
            }
        },
        'dialogState': 'STARTED'
    }
};

describe('Get slot values from complete request using a synonym', function() {
    it('Should get the resolved slot values', function() {
        var slots = ssmlHelper.getSlotValues(completedRequestWithSynonym.request.intent.slots);

        // console.log('Slot values:');
        // console.log(slots);

        expect(slots).to.have.property('StartDate');
        expect(slots.StartDate.synonym).to.be.equal('this friday');
        // expect(slots.StartDate.resolved).to.be.equal('');
        expect(slots.StartDate.isValidated).to.be.equal(true);
    });
});

describe('Get slot values from incomplete request', function() {
    it('Should not get the resolved slot values', function() {
        var slots = ssmlHelper.getSlotValues(incompleteRequest.request.intent.slots);

        // console.log('Slot values:');
        // console.log(slots);

        expect(slots).to.have.property('StartDate');
        expect(slots.station.synonym).to.be.equal(undefined);
        expect(slots.station.resolved).to.be.equal(undefined);
        expect(slots.station.isValidated).to.be.equal(false);
    });
});
