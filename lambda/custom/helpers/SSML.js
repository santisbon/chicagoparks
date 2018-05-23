function cleanUpSSML(input) {
    var output = input.replace('&', 'and');
    output = output.replace('#', 'number ');
    output = output.replace('(Non-exclusive Use)', '');
    // var texttoDelete = output.substring(output.indexOf("#"));
    // output = output.replace(texttoDelete, '');

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

exports.cleanUpSSML = cleanUpSSML;
exports.convertArrayToReadableString = convertArrayToReadableString;
