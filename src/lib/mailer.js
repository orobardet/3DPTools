'use strict';

const util = require('util');
const nodemailer = require('nodemailer');
const ejs = require('ejs');
const ejsRenderFile = util.promisify(ejs.renderFile);
const marked = require('marked');
const moment = require('moment');

const templatePath = 'views/emails/';
const templateLayoutFile = templatePath + 'layout.ejs';

module.exports = class {
    constructor(config, i18n) {
        this.mailerEnabled = false;

        if (!config ||Object.prototype.toString.call(config) !== "[object Object]") {
            return;
        }
        if (!config.enabled || config.enabled === false) {
            return;
        }
        if (!config.smtp || !config.smtp.host || config.host === "") {
            return;
        }
        if (!config.from || !config.from.mail || config.from.mail === "") {
            return;
        }

        this.config = config;

        let nodemailerConfig = {
            host: config.smtp.host
        };
        if (typeof config.smtp.port !== 'undefined') {
            nodemailerConfig.port = config.smtp.port;
        }
        if (typeof config.smtp.secure === 'boolean') {
            nodemailerConfig.secure = config.smtp.secure;
        }
        if (config.smtp.user && config.smtp.pass) {
            nodemailerConfig.auth = {
                user: config.smtp.user,
                pass: config.smtp.pass
            };
        }

        if (config.debug) {
            nodemailerConfig.logger = true;
            if (config.verboseDebug) {
                nodemailerConfig.debug = true;
            }
        }

        this.nodemailerConfig = nodemailerConfig;

        this.i18n = i18n;
    }

    /**
     * Connect to the mail transport to check of the configuration is ok
     *
     * @returns {Promise.<boolean>}
     */
    async connect() {
        if (!this.nodemailerConfig) {
            return false;
        }

        this.mailerEnabled = false;
        this.mailTransporter = nodemailer.createTransport(this.nodemailerConfig);

        if (this.config.testConnection && this.config.testConnection === true) {
            try {
                if (await this.mailTransporter.verify()) {
                    this.mailerEnabled = true;
                }
            } catch (err) {
                this.mailerEnabled = false;
            }
        } else {
            this.mailerEnabled = true;
        }
        return true;
    }

    /**
     * Tells if the mailling feature is enabled and usable
     *
     * @returns {boolean}
     */
    isMailerEnabled() {
        return this.mailerEnabled;
    }

    /**
     * Send an email
     *
     * Accepter options are the those of [Nodemailer](https://nodemailer.com/message/), plus :
     *  - `template`: name of an EJS template to use
     *  - `templateData`: object containing data to pass to the EJS template (ignored if `template` is absent)
     *
     * If `template` is given, `html` and `text` will be ignored.
     *
     * @param options
     * @returns {Promise.<boolean>}
     */
    async sendMail(options) {
        if (!this.isMailerEnabled()) {
            return false;
        }

        let msgOptions = Object.assign({}, options);

        let from = this.config.from.mail;
        if (this.config.from.name && this.config.from.name !== "") {
            from = `"${this.config.from.name}" <${this.config.from.mail}>`;
        }
        msgOptions.from = from;

        try {
            await this._prepareMailContent(msgOptions);

            let result = await this.mailTransporter.sendMail(msgOptions);
            if (result && result.accepted && result.accepted.length) {
                return true;
            } else {
                return false;
            }
        } catch (err) {
            throw err;
        }
    }

    /**
     * Construct email content using template and data if given
     *
     * @param options
     * @returns {Promise.<void>}
     * @private
     */
    async _prepareMailContent(options) {
        if (!options.template || options.template === "") {
            return;
        }

        let templateData = options.templateData || {};

        if (this.i18n && this.i18n.init) {
            this.i18n.init(templateData);
            if (options.locale && options.locale !== "") {
                templateData.setLocale(options.locale);
            }
        }

        moment.locale(templateData.getLocale());
        templateData.marked = marked;
        templateData.moment = moment;

        templateData['body'] = await ejsRenderFile(templatePath + options.template, templateData);
        options.html = await ejsRenderFile(templateLayoutFile, templateData);

        delete options.text;
        delete options.template;
        delete options.templateData;
    }
};
