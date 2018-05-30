'use strict';
const ssmlHelper = require('../helpers/ssmlHelper');
const httpsHelper = require('../helpers/httpsHelper');
const moment = require('moment-timezone');

const title = 'Chicago Parks';
const errorMessage = 'Sorry, there was an error reaching the Park District movie listings.';

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

        const today = moment().tz('America/Chicago').format('YYYY-MM-DD');

        // if there's no date assume they want movies for today.
        if (slotValues['Date'].resolved === undefined) {
            slotValues['Date'].synonym = slotValues['Date'].resolved = today;
        } else {
            slotValues['Date'].resolved = moment(slotValues['Date'].synonym).format('YYYY-MM-DD');
        }

        const params = buildParams(slotValues);
        const options = httpsHelper.buildOptions(params, api, process.env.PARKS_APP_TOKEN);

        let speechOutput = '';
        let displayOutput = '';

        try {
            const movies = await httpsHelper.httpGet(options);

            if (movies.length === 1) {
                speechOutput = `${movies[0].title}, rated ${movies[0].rating}, is showing on ${moment(movies[0].date).format('dddd MMM Do')} at ${movies[0].park}, located at ${movies[0].park_address}. It begins at dusk.`;
                displayOutput = `${moment(movies[0].date).format('dddd MMM Do')}\n${movies[0].title} - ${movies[0].rating}\n${movies[0].park}\n${movies[0].park_address}`;
            } else {
                if (movies.length > 0) {
                    let speechSummary = [];
                    let displaySummary = [];

                    speechSummary.push(`There are ${movies.length} movies showing on ${moment(slotValues.Date.resolved).format('dddd MMM Do')}. They are:`);
                    displaySummary.push(`${moment(slotValues.Date.resolved).format('dddd MMM Do')}`);
                    for (var i = 0; i < movies.length; i++) {
                        speechSummary.push(ssmlHelper.cleanUpSSML(`${movies[i].title}, rated ${movies[i].rating}, at ${movies[i].park}, located at ${movies[i].park_address}`));
                        displaySummary.push(ssmlHelper.cleanUpSSML(`\n${movies[i].title} - ${movies[i].rating}\n${movies[i].park}\n${movies[i].park_address}`));
                    }
                    speechOutput = `${ssmlHelper.convertArrayToReadableString(speechSummary, '.')}. All movies begin at dusk.`;
                    displayOutput = `${ssmlHelper.convertArrayToDisplayableString(displaySummary, '.')}`;
                } else {
                    speechOutput = displayOutput = `There are no movies showing for ${moment(slotValues.Date.resolved).format('dddd MMM Do')}`;
                }
            }
        } catch (error) {
            speechOutput = errorMessage;
            displayOutput = error.message;
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
