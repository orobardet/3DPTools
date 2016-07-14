module.exports = function (app) {
    var api = {
        'setOriginUrl': 'setOriginUrl',
        'getOriginUrl': 'getOriginUrl'
    };

    var applyAPItoObject = function(object) {
        if (!object) {
            return;
        }
        // attach to itself if not provided
        for (var method in api) {
            if (api.hasOwnProperty(method)) {
                var alias = api[method];

                // be kind rewind, or better not touch anything already existing
                if (!object[alias]) {
                    object[alias] = originUrl[method].bind(object);
                }
            }
        }
    };

    var originUrl = {};

    originUrl.setOriginUrl = function(name, url) {
        if (!this.session) {
            return;
        }

        if (!this.session.originUrl) {
            this.session.originUrl = {};
        }

        if (Array.isArray(name)) {
            var that = this;
            name.forEach(function(aName) {
                that.setOriginUrl(aName, url);
            });
        } else {
            this.session.originUrl[name] = url;
        }
    };

    originUrl.getOriginUrl = function(name, defaultUrl) {
        if (!defaultUrl) {
            defaultUrl = null;
        }
        if (!this.session) {
            return defaultUrl;
        }
        if (!this.session.originUrl) {
            return defaultUrl;
        }

        if (this.session.originUrl[name]) {
            return this.session.originUrl[name];
        } else {
            return defaultUrl;
        }
    };

    applyAPItoObject(app.locals);

    app.use(function (req, res, next) {
        applyAPItoObject(req);
        next();
    });

    return originUrl;
};