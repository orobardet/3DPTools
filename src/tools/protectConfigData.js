'use strict';

function protectData(data, blacklist, censorText) {

    let protectedConfig = {};

    for (let [key, value] of Object.entries(data)) {

        if (Object.prototype.toString.call(value) === "[object Object]") {
            protectedConfig[key] = protectData(value, blacklist, censorText)
        } else {
            protectedConfig[key] = value;
            for (let rexp of blacklist) {
                if (key.match(rexp)) {
                    protectedConfig[key] = censorText;
                    break;
                }
            }
        }
    }

    return protectedConfig;
}

module.exports = function (config, blacklist, censorText) {
    return protectData(config, blacklist, censorText);
};
