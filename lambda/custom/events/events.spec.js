/* eslint-env mocha */

const chai = require('chai');
const assert = chai.assert;

describe('Chicago Parks Skill tests', function() {
    this.timeout(10000); // To disable timeout: this.timeout(0);

    describe('Interaction tests', function() {
        it('Launches successfully', async function() {
            const va = require('virtual-alexa');
            const alexa = va.VirtualAlexa.Builder()
                .handler('events/events.handler') // Lambda function file and name e.g. 'index.handler'
                .interactionModelFile('../../models/en-US.json') // intent schema and sample utterances
                .create();

            let reply = await alexa.launch();
            assert.include(reply.response.outputSpeech.ssml, 'Welcome to Chicago Parks');
        });

        it('Offers help', async function() {
            const va = require('virtual-alexa');
            const alexa = va.VirtualAlexa.Builder()
                .handler('events/events.handler') // Lambda function file and name e.g. 'index.handler'
                .interactionModelFile('../../models/en-US.json') // intent schema and sample utterances
                .create();

            let reply = await alexa.launch();
            reply = await alexa.utter('help');
            assert.include(reply.response.outputSpeech.ssml, 'You can tell me');
        });

        it('Finds events', async function() {
            const va = require('virtual-alexa');
            const alexa = va.VirtualAlexa.Builder()
                .handler('events/events.handler') // Lambda function file and name e.g. 'index.handler'
                .interactionModelFile('../../models/en-US.json') // intent schema and sample utterances
                .create();

            // An intent that has delegated dialogs such as EventCheck.
            // alexa.intend() is what the user would do and it returns a promise.
            let dialogReply = await alexa.intend('EventCheck');
            assert.equal(dialogReply.skillResponse.directive('Dialog.Delegate').type, 'Dialog.Delegate');
            assert.equal(dialogReply.prompt, 'When do you want to go to the event?');
            let skillReply = await alexa.intend('EventCheck', {StartDate: '2018-05-25'});
            assert.include(skillReply.response.outputSpeech.ssml, 'There are');
        });
    });
});
