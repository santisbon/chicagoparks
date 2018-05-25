/* eslint-env mocha */

const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;

describe('Chicago Parks Skill tests', function() {
    this.timeout(10000); // To disable timeout: this.timeout(0);

    describe('Onboarding tests', function() {
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

        it('Finds events', function() {
            const va = require('virtual-alexa');
            const alexa = va.VirtualAlexa.Builder()
                .handler('events/events.handler') // Lambda function file and name e.g. 'index.handler'
                .interactionModelFile('../../models/en-US.json') // intent schema and sample utterances
                .create();

            // An intent that has delegated dialogs such as EventCheck.
            // alexa.intend() is what the user would do and it returns a promise.
            alexa.intend('EventCheck').then((response) => {
                assert.equal(response.skillResponse.directive('Dialog.Delegate').type, 'Dialog.Delegate');
                assert.equal(response.prompt, 'When do you want to go to the event?');
                return alexa.intend('EventCheck', {StartDate: '2018-05-25'});
            }).then((dialogResponse) => {
                // console.log(dialogResponse);
                // assert.include(dialogResponse.response.outputSpeech.ssml, 'Example of invalid response. There are');
                expect(dialogResponse.response.outputSpeech.ssml).to.include('There are');
            }).catch((error) => {
                console.log(error);
            });

            // let dialogReply = await alexa.intend('EventCheck', {temperament: 'watch'});
            // assert.equal(dialogReply.prompt, 'Do you prefer high energy or low energy dogs?');
            // let skillReply = await alexa.intend('EventCheck', {energy: 'high'});
            // assert.equal(skillReply.prompt(), 'Done with dialog');
            // assert.include(reply.response.outputSpeech.ssml, 'There are');
        });
    });
});
