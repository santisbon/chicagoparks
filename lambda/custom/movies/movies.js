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
function buildParams(slotValues, SoQL) {
    var params = [];

    if (slotValues.Date) {
        params.push(['Date', `${slotValues.Date.resolved}`]);
    }

    if (SoQL) {
        params.push(['$where', `${SoQL}`]);
    }

    return params;
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
        let SoQL;

        if (slotValues['Date'].resolved === undefined) {
            // there's no date so assume they want movies for today
            slotValues['Date'].synonym = slotValues['Date'].resolved = today;
        } else if (slotValues['Date'].resolved.includes('W')) {
            // they want a weekend or week
            let parts = slotValues['Date'].resolved.split('W'); // e.g. "2018W22WE", "2018W4WE", or "2018W22"
            delete slotValues['Date']; // eliminate from query string params, we'll use it in our SoQL query

            let weekNumber = parseInt(parts[1]);
            let monday = moment().tz('America/Chicago').week(weekNumber).day('Monday').format('YYYY-MM-DD');
            let friday = moment().tz('America/Chicago').week(weekNumber).day('Friday').format('YYYY-MM-DD');
            let sunday = moment().tz('America/Chicago').week(weekNumber + 1).day('Sunday').format('YYYY-MM-DD');

            if (parts.length > 2 && parts[2] === 'WE') {
                // they want the weekend
                SoQL = `date between '${friday}' and '${sunday}'`;
            } else {
                // they want the entire week
                if (monday < today) {
                    // this week
                    SoQL = `date between '${today}' and '${sunday}'`;
                } else {
                    // some other week
                    SoQL = `date between '${monday}' and '${sunday}'`;
                }
            }
        } else {
            // they want a specific date
            slotValues['Date'].resolved = moment(slotValues['Date'].synonym).format('YYYY-MM-DD');
        }

        const params = buildParams(slotValues, SoQL);
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
