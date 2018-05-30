/* eslint-env mocha */

const chai = require('chai');
const expect = chai.expect;

const ssmlHelper = require('./ssmlHelper');

// What the Alexa service sends to the lambda function in its request
const completedRequestWithoutSynonym = {
    'request': {
        'type': 'IntentRequest',
        'locale': 'en-US',
        'intent': {
            'name': 'FindEventsIntent',
            'slots': {
                'StartDate': {
                    'name': 'StartDate',
                    'value': '2018-05-25'
                }
            }
        },
        'dialogState': 'STARTED'
    }
};

const completedRequestWithSynonym = {
    'request': {
        'type': 'IntentRequest',
        'locale': 'en-US',
        'intent': {
            'name': 'WeatherIntent',
            'slots': {
                'station': {
                    'name': 'station',
                    'value': 'north',
                    'resolutions': {
                        'resolutionsPerAuthority': [
                            {
                                'authority': 'amzn1.er-authority.echo-sdk.amzn1.ask.skill.xxx.WEATHER_STATIONS',
                                'status': {
                                    'code': 'ER_SUCCESS_MATCH'
                                },
                                'values': [
                                    {
                                        'value': {
                                            'name': 'Foster',
                                            'id': 'FOSTER'
                                        }
                                    }
                                ]
                            }
                        ]
                    },
                    'confirmationStatus': 'NONE'
                }
            }
        },
        'dialogState': 'STARTED'
    }
};

const incompleteEventsRequest = {
    'request': {
        'type': 'IntentRequest',
        'locale': 'en-US',
        'intent': {
            'name': 'FindEventsIntent',
            'slots': {
                'StartDate': {
                    'name': 'StartDate'
                }
            }
        },
        'dialogState': 'STARTED'
    }
};

const incompleteMoviesRequest = {
    'request': {
        'type': 'IntentRequest',
        'locale': 'en-US',
        'intent': {
            'name': 'FindMoviesIntent',
            'slots': {
                'Date': {
                    'name': 'Date'
                }
            }
        },
        'dialogState': 'STARTED'
    }
};

describe('Get slot values from a complete request without synonyms', function() {
    it('Should get the slot values', function() {
        var slots = ssmlHelper.getSlotValues(completedRequestWithoutSynonym.request.intent.slots);

        expect(slots).to.have.property('StartDate');
        expect(slots.StartDate.synonym).to.be.equal('2018-05-25');
        expect(slots.StartDate.resolved).to.be.equal('2018-05-25');
        expect(slots.StartDate.isValidated).to.be.equal(false); // true when validating custom slot types
    });
});

describe('Get slot values from a complete request with synonyms', function() {
    it('Should get the slot values', function() {
        let slots = ssmlHelper.getSlotValues(completedRequestWithSynonym.request.intent.slots);

        expect(slots).to.have.property('station');
        expect(slots.station.synonym).to.be.equal('north');
        expect(slots.station.resolved).to.be.equal('Foster');
        expect(slots.station.isValidated).to.be.equal(true);
    });
});

describe('Get slot values from incomplete requests', function() {
    it('Should not get the events slot values', function() {
        var slots = ssmlHelper.getSlotValues(incompleteEventsRequest.request.intent.slots);

        expect(slots).to.have.property('StartDate');
        expect(slots.StartDate.synonym).to.be.equal(undefined);
        expect(slots.StartDate.resolved).to.be.equal(undefined);
        expect(slots.StartDate.isValidated).to.be.equal(false);
    });

    it('Should not get the movies slot values', function() {
        var slots = ssmlHelper.getSlotValues(incompleteMoviesRequest.request.intent.slots);

        expect(slots).to.have.property('Date');
        expect(slots.Date.synonym).to.be.equal(undefined);
        expect(slots.Date.resolved).to.be.equal(undefined);
        expect(slots.Date.isValidated).to.be.equal(false);
    });
});
