'use strict';
const ssmlHelper = require('../helpers/ssmlHelper');
const httpsHelper = require('../helpers/httpsHelper');

const title = 'Chicago Parks';
const errorMessage = 'Sorry, there was an error reaching the Park District.';

const api = {
    hostname: 'data.cityofchicago.org',
    resource: '/resource/dan6-dh2g.json'
};

const FindMoviesIntent = 'FindMoviesIntent';

/**
 * The url params that the api takes.
 * @param {*} slotValues
 */
function buildParams(slotValues) {
    return [
        [
            'Date',
            `${slotValues.Date.resolved}`
        ]
        // ['$where',
        //    `${eventsSoQL}`]
    ];
}

const FindMoviesIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
        handlerInput.requestEnvelope.request.intent.name === FindMoviesIntent;
    },
    async handle(handlerInput) {
        const filledSlots = handlerInput.requestEnvelope.request.intent.slots;
        const slotValues = ssmlHelper.getSlotValues(filledSlots);

        // if there's no date assume they want movies for today.
        if (slotValues['Date'].resolved === undefined) {
            slotValues['Date'].synonym = slotValues['Date'].resolved = new Date();
        }
        const params = buildParams(slotValues);

        const options = httpsHelper.buildOptions(params, api, process.env.PARKS_APP_TOKEN);

        let speechOutput = '';
        let displayOutput = '';

        try {
            const movies = await httpsHelper.httpGet(options);

            if (movies.length > 0) {
                let summary = [];

                summary.push(`There are ${movies.length} movies on ${slotValues.Date.resolved}. They are:`);
                for (var i = 0; i < movies.length; i++) {
                    summary.push(ssmlHelper.cleanUpSSML(movies[i].title) + ' at ' + ssmlHelper.cleanUpSSML(movies[i].park));
                }
                speechOutput = displayOutput = `${ssmlHelper.convertArrayToReadableString(summary, '.')}`;
            } else {
                speechOutput = displayOutput = `There are no movies for ${slotValues.Date.synonym}`;
                console.log(options);
            }
        } catch (error) {
            speechOutput = displayOutput = errorMessage;
            console.log(`Intent: ${handlerInput.requestEnvelope.request.intent.name}: message: ${error.message}`);
        }

        // we're not keeping the session open
        return handlerInput.responseBuilder
            .speak(speechOutput)
            // .reprompt('')
            .withSimpleCard(title, displayOutput)
            .getResponse();
    }
};

exports.FindMoviesIntentHandler = FindMoviesIntentHandler;
