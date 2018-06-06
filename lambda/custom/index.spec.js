/* eslint-env mocha */

const chai = require('chai');
const assert = chai.assert;
const moment = require('moment-timezone');

describe('Chicago Parks Skill tests', function() {
    this.timeout(10000); // To disable timeout: this.timeout(0);

    describe('Built-in intent tests', function() {
        it('Launches successfully', async function() {
            const va = require('virtual-alexa');
            const alexa = va.VirtualAlexa.Builder()
                .handler('index.handler') // Lambda function file and name e.g. 'index.handler'
                .interactionModelFile('../../models/en-US.json') // intent schema and sample utterances
                .create();

            let reply = await alexa.launch();
            assert.include(reply.response.outputSpeech.ssml, 'Welcome to Chicago Parks');
        });

        it('Offers help', async function() {
            const va = require('virtual-alexa');
            const alexa = va.VirtualAlexa.Builder()
                .handler('index.handler') // Lambda function file and name e.g. 'index.handler'
                .interactionModelFile('../../models/en-US.json') // intent schema and sample utterances
                .create();

            let reply = await alexa.launch();
            reply = await alexa.utter('help');
            assert.include(reply.response.outputSpeech.ssml, 'You can tell me');
        });
    });

    describe('Custom intents tests', function() {
        it('Finds events', async function() {
            const va = require('virtual-alexa');
            const alexa = va.VirtualAlexa.Builder()
                .handler('index.handler') // Lambda function file and name e.g. 'index.handler'
                .interactionModelFile('../../models/en-US.json') // intent schema and sample utterances
                .create();

            // An intent that has delegated dialogs such as FindEventsIntent.
            // alexa.intend() is what the user would do and it returns a promise.
            let dialogReply = await alexa.intend('FindEventsIntent');
            assert.equal(dialogReply.skillResponse.directive('Dialog.Delegate').type, 'Dialog.Delegate');
            assert.equal(dialogReply.prompt, 'When do you want to go to the event?');
            let skillReply = await alexa.intend('FindEventsIntent', {StartDate: '2018-05-25'});
            assert.include(skillReply.response.outputSpeech.ssml, 'There are');
        });

        it('Finds movies when no date specified', async function() {
            const va = require('virtual-alexa');
            const alexa = va.VirtualAlexa.Builder()
                .handler('index.handler') // Lambda function file and name e.g. 'index.handler'
                .interactionModelFile('../../models/en-US.json') // intent schema and sample utterances
                .create();

            let reply = await alexa.launch();
            reply = await alexa.utter('for movies');

            assert.include(reply.response.outputSpeech.ssml, 'playing');
        });

        it('Finds movies for a date with 1 movie', async function() {
            const va = require('virtual-alexa');
            const alexa = va.VirtualAlexa.Builder()
                .handler('index.handler') // Lambda function file and name e.g. 'index.handler'
                .interactionModelFile('../../models/en-US.json') // intent schema and sample utterances
                .create();

            const date = moment('2018-06-01').tz('America/Chicago').format('YYYY-MM-DD');

            let reply = await alexa.launch();
            reply = await alexa.utter(`I want to see a movie on ${date}`);
            // console.log(reply.response);
            assert.include(reply.response.outputSpeech.ssml, 'is playing');
        });

        it('Finds movies for a date with many movies', async function() {
            const va = require('virtual-alexa');
            const alexa = va.VirtualAlexa.Builder()
                .handler('index.handler') // Lambda function file and name e.g. 'index.handler'
                .interactionModelFile('../../models/en-US.json') // intent schema and sample utterances
                .create();

            const date = moment('2018-06-15').tz('America/Chicago').format('YYYY-MM-DD');

            let reply = await alexa.launch();
            reply = await alexa.utter(`I want to see a movie on ${date}`);
            // console.log(reply.response);
            assert.include(reply.response.outputSpeech.ssml, 'There are');
        });

        it('Finds movies for a date with no movies', async function() {
            const va = require('virtual-alexa');
            const alexa = va.VirtualAlexa.Builder()
                .handler('index.handler') // Lambda function file and name e.g. 'index.handler'
                .interactionModelFile('../../models/en-US.json') // intent schema and sample utterances
                .create();

            const date = moment('2018-06-02').tz('America/Chicago').format('YYYY-MM-DD');

            let reply = await alexa.launch();
            reply = await alexa.utter(`I want to see a movie on ${date}`);
            // console.log(reply.response);
            assert.include(reply.response.outputSpeech.ssml, 'There are no movies playing');
        });

        it('Finds movies for this week', async function() {
            const va = require('virtual-alexa');
            const alexa = va.VirtualAlexa.Builder()
                .handler('index.handler') // Lambda function file and name e.g. 'index.handler'
                .interactionModelFile('../../models/en-US.json') // intent schema and sample utterances
                .create();

            const week = moment().tz('America/Chicago').week();

            let reply = await alexa.launch();
            reply = await alexa.utter(`What movies are playing 2018-W${week}`); // Alexa will turn "this weekend" to something like this
            // console.log(reply.response);
            assert.include(reply.response.outputSpeech.ssml, 'playing');
        });

        it('Finds movies for this weekend', async function() {
            const va = require('virtual-alexa');
            const alexa = va.VirtualAlexa.Builder()
                .handler('index.handler') // Lambda function file and name e.g. 'index.handler'
                .interactionModelFile('../../models/en-US.json') // intent schema and sample utterances
                .create();

            const week = moment().tz('America/Chicago').week();

            let reply = await alexa.launch();
            reply = await alexa.utter(`What movies are playing 2018-W${week}-WE`); // Alexa will turn "this weekend" to something like this
            // console.log(reply.response);
            assert.include(reply.response.outputSpeech.ssml, 'playing');
        });

        it('Finds movies for next week', async function() {
            const va = require('virtual-alexa');
            const alexa = va.VirtualAlexa.Builder()
                .handler('index.handler') // Lambda function file and name e.g. 'index.handler'
                .interactionModelFile('../../models/en-US.json') // intent schema and sample utterances
                .create();

            const week = moment().tz('America/Chicago').week() + 1;

            let reply = await alexa.launch();
            reply = await alexa.utter(`What movies are playing 2018-W${week}`); // Alexa will turn "this weekend" to something like this
            // console.log(reply.response);
            assert.include(reply.response.outputSpeech.ssml, 'playing');
        });

        it('Finds movies for next weekend', async function() {
            const va = require('virtual-alexa');
            const alexa = va.VirtualAlexa.Builder()
                .handler('index.handler') // Lambda function file and name e.g. 'index.handler'
                .interactionModelFile('../../models/en-US.json') // intent schema and sample utterances
                .create();

            const week = moment().tz('America/Chicago').week() + 1;

            let reply = await alexa.launch();
            reply = await alexa.utter(`What movies are playing 2018-W${week}-WE`); // Alexa will turn "this weekend" to something like this
            // console.log(reply.response);
            assert.include(reply.response.outputSpeech.ssml, 'playing');
        });

        it('Finds movies for this month', async function() {
            const va = require('virtual-alexa');
            const alexa = va.VirtualAlexa.Builder()
                .handler('index.handler') // Lambda function file and name e.g. 'index.handler'
                .interactionModelFile('../../models/en-US.json') // intent schema and sample utterances
                .create();

            const month = moment().tz('America/Chicago').format('YYYY-MM');

            let reply = await alexa.launch();
            reply = await alexa.utter(`What movies are playing ${month}`);
            // console.log(reply.response);
            assert.include(reply.response.outputSpeech.ssml, 'playing');
        });

        it('Finds movies for next month', async function() {
            const va = require('virtual-alexa');
            const alexa = va.VirtualAlexa.Builder()
                .handler('index.handler') // Lambda function file and name e.g. 'index.handler'
                .interactionModelFile('../../models/en-US.json') // intent schema and sample utterances
                .create();

            const month = moment().add(1, 'month').tz('America/Chicago').format('YYYY-MM');

            let reply = await alexa.launch();
            reply = await alexa.utter(`What movies are playing ${month}`);
            // console.log(reply.response);
            assert.include(reply.response.outputSpeech.ssml, 'playing');
        });
    });
});
