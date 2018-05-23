'use strict';

const Alexa = require('alexa-sdk');
const request = require('request');

const APP_ID = process.env.APP_ID;
const EVENTS_APP_TOKEN = process.env.EVENTS_APP_TOKEN;

// Helpers
var cleanUpSSML = require('./helpers/cleanUpSSML');
var convertArrayToReadableString = require('./helpers/convertArrayToReadableString');

// Main lambda event handler
exports.handler = function(event, context, callback) {
    var alexa = Alexa.handler(event, context);
    alexa.appId = APP_ID;
    alexa.registerHandlers(handlers);
    alexa.execute();
};

var handlers = {
    'LaunchRequest': function() {
        // ask | tell, message, reprompt if we're asking
        this.emit(':ask', 'Welcome to Chicago Park District Events! Try asking what events start today or what\'s going on this Friday',
            'How can I help?');
    },

    'EventCheck': function() {
        var startDate = this.event.request.intent.slots.StartDate.value;

        if (startDate) {
            var options = {
                url: `https://data.cityofchicago.org/resource/v8cj-2mjk.json?reservation_start_date=${startDate}&permit_status=Approved`,
                headers: {
                    'X-App-Token': EVENTS_APP_TOKEN
                },
                json: true
            };

            request(
                options,
                (err, res, body) => {
                    if (err) {
                        this.emit(':tell', 'Sorry, there was an error reaching the Park District.');
                    }

                    var parkEvents = body; // array of park events
                    var eventsSummary = [];

                    eventsSummary.push(`There are ${parkEvents.length} events on ${startDate}. They are:`);
                    for (var i = 0; i < parkEvents.length; i++) {
                        eventsSummary.push(cleanUpSSML(parkEvents[i].event_description) + ' at ' + cleanUpSSML(parkEvents[i].park_facility_name));
                    }

                    this.emit(':tell', `${convertArrayToReadableString(eventsSummary, '.')}`);
                });
        } else {
            this.emit(':ask', 'Sorry, I didn\'t recognize that date. Please try again.', 'How can I help?');
        }
    },

    'AMAZON.HelpIntent': function() {
        this.emit(':ask', `You can ask: What events are going on today? Give me events starting October 31st. Or What events are happening this Sunday?
        Data provided by the City of Chicago Data Portal.`,
        'How can I help?');
    },
    'AMAZON.StopIntent': function() {
        this.emit(':tell', '');
    },
    'AMAZON.CancelIntent': function() {
        this.emit(':tell', '');
    }
};
