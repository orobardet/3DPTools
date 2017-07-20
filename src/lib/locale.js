'use strict';

module.exports = app => {

    this.localizeFormErrors = (res, messages) => {
        let localizedMessages = {};

        for (const field of Object.keys(messages)) {
            localizedMessages[field] = [];
            if (messages[field].length) {
                for (const message of messages[field]) {
                    localizedMessages[field].push(res.__(message));
                }
            }
        }

        return localizedMessages;
    };

    return this;
};
