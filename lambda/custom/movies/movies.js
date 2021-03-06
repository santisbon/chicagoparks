'use strict';
const helper = require('alexa-helper');
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
        const slotValues = helper.ssmlHelper.getSlotValues(filledSlots);

        const today = moment().tz('America/Chicago').format('YYYY-MM-DD');
        let SoQL;

        if (slotValues['Date'].resolved === undefined) {
            // there's no date so assume they want movies for today
            slotValues['Date'].synonym = slotValues['Date'].resolved = today;
        } else if (slotValues['Date'].resolved.includes('W')) {
            // they want a weekend or week
            let parts = slotValues['Date'].resolved.split('W'); // e.g. "2018W22WE", "2018W4WE", or "2018W22"
            delete slotValues['Date']; // remove date from the regular query string params, we'll use it in our SoQL query

            let weekNumber = parseInt(parts[1]);
            let monday = moment().tz('America/Chicago').week(weekNumber).day('Monday').format('YYYY-MM-DD');
            let friday = moment().tz('America/Chicago').week(weekNumber).day('Friday').format('YYYY-MM-DD');
            let sunday = moment().tz('America/Chicago').week(weekNumber + 1).day('Sunday').format('YYYY-MM-DD');

            if (parts.length > 2 && parts[2] === 'E') { // e.g. "2018W14WE" split by 'W' characters
                // they want the weekend
                if (today > friday) {
                    // they want this weekend and the weekend already started
                    SoQL = `date between '${today}' and '${sunday}'`;
                } else {
                    // they want this weekend and the weekend has not started yet
                    SoQL = `date between '${friday}' and '${sunday}'`;
                }
            } else {
                // they want the entire week
                if (monday <= today) {
                    // this week
                    SoQL = `date between '${today}' and '${sunday}'`;
                } else {
                    // some other week
                    SoQL = `date between '${monday}' and '${sunday}'`;
                }
            }
        } else if (slotValues['Date'].resolved.length === 6) {
            // they want a month e.g. 201806
            let startDate = moment(slotValues['Date'].synonym + '01').format('YYYY-MM-DD');
            let endOfMonth = moment(slotValues['Date'].synonym + '01').endOf('month').format('YYYY-MM-DD');
            delete slotValues['Date']; // remove date from the regular query string params, we'll use it in our SoQL query

            if (startDate <= today) {
                // this month, start from today instead of the whole month
                SoQL = `date between '${today}' and '${endOfMonth}'`;
            } else {
                // some other month
                SoQL = `date between '${startDate}' and '${endOfMonth}'`;
            }
        } else {
            // they want a specific date
            slotValues['Date'].resolved = moment(slotValues['Date'].synonym).format('YYYY-MM-DD');
        }

        const params = buildParams(slotValues, SoQL);
        const options = helper.httpsHelper.buildOptions(params, api, process.env.PARKS_APP_TOKEN);

        let speechOutput = '';
        let displayOutput = '';

        try {
            const movies = await helper.httpsHelper.httpGet(options);

            if (movies.length === 1) {
                speechOutput = `${movies[0].title}, rated ${movies[0].rating}, is playing on ${moment(movies[0].date).format('dddd MMM Do')} at ${movies[0].park}, located at ${movies[0].park_address}. It begins at dusk.`;
                displayOutput = `${moment(movies[0].date).format('dddd MMM Do')}\n${movies[0].title} - ${movies[0].rating}\n${movies[0].park}\n${movies[0].park_address}`;
            } else {
                if (movies.length > 0) {
                    let speechSummary = [];
                    let displaySummary = [];

                    speechSummary.push(`There are ${movies.length} movies playing. They are:`);

                    for (var i = 0; i < movies.length; i++) {
                        speechSummary.push(helper.ssmlHelper.cleanUpSSML(`On ${moment(movies[i].date).format('dddd MMM Do')}: ${movies[i].title}, rated ${movies[i].rating}, at ${movies[i].park}, located at ${movies[i].park_address}`));
                        displaySummary.push(helper.ssmlHelper.cleanUpSSML(`\n\n${moment(movies[i].date).format('dddd MMM DD')} - ${movies[i].title} - ${movies[i].rating}\n${movies[i].park}\n${movies[i].park_address}`));
                    }
                    speechOutput = `${helper.ssmlHelper.convertArrayToReadableString(speechSummary, '.')}. All movies begin at dusk.`;
                    displayOutput = `${helper.ssmlHelper.convertArrayToDisplayableString(displaySummary, '.')}`;
                } else {
                    speechOutput = displayOutput = `There are no movies playing on that date.`;
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
