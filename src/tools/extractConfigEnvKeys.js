'use strict';

function extractKey(data, separator) {
    let keys = [];

    for (let [key, value] of Object.entries(data)) {

        if (Object.prototype.toString.call(value) === "[object Object]") {
            let subValues = extractKey(value, separator).map(name => key+separator+name);
            if (subValues.length) {
                keys = keys.concat(subValues);
            } else {
                keys.push(key+".*");
            }
        } else {
            keys.push(key);
        }
    }

    return keys;
}

module.exports = function (config, separator) {

    let defaultConfig = config;
    if (! config instanceof Object) {
        defaultConfig = require(config);
    }

    return extractKey(defaultConfig, separator);
};
