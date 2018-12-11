'use strict';

require('app-module-path').addPath(__dirname);

module.exports = function(bootstrapOptions) {
    const merge = require('merge');
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
        initMailer: true,
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
        const configLoader = require("tools/configLoader");
        config = configLoader(app, bootstrapOptions);
    }

    // Init sentry
    if (bootstrapOptions.initSentry && config && config.get('sentry:enabled') === true) {
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
        mongoOptions.promiseLibrary = global.Promise;
        mongoOptions.useNewUrlParser = true;
        mongoose.Promise = global.Promise;
        mongoose.set('useCreateIndex', true);

        const dbUser = config.get("database:user");
        const dbPass = config.get("database:pass");
        const dbHost = config.get("database:host");
        const dbPort = config.get("database:port");
        const dbName = config.get("database:name");

        let mongoAuth = "";
        if (dbUser) {
            if (dbPass) {
                mongoAuth = `${dbUser}:${dbPass}@`;
            } else {
                mongoAuth = `${dbUser}@`;
            }
        }
        let mongoServer = dbHost;
        if (dbPort) {
            mongoServer = `${dbHost}:${dbPort}`;
        }

        const mongoUrl = `mongodb://${mongoAuth}${mongoServer}/${dbName}`;
        mongoose.connect(mongoUrl, mongoOptions).catch(function(err) {
            console.error(err);
            process.exit(1);
        });
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
        app.getCurrentLocale = function() {
            try {
                const i18n = this.get('i18n');

                if (i18n) {
                    return i18n.getLocale();
                }
            } catch (err) {
                return 'en'
            }

            return 'en';
        }
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

    // Init prometheus metrics endpoint
    // After static routing, so that they will not be counted in stats
    if (bootstrapOptions.setupHttpRouting && config.get('monitoring:prometheus:enabled')) {
        const promBundle = require("express-prom-bundle");
        promBundle.promClient.collectDefaultMetrics({ timeout: 5000 });
        app.use(promBundle({
            includeMethod: true,
            includePath: true
        }));
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

    // Init mailer
    if (bootstrapOptions.initMailer) {
        const Mailer = require('lib/mailer');
        const appMailer = new Mailer(config.get("mail"), app.get('i18n'));
        appMailer.connect();
        app.set('mailer', appMailer);
    }

    // Autoload app components
    if (bootstrapOptions.loadComponents) {
        const consign = require('consign');

        consign({
            verbose: false
        }).include('models')
            .then('middlewares')
            .then('forms')
            .then('controllers')
            .then('routers/app.js') // must be loaded first for main overidding routes (like auth ones)
            .then('routers')
            .exclude('models/patches')  // Don't load models' patches for normal run ; their should be lazy loaded when needed
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

        app.on('postListeningInit', function() {
            app.controllers.app.asyncPostListeningInit();
        });

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
