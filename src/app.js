'use strict';

module.exports = function(bootstrapOptions) {
    const merge = require('merge');
    const fs = require('fs');
    const fmt = require('util').format;
    const packageInfo = require('./package.json');
    const Raven = require('raven');
    const debug = require('debug')('3DPTools');
    const cookieParser = require('cookie-parser');

    bootstrapOptions = merge({
        loadConfig: true,
        initCliOptions: true,
        initSentry: true,
        initSession: true,
        initDb: true,
        initI18n: true,
        initViews: true,
        initLogger: true,
        loadComponents: true,
        loadNavigation: true,
        setupHttpRouting: true
    }, bootstrapOptions);

    const express = require('express');
    let config = null;

    // Create Express App
    let app = express();
    app.locals = {
        siteTitle: '3DPTools',
        navModule: 'unknown',
        showNavbar: true,
        environment: process.env.NODE_ENV
    };
    app.debug = debug;

    // Load configuration
    if (bootstrapOptions.loadConfig) {
        config = require("nconf");
        const moment = require('moment');
        const color = require('color');

        config.use('memory');
        config.argv({
            "c": {
                alias: 'config-file',
                description: 'Configuration file to load',
                required: false,
                default: null,
                type: 'string'
            },
            "h": {
                alias: 'help',
                description: 'Show this help'
            }
        }, "Launch 3DPTools web app");
        config.env({separator: '__'});
        if (config.get('config-file')) {
            config.file('user', config.get('config-file'));
        }
        config.file('default', 'config/default.json');
        if (bootstrapOptions.initCliOptions) {
            if (config.get('help')) {
                config.stores.argv.showHelp('log');
                process.exit(0);
            }
        }

        if (packageInfo && packageInfo.version) {
            config.set('version', packageInfo.version);
        }
        app.locals.config = config;
        app.locals.moment = moment;
        app.locals.Color = color;
        app.config = config;
        app.set('config', config);
        if (fs.existsSync(config.get('sourceCode:changelog:filePath'))) {
            app.locals.changelogAvailable = true;
        }

        if (!config.get('sentry:enabled') || !config.get('sentry:dsn') || config.get('sentry:dsn') === "") {
            bootstrapOptions.initSentry = false;
        }
    }

    // Init sentry
    if (bootstrapOptions.initSentry) {
        let sentryExtraConfig = null;
        if (config) {
            sentryExtraConfig = config.get();
        }
        Raven.config(config.get('sentry:dsn'), {
            release: config.get('version'),
            environment: process.env.NODE_ENV || 'development',
            autoBreadcrumbs: {
                'console': false,
                'http': true
            },
            extra: {
                bootstrapOptions: bootstrapOptions,
                config: sentryExtraConfig
            },
            parseUser: req => {
                if (req.user && (req.user.id || req.user.email || req.user.firstname || req.user.lastname)) {
                    let userData = {};

                    if (req.user._id) {
                        userData.id = req.user._id;
                    }
                    if (req.user.email) {
                        userData.email = req.user.email;
                    }
                    let userName = [];
                    if (req.user.firstname) {
                        userName.push(req.user.firstname);
                    }
                    if (req.user.lastname) {
                        userName.push(req.user.lastname);
                    }
                    if (userName.length) {
                        userData.username = userName.join(' ');
                    }

                    return userData;
                }

                return {username: 'none'};
            },
            dataCallback: data =>{
                if (data.req) {
                    if (data.req.route && data.req.route.path) {
                        data.tags.route = data.req.route.path;
                    }
                    data.extra.req = data.req;
                    delete data.req;
                }

                return data;
            }
        }).install();

        app.use(Raven.requestHandler());
        app.set('raven', Raven);
    }

    // This middleware need to be declared early, at least _before_ i18n initialisation
    app.use(cookieParser());

    // Init sessions
    if (bootstrapOptions.initSession) {
        if (!config) {
            throw new Error('Session initialisation require configuration to be loaded!');
        }

        const session = require('express-session');
        const RedisSessionStore = require('connect-redis')(session);
        const flash = require('connect-flash');

        let redisStoreOptions = config.get("redis");
        redisStoreOptions.prefix = config.get('session:name') + ':sessions:';

        app.use(session({
            name: config.get('session:name'),
            resave: false,
            secret: config.get('session:secret'),
            saveUninitialized: false,
            unset: 'destroy',
            store: new RedisSessionStore(redisStoreOptions)
        }));
        app.use(flash());
    }

    // Init database connection
    if (bootstrapOptions.initDb) {
        if (!config) {
            throw new Error('Database initialisation require configuration to be loaded!');
        }

        let mongoose = require('mongoose');

        let mongoOptions = config.get("database:connectOptions");
        mongoOptions.useMongoClient = true;
        mongoOptions.promiseLibrary = global.Promise;
        mongoose.Promise = global.Promise;
        let mongoUrl = fmt("mongodb://%s:%s@%s:%d/%s",
            encodeURIComponent(config.get("database:user")),
            encodeURIComponent(config.get("database:pass")),
            encodeURIComponent(config.get("database:host")),
            encodeURIComponent(config.get("database:port")),
            encodeURIComponent(config.get("database:name"))
        );
        mongoose.connect(mongoUrl, mongoOptions);
    }

    // Setting up i18n
    if (bootstrapOptions.initI18n) {
        if (!config) {
            throw new Error('i18n initialisation require configuration to be loaded!');
        }

        const i18n = require("i18n");

        i18n.configure({
            locales: ['en', 'fr'],
            directory: __dirname + '/locales',
            cookie: config.get("language:cookieName"),
            indent: "  "
        });
        app.use(i18n.init);
        app.locals.languagesList = Object.keys(i18n.getCatalog());
        app.set('i18n', i18n);
        app.locals.i18n = i18n;
    }

    // view engine setup
    if (bootstrapOptions.initViews) {
        const path = require('path');
        const bodyParser = require('body-parser');
        const expressLayouts = require('express-ejs-layouts');
        const favicon = require('serve-favicon');

        app.use(expressLayouts);
        app.set('views', path.join(__dirname, 'views'));
        app.set('view engine', 'ejs');
        app.set('layout', 'layout');
        app.set("layout extractScripts", true);
        app.set("layout extractStyles", true);

        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({extended: false}));

        app.use(favicon(path.join(__dirname, 'public', 'images', 'favicon.ico')));
        const httpStatics = require('./config/http-statics.json');
        for (let [staticPath, alias] of Object.entries(httpStatics)) {
            if ((typeof alias === 'string') && (alias !== "")) {
                app.use(alias, express.static(path.join(__dirname, staticPath)));
            } else {
                app.use(express.static(path.join(__dirname, staticPath)));
            }
        }

    }

    // Init logger
    if (bootstrapOptions.initLogger) {
        const logger = require('morgan');
        if (app.get('env') === 'production') {
            app.use(logger('common'));
        } else {
            app.use(logger('dev'));
        }
    }

    // Autoload app components
    if (bootstrapOptions.loadComponents) {
        const consign = require('consign');

        consign({
            verbose: false
        }).include('lib')
            .then('models')
            .then('middlewares')
            .then('forms')
            .then('controllers')
            .then('routers/app.js') // must be loaded first for main overidding routes (like auth ones)
            .then('routers')
            .into(app);
    }

    // loading navigation
    if (bootstrapOptions.loadNavigation) {
        const navigation = require('./config/navigation');
        app.locals.navigation = navigation;
        app.set('navigation', navigation);
    }

    if (bootstrapOptions.setupHttpRouting) {
        if (bootstrapOptions.initSentry) {
            app.use(Raven.errorHandler());
        }

        // catch 404 and forward to error.ejs handler
        app.use((req, res, next) => {
            let err = new Error('Not Found');
            err.status = 404;
            if (res.sentry) {
                console.error('Sentry ID: ' + res.sentry);
            }
            next(err);
        });

        // error.ejs handlers
        // development error.ejs handler
        // will print stacktrace
        if (app.get('env') === 'development') {
            app.use((err, req, res, next) => {
                res.status(err.status || 500);
                console.error(err.message);
                console.error(err.stack);
                if (res.sentry) {
                    console.error('Sentry ID: ' + res.sentry);
                }
                res.render('error', {
                    pageTitle: 'An error occured',
                    message: err.message,
                    error: err,
                    navModule: "error",
                    sentryId: res.sentry
                });
            });
        }

        // production error.ejs handler
        // no stacktraces leaked to user
        app.use((err, req, res, next) => {
            res.status(err.status || 500);
            console.error(err.message);
            console.error(err.stack);
            if (res.sentry) {
                console.error('Sentry ID: ' + res.sentry);
            }
            res.render('error', {
                pageTitle: 'An error occured',
                message: err.message,
                error: {},
                navModule: "error",
                sentryId: res.sentry
            });
        });
    }

    return app;
};
