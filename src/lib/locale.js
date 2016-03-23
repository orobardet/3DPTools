module.exports = function (app) {

    this.localizeFormErrors = function (res, messages) {
        var localizedMessages = {};

        for (var field in messages) {
            localizedMessages[field] = [];
            if (messages[field].length) {
                messages[field].forEach(function (message) {
                    localizedMessages[field].push(res.__(message));
                });
            }
        }

        return localizedMessages;
    };

    return this;
};
