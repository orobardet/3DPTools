'use strict';

const fs = require('fs-extra');
const packageInfo = require('package.json');
const moment = require('moment');
const color = require('color');
const yaml = require('js-yaml');
const parseDuration = require('parse-duration');

// List of the config key that can have an duration expressed in string, like "1 month" or "1h 5mins".
// These keys will be parsed and converted to int, as a number of second value.
// The unit (seconds) can be customized in the list below: the value of each key is a divider that will be used to
// convert the int duration value from seconds. e.g. a divider of 60 will set the value in minutes, a divider of 0.001
// will set the value in milliseconds
// Each converted key will have its original (string) value store in the config using the same key name with a '_StringValue' suffix.
//
// Note: if the value of the key is already detected as something else of a string, or a string representing a full valid
// integer, it will not be converted, and stay untouched
const stringDurationKeys = {
    'session:stayConnected:expiration': 60
};

class ConfigLoader {

    constructor(app, bootstrapOptions) {
        this.config = require("nconf");
        this.app = app;
        this.bootstrapOptions = bootstrapOptions;
    }

    setupConfig() {
        this.internalConfig = require('config/internal.json');
        this.config.use('memory');
        this.config.argv({
            "c": {
                alias: 'config-file',
                description: 'Configuration file to load',
                required: false,
                type: 'string'
            },
            "h": {
                alias: 'help',
                description: 'Show this help'
            }
        }, "Launch 3DPTools web app");

        this.jsonDefaultConfig = yaml.safeLoad(fs.readFileSync(process.cwd() + '/config/default.yml', 'utf8'));
    }

    loadEnv() {
        const configEnvKeys = require('./extractConfigEnvKeys')(this.jsonDefaultConfig, '__').concat(this.internalConfig.overridableInternals || []);
        this.config.env({
            separator: '__',
            whitelist: configEnvKeys
        });
    }

    loadConfigFile() {
        if (this.config.get('config-file')) {
            this.config.overrides(yaml.safeLoad(fs.readFileSync(this.config.get('config-file'), 'utf8')));
        }
    }

    loadDefaults() {
        delete this.internalConfig.overridableInternals;
        this.config.overrides(this.internalConfig);
        this.config.defaults(this.jsonDefaultConfig);
        if (this.bootstrapOptions.initCliOptions) {
            if (this.config.get('help')) {
                this.config.stores.argv.showHelp('log');
                process.exit(0);
            }
        }
    }

    publishToApp() {
        this.app.locals.config = this.config;
        this.app.locals.moment = moment;
        this.app.locals.Color = color;
        this.app.config = this.config;
        this.app.set('config', this.config);
    }

    doPostProcess() {
        // Process version
        let appVersion = this.config.get('version');
        let appVersionSuffix = this.config.get('versionSuffix');
        if (packageInfo && packageInfo.version) {
            appVersion =  packageInfo.version;
        }
        if (appVersionSuffix && appVersionSuffix.length) {
            appVersion += "-" + appVersionSuffix;
        }
        this.config.set('version', appVersion);

        // Process changelog
        if (fs.existsSync(this.config.get('sourceCode:changelog:filePath'))) {
            this.app.locals.changelogAvailable = true;
        }

        // Process doc
        let documentationRoot = this.config.get('doc:root');
        if (fs.existsSync(documentationRoot)) {
            let stats = fs.stat(documentationRoot).then((stats) => {
                if (stats.isDirectory()) {
                    this.app.locals.documentationAvailable = true;
                }
            });
        }

        // Process sentry
        if (!this.config.get('sentry:enabled') || !this.config.get('sentry:dsn') || this.config.get('sentry:dsn') === "") {
            this.config.set('sentry:enabled', false);
        }

        // Compute config duration
        for (let key in stringDurationKeys) {
            let configValue = this.config.get(key);
            if (typeof configValue === 'undefined' || typeof configValue !== 'string') {
                continue;
            }
            let divider = stringDurationKeys[key];
            if (divider <= 0) {
                divider = 1;
            }

            // Is already an integer?
            let isInt = Number.parseInt(configValue, 10);
            if (isInt.toString() === configValue) {
                continue;
            }

            let parsedValue = parseDuration(configValue) / 1000 / divider;

            this.config.set(key, parsedValue);
            this.config.set(key+'_StringValue', configValue);
        }
    }

    loadConfig() {
        this.setupConfig();
        this.loadEnv();
        this.loadConfigFile();
        this.loadDefaults();
        this.publishToApp();
        this.doPostProcess();

        return this.config;
    }
}

module.exports = function (app, bootstrapOptions) {
    //return configLoader(app, bootstrapOptions);
    const loader = new ConfigLoader(app, bootstrapOptions);
    return loader.loadConfig();
};
