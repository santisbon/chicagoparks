'use strict';

// use 'ask-sdk' if standard SDK module is installed or 'ask-sdk-core'
const Alexa = require('ask-sdk');
const ssmlHelper = require('../helpers/ssmlHelper');
const httpsHelper = require('../helpers/httpsHelper');

/**
 * The Socrata APIs provide rich query functionality through a query language called
 * “Socrata Query Language” or “SoQL”.
 * Uncomment to specify a query and use it when building request params.
 */
// const eventsSoQL = ``;

const title = 'Chicago Parks';

const welcomeMessage = `Welcome to ${title}, what would you like to do? You can ask for help too.`;
const welcomeMessageDisplay = `"I want to see a movie"
"What events start today"
"What's going on this Friday"`;

const eventsErrorMessage = 'Sorry, there was an error reaching the Park District.';
const genericErrorMessage = '';
const helpMessage = `You can tell me you want to see a movie. For other park events, ask what events start today or what's going on this Friday`;
const cancelAndStopMessage = 'Goodbye!';

const eventsRequiredSlots = [
    'StartDate'
];

const eventsApi = {
    hostname: 'data.cityofchicago.org',
    resource: '/resource/v8cj-2mjk.json'
};

const EventCheckIntent = 'EventCheck';

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
        //    `${eventsSoQL}`]
    ];
}

/**
 * The LaunchRequest event occurs when the skill is invoked without a specific intent.
 * The canHandle function returns true if the incoming request is a LaunchRequest.
 * The handle function generates and returns a basic greeting response.
 */
const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
    },
    handle(handlerInput) {
        // we're keeping the session open with reprompt()
        return handlerInput.responseBuilder
            .speak(welcomeMessage)
            .reprompt(helpMessage)
            .withSimpleCard(title, welcomeMessageDisplay)
            .getResponse();
    }
};

/**
 * Handles a WeatherIntent when a required slot is missing.
 * It delegates slot elicitation to Alexa.
 * It also uses entity resolution to ask the user for clarification if
 * a synonym is mapped to two slot values.
 */
const InProgressEventsIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
        handlerInput.requestEnvelope.request.intent.name === EventCheckIntent &&
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
                    if (eventsRequiredSlots.indexOf(currentSlot.name) > -1) {
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
        handlerInput.requestEnvelope.request.intent.name === EventCheckIntent &&
        handlerInput.requestEnvelope.request.dialogState === 'COMPLETED';
    },
    async handle(handlerInput) {
        const filledSlots = handlerInput.requestEnvelope.request.intent.slots;
        const slotValues = ssmlHelper.getSlotValues(filledSlots);
        const eventsParams = buildEventsParams(slotValues);
        const eventsOptions = httpsHelper.buildOptions(eventsParams, eventsApi, process.env.EVENTS_APP_TOKEN);

        let speechOutput = '';
        let displayOutput = '';

        try {
            const parkEvents = await httpsHelper.httpGet(eventsOptions);

            if (parkEvents.length > 0) {
                let eventsSummary = [];

                eventsSummary.push(`There are ${parkEvents.length} events on ${slotValues.StartDate.resolved}. They are:`);
                for (var i = 0; i < parkEvents.length; i++) {
                    eventsSummary.push(ssmlHelper.cleanUpSSML(parkEvents[i].event_description) + ' at ' + ssmlHelper.cleanUpSSML(parkEvents[i].park_facility_name));
                }
                speechOutput = displayOutput = `${ssmlHelper.convertArrayToReadableString(eventsSummary, '.')}`;
            } else {
                speechOutput = displayOutput = `There are no events for ${slotValues.StartDate.synonym}`;
                console.log(eventsOptions);
            }
        } catch (error) {
            speechOutput = displayOutput = eventsErrorMessage;
            console.log(`Intent: ${handlerInput.requestEnvelope.request.intent.name}: message: ${error.message}`);
        }

        // We are closing the session here by not specifying a reprompt()
        return handlerInput.responseBuilder
            .speak(speechOutput)
            .withSimpleCard(title, displayOutput)
            .getResponse();
    }
};

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
        handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        // we're keeping the session open with reprompt()
        return handlerInput.responseBuilder
            .speak(helpMessage)
            .reprompt(helpMessage)
            .withSimpleCard(title, helpMessage)
            .getResponse();
    }
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
        (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent' ||
        handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        return handlerInput.responseBuilder
            .speak(cancelAndStopMessage)
            .withSimpleCard(title, cancelAndStopMessage)
            .getResponse();
    }
};

/**
 * Although you can not return a response with any speech, card or directives after receiving
 * a SessionEndedRequest, the SessionEndedRequestHandler is a good place to put your cleanup logic.
 */
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        // any cleanup logic goes here
        return handlerInput.responseBuilder.getResponse();
    }
};

const ErrorHandler = {
    canHandle(handlerInput, error) {
        // Return true in all cases to create a catch-all handler.
        return error.name.startsWith('AskSdk');
    },
    // we're keeping the session open with reprompt()
    handle(handlerInput, error) {
        return handlerInput.responseBuilder
            .speak(genericErrorMessage)
            .reprompt(genericErrorMessage)
            .getResponse();
    }
};

let skill;

exports.handler = async function(event, context) {
    // console.log(`REQUEST++++${JSON.stringify(event)}`);

    if (!skill) {
        skill = Alexa.SkillBuilders.custom()
            .addRequestHandlers(
                LaunchRequestHandler,
                InProgressEventsIntentHandler,
                CompletedEventsIntentHandler,
                HelpIntentHandler,
                CancelAndStopIntentHandler,
                SessionEndedRequestHandler
            )
            .addErrorHandlers(ErrorHandler)
            .withSkillId(process.env.APP_ID)
            .create();
    }

    return skill.invoke(event, context);
};
