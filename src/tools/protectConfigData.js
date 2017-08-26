'use strict';

function protectData(data, blacklist, censorText) {

    let protectedConfig = {};

    for (let [key, value] of Object.entries(data)) {
        let censored = false;
        protectedConfig[key] = value;
        for (let rexp of blacklist) {
            if (key.match(rexp)) {
                if (Object.prototype.toString.call(value) == "[object Array]") {
                    if (value.length) {
                        protectedConfig[key] = [censorText];
                    }
                } else if (Object.prototype.toString.call(value) == "[object Object]") {
                    if (Object.keys(value).length) {
                        protectedConfig[key] = {};
                        protectedConfig[key][censorText] = censorText;
                    }
                } else if (Object.prototype.toString.call(value) == "[object String]") {
                    if (value.length) {
                        protectedConfig[key] = censorText;
                   }
                } else {
                    protectedConfig[key] = censorText;
                }
                censored = true;
                break;
            }
        }
        if (!censored && Object.prototype.toString.call(value) === "[object Object]") {
            protectedConfig[key] = protectData(value, blacklist, censorText)
        }
    }

    return protectedConfig;
}

module.exports = function (config, blacklist, censorText) {
    return protectData(config, blacklist, censorText);
};
