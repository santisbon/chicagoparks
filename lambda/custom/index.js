const Alexa = require('ask-sdk');

const eventsHandlers = require('./events/events');
const builtinHandlers = require('./builtinIntents/handlers');

let skill;

exports.handler = async function(event, context) {
    // console.log(`REQUEST++++${JSON.stringify(event)}`);

    if (!skill) {
        skill = Alexa.SkillBuilders.custom()
            .addRequestHandlers(
                builtinHandlers.LaunchRequestHandler,
                eventsHandlers.InProgressEventsIntentHandler,
                eventsHandlers.CompletedEventsIntentHandler,
                builtinHandlers.HelpIntentHandler,
                builtinHandlers.CancelAndStopIntentHandler,
                builtinHandlers.SessionEndedRequestHandler
            )
            .addErrorHandlers(builtinHandlers.ErrorHandler)
            .withSkillId(process.env.APP_ID)
            .create();
    }

    return skill.invoke(event, context);
};
