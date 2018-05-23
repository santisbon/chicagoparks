// use 'ask-sdk' if standard SDK module is installed or 'ask-sdk-core'
const Alexa = require('ask-sdk');
const SSML = require('./helpers/SSML');
const httpsHelper = require('./helpers/httpsHelper');

/**
 * The Socrata APIs provide rich query functionality through a query language called
 * “Socrata Query Language” or “SoQL”.
 * Uncomment to specify a query and use it when building request params.
 */
// const SoQL = ``;

const title = '';
const eventsErrorMessage = '';

const requiredSlots = [
    'StartDate'
];

const EventCheckIntent = 'EventCheck';

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
        const attributesManager = handlerInput.attributesManager;
        const requestAttributes = attributesManager.getRequestAttributes();
        const speechOutput = `${requestAttributes.t('WELCOME')} ${requestAttributes.t('HELP')}`;

        // we're keeping the session open with reprompt()
        return handlerInput.responseBuilder
            .speak(speechOutput)
            .reprompt(speechOutput)
            .withSimpleCard(title, speechOutput)
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
        handlerInput.requestEnvelope.request.intent.name === EventCheckIntent &&
        handlerInput.requestEnvelope.request.dialogState === 'COMPLETED';
    },
    async handle(handlerInput) {
        const filledSlots = handlerInput.requestEnvelope.request.intent.slots;
        const slotValues = SSML.getSlotValues(filledSlots);
        const eventsOptions = httpsHelper.buildEventsOptions(slotValues);

        let speechOutput = '';
        let displayOutput = '';

        try {
            const response = await httpsHelper.httpGet(eventsOptions);
            // const lastResult = response[response.length - 1];

            if (response.length > 0) {
                // You can use:
                // ${slotValues.StartDate.synonym}
                // ${slotValues.StartDate.resolved}
                // ${lastResult.some_value}
                speechOutput =
                ``;
                displayOutput =
                ``;
            } else {
                speechOutput = displayOutput = `I am sorry. I could not find a match for ${slotValues.StartDate.synonym}`;
                console.log(eventsOptions);
            }
        } catch (error) {
            speechOutput = displayOutput = eventsErrorMessage;
            console.log(`Intent: ${handlerInput.requestEnvelope.request.intent.name}: message: ${error.message}`);
        }

        // More options: https://github.com/alexa/alexa-skills-kit-sdk-for-nodejs/wiki/response-building
        // We are closing the session here by not specifying a reprompt()
        return handlerInput.responseBuilder
            .speak(speechOutput)
            .withSimpleCard(title, displayOutput)
            .getResponse();
    }
};
