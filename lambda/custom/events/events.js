'use strict';

const ssmlHelper = require('../helpers/ssmlHelper');
const httpsHelper = require('../helpers/httpsHelper');

/**
 * The Socrata APIs provide rich query functionality through a query language called
 * “Socrata Query Language” or “SoQL”.
 * Uncomment to specify a query and use it when building request params.
 */
// const eventsSoQL = ``;

const title = 'Chicago Parks';

const errorMessage = 'Sorry, there was an error reaching the Park District event listings.';

const requiredSlots = [
    'StartDate'
];

const api = {
    hostname: 'data.cityofchicago.org',
    resource: '/resource/v8cj-2mjk.json'
};

const FindEventsIntent = 'FindEventsIntent';

/**
 * The url params that the api takes.
 * @param {*} slotValues
 */
function buildParams(slotValues) {
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
        //    `${eventsSoQL}`]
    ];
}

/**
 * Handles a WeatherIntent when a required slot is missing.
 * It delegates slot elicitation to Alexa.
 * It also uses entity resolution to ask the user for clarification if
 * a synonym is mapped to two slot values.
 */
const InProgressEventsIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
        handlerInput.requestEnvelope.request.intent.name === FindEventsIntent &&
        handlerInput.requestEnvelope.request.dialogState !== 'COMPLETED';
    },
    handle(handlerInput) {
        const currentIntent = handlerInput.requestEnvelope.request.intent;
        let prompt = '';

        // for each slot
        for (const slotName of Object.keys(handlerInput.requestEnvelope.request.intent.slots)) {
            const currentSlot = currentIntent.slots[slotName];
            // if the slot is missing it'll have a name but no value or resolutions
            if (currentSlot.confirmationStatus !== 'CONFIRMED' && currentSlot.resolutions && currentSlot.resolutions.resolutionsPerAuthority[0]) {
                // the slot is there
                if (currentSlot.resolutions.resolutionsPerAuthority[0].status.code === 'ER_SUCCESS_MATCH') {
                    // it matched to one or more values
                    if (currentSlot.resolutions.resolutionsPerAuthority[0].values.length > 1) {
                        // the synonym matched to more than one value
                        prompt = 'Which would you like';
                        const size = currentSlot.resolutions.resolutionsPerAuthority[0].values.length;

                        currentSlot.resolutions.resolutionsPerAuthority[0].values
                            .forEach((element, index) => {
                                prompt += ` ${(index === size - 1) ? ' or' : ' '} ${element.value.name}`;
                            });

                        prompt += '?';

                        // we're keeping the session open with reprompt()
                        return handlerInput.responseBuilder
                            .speak(prompt)
                            .reprompt(prompt)
                            .addElicitSlotDirective(currentSlot.name)
                            .getResponse();
                    }
                } else if (currentSlot.resolutions.resolutionsPerAuthority[0].status.code === 'ER_SUCCESS_NO_MATCH') {
                    // the slot there but it didn't match a value
                    if (requiredSlots.indexOf(currentSlot.name) > -1) {
                        // it's in the list of required slots
                        prompt = `What ${currentSlot.name} are you looking for`;

                        // we're keeping the session open with reprompt()
                        return handlerInput.responseBuilder
                            .speak(prompt)
                            .reprompt(prompt)
                            .addElicitSlotDirective(currentSlot.name)
                            .getResponse();
                    }
                }
            }
        }
        // the slot was missing. Let Alexa elicit for it as defined in the interaction model.
        return handlerInput.responseBuilder
            .addDelegateDirective(currentIntent)
            .getResponse();
    }
};

const CompletedEventsIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
        handlerInput.requestEnvelope.request.intent.name === FindEventsIntent &&
        handlerInput.requestEnvelope.request.dialogState === 'COMPLETED';
    },
    async handle(handlerInput) {
        const filledSlots = handlerInput.requestEnvelope.request.intent.slots;
        const slotValues = ssmlHelper.getSlotValues(filledSlots);
        const params = buildParams(slotValues);
        const options = httpsHelper.buildOptions(params, api, process.env.PARKS_APP_TOKEN);

        let speechOutput = '';
        let displayOutput = '';

        try {
            const parkEvents = await httpsHelper.httpGet(options);

            if (parkEvents.length > 0) {
                let summary = [];

                summary.push(`There are ${parkEvents.length} events on ${slotValues.StartDate.resolved}. They are:`);
                for (var i = 0; i < parkEvents.length; i++) {
                    summary.push(ssmlHelper.cleanUpSSML(parkEvents[i].event_description) + ' at ' + ssmlHelper.cleanUpSSML(parkEvents[i].park_facility_name));
                }
                speechOutput = displayOutput = `${ssmlHelper.convertArrayToReadableString(summary, '.')}`;
            } else {
                speechOutput = displayOutput = `There are no events for ${slotValues.StartDate.synonym}`;
            }
        } catch (error) {
            speechOutput = displayOutput = errorMessage;
            console.log(`Intent: ${handlerInput.requestEnvelope.request.intent.name}: message: ${error.message}`);
        }

        // We are closing the session here by not specifying a reprompt()
        return handlerInput.responseBuilder
            .speak(speechOutput)
            .withSimpleCard(title, displayOutput)
            .getResponse();
    }
};

exports.InProgressEventsIntentHandler = InProgressEventsIntentHandler;
exports.CompletedEventsIntentHandler = CompletedEventsIntentHandler;
