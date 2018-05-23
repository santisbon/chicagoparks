module.exports = function cleanUpSSML(input) {
    var output = input.replace('&', 'and');
    output = output.replace('#', 'number ');
    output = output.replace('(Non-exclusive Use)', '');
    // var texttoDelete = output.substring(output.indexOf("#"));
    // output = output.replace(texttoDelete, '');

    return output;
};
