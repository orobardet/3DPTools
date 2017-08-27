'use strict';

const nodemailer = require('nodemailer');

module.exports = class {
    constructor(config) {
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

    isMailerEnabled() {
        return this.mailerEnabled;
    }

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
            let result = await this.mailTransporter.sendMail(msgOptions);
        } catch (err) {
            throw err;
        }
    }
};
