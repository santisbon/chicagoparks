/**
 * Speech Synthesis Markup Language (SSML) helper.
 */

function cleanUpSSML(input) {
    var output = input.replace('&', 'and');
    output = output.replace('#', 'number ');
    output = output.replace('(Non-exclusive Use)', '');
    return output;
}

function convertArrayToReadableString(array, separator) {
    var readableString = ``;
    for (var i = 0; i < array.length; i++) {
        if (i === (array.length - 1)) {
            // last item
            readableString += `and ${array[i]}.`;
        } else {
            // any item except the last
            readableString += `${array[i]}${separator} `;
        }
    }
    return readableString;
}

function convertArrayToDisplayableString(array, separator) {
    var readableString = ``;
    for (var i = 0; i < array.length; i++) {
        readableString += `\n${array[i]}${separator} `;
    }
    return readableString;
}

function getSlotValues(filledSlots) {
    const slotValues = {};

    // console.log(`The filled slots: ${JSON.stringify(filledSlots)}`);
    Object.keys(filledSlots).forEach((item) => {
        const name = filledSlots[item].name;

        if (filledSlots[item] &&
        filledSlots[item].resolutions &&
        filledSlots[item].resolutions.resolutionsPerAuthority[0] &&
        filledSlots[item].resolutions.resolutionsPerAuthority[0].status &&
        filledSlots[item].resolutions.resolutionsPerAuthority[0].status.code) {
            switch (filledSlots[item].resolutions.resolutionsPerAuthority[0].status.code) {
            case 'ER_SUCCESS_MATCH':
                slotValues[name] = {
                    synonym: filledSlots[item].value,
                    resolved: filledSlots[item].resolutions.resolutionsPerAuthority[0].values[0].value.name,
                    isValidated: true
                };
                break;
            case 'ER_SUCCESS_NO_MATCH':
                slotValues[name] = {
                    synonym: filledSlots[item].value,
                    resolved: filledSlots[item].value,
                    isValidated: false
                };
                break;
            default:
                break;
            }
        } else {
            slotValues[name] = {
                synonym: filledSlots[item].value,
                resolved: filledSlots[item].value,
                isValidated: false
            };
        }
    }, this);

    return slotValues;
}

exports.cleanUpSSML = cleanUpSSML;
exports.convertArrayToReadableString = convertArrayToReadableString;
exports.convertArrayToDisplayableString = convertArrayToDisplayableString;
exports.getSlotValues = getSlotValues;
