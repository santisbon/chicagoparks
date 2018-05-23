module.exports = function convertArrayToReadableString (array, separator) {
    var readableString = ``;
    for (var i = 0; i < array.length; i++){
        if (i === (array.length - 1)) {
            //last item
            readableString += `and ${array[i]}.`;
        }
        else {
            // any item except the last
            readableString += `${array[i]}${separator} `;
        }
    }
    return readableString;
};