'use strict';

const fs = require('fs');
const packageInfo = require('package.json');
const moment = require('moment');
const color = require('color');
const yaml = require('js-yaml');
const parseDuration = require('parse-duration');

class ConfigLoader {

    constructor(app, bootstrapOptions) {
        this.config = require("nconf");
        this.app = app;
        this.bootstrapOptions = bootstrapOptions;
    }

    setupConfig() {
        this.config.file('internal', 'config/internal.json');
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
        const configEnvKeys = require('./extractConfigEnvKeys')(this.jsonDefaultConfig, '__');
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

        // Process sentry
        if (!this.config.get('sentry:enabled') || !this.config.get('sentry:dsn') || this.config.get('sentry:dsn') === "") {
            this.config.set('sentry:enabled', false);
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
