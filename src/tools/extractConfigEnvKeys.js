'use strict';

function extractKey(data, separator) {
    let keys = [];

    for (let [key, value] of Object.entries(data)) {

        if (Object.prototype.toString.call(value) === "[object Object]") {
            let subValues = extractKey(value, separator).map(name => key+separator+name);
            keys = keys.concat(subValues);

        } else {
            keys.push(key);
        }
    }

    return keys;
}

module.exports = function (config, separator) {

    const defaultConfig = require(config);

    return extractKey(defaultConfig, separator);

};