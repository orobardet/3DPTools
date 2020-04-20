'use strict';

require('app-module-path').addPath(__dirname);

module.exports = function(bootstrapOptions) {
    const merge = require('merge');
    const sentry = require('@sentry/node');
    const cookieParser = require('cookie-parser');
    const winston = require('winston');
    const expressWinston = require('express-winston');
    const colors = require('colors/safe');

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
        initServerTasks: true,
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

    app.services = {};
    async function checkAppReadiness() {
        let allReady = true;
        for (let [service, state] of Object.entries(app.services)) {
            allReady &= state;
        }
        if (allReady) {
            app.emit('ready');
        }
    }
    app.on('service-ready', (service) => {
        if (app.services[service] !== undefined) {
            app.services[service] = true;
            checkAppReadiness();
        }
    });

    // Load configuration
    if (bootstrapOptions.loadConfig) {
        const configLoader = require("tools/configLoader");
        config = configLoader(app, bootstrapOptions);
    }

    // Init logger
    if (bootstrapOptions.initLogger) {
        let level = 'info';
        if (app.get('env') !== 'production') {
            level = 'debug';
        }

        var winstonTransports = [
            new winston.transports.Console({
                level: level,
                handleExceptions: true,
                json: false,
                colorize: true
            })
        ];
        var winstonFormats = [
            winston.format.colorize(),
            winston.format.timestamp({format: 'YYYY-MM-DD HH:mm:ss'}),
            winston.format.ms(),
            winston.format.printf(({ level, message, label, timestamp, ms }) => {
                // To ensure levels a right aligned:
                //  - strip color code from level value, to be able to compute its length in characters
                let colorlessLevel = level.replace(
                  /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
                //  - Prefix the label string [level] with N spaces, depending on the length of the level (7 in the length of the longest level)
                let paddedlLevel = ' '.repeat(7 - colorlessLevel.length) + `[${level}]`
                if (label && label != '') {
                    return `${timestamp} ${ms.padEnd(6, ' ')} ${paddedlLevel} ${colors.bold(label)}: ${message}`;
                }
                return `${timestamp} ${ms.padEnd(6, ' ')} ${paddedlLevel} ${message}`;
            })
        ];

        let logger = new winston.createLogger({
            transports: winstonTransports,
            format: winston.format.combine(...winstonFormats),
            exitOnError: false
        });
        app.set('logger', logger);
        app.logger = logger;
        app.logger.info("Starting app...");

        // For performance, precompile regular expressions for filtering express request logger
        const ignore304PathLog = [];
        const ignore304PathLogPatterns = config.get('log:ignore304Path');
        if (ignore304PathLogPatterns && ignore304PathLogPatterns.length) {
            for (let pattern of ignore304PathLogPatterns) {
                ignore304PathLog.push(new RegExp(pattern));
            }
        }
        // Expresse request logger middleware
        app.use(expressWinston.logger({
            ignoreRoute: function (req, res) {
                if (req.path) {
                    for (let re of ignore304PathLog) {
                        if (req.path.match(re)) {
                            return true;
                        }
                    }
                }
                return false;
            },
            level: function (req, res) {
                let level = "";
                if (res.statusCode >= 100) {
                    level = "info";
                }
                if (res.statusCode >= 400) {
                    level = "warn";
                }
                if (res.statusCode >= 500) {
                    level = "error";
                }
                // Ops is worried about hacking attempts so make Unauthorized and Forbidden critical
                if (res.statusCode == 401 || res.statusCode == 403) {
                    level = "error";
                }
                return level;
            },
            transports: winstonTransports,
            format: winston.format.combine(
                // Hide HTTP 304
                winston.format((info, opts) => {
                    if (info.meta && info.meta.res && info.meta.res.statusCode && info.meta.res.statusCode == 304) {
                        //return false;
                    }
                    return info;
                })(),
                winston.format.label({ label: 'HTTP' }),
                ...winstonFormats
            ),
            meta: true,
            expressFormat: true,
            colorize: true
        }));
    }

    // Init sentry
    if (bootstrapOptions.initSentry && config && config.get('sentry:enabled') === true) {
        let sentryExtraConfig = null;
        if (config) {
            sentryExtraConfig = config.get();
        }

        sentry.init({
            dsn: config.get('sentry:dsn'),
            release: config.get('version'),
            environment: process.env.NODE_ENV || 'development',
            attachStacktrace: true,
            sendDefaultPii: true,
        });

        app.use(sentry.Handlers.requestHandler());
        app.set('sentry', sentry);
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

        // Create Redis client
        let redisOptions = config.get("redis");
        redisOptions.prefix = config.get('session:name') + ':sessions:';
        const redis = require('redis');
        let redisConnectionLogString = 'unknown';
        if (redisOptions.socket) {
            redisConnectionLogString = redisOptions.socket;
            redisOptions.client = redis.createClient(redisOptions.socket, redisOptions);
        }
        else {
            redisConnectionLogString = `${redisOptions.host}:${redisOptions.port}`
            redisOptions.client = redis.createClient(redisOptions);
        }
        app.services.redis = false;
        let redisLogger = app.logger.child({label: "REDIS"});
        redisLogger.info(`Connecting (${redisConnectionLogString})...`);
        redisOptions.client.on('error', (err) => {
            redisLogger.error(err);
        });
        redisOptions.client.on('ready', () => {
            redisLogger.info(`Connected to Redis server v${redisOptions.client.server_info.redis_version}.`);
            app.emit('service-ready', 'redis');
        });

        // Create and use redis session store
        app.use(session({
            name: config.get('session:name'),
            resave: false,
            secret: config.get('session:secret'),
            saveUninitialized: false,
            unset: 'destroy',
            store: new RedisSessionStore(redisOptions)
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
        mongoOptions.useUnifiedTopology = true;
        mongoose.Promise = global.Promise;
        mongoose.set('useCreateIndex', true);

        const dbUser = config.get("database:user");
        const dbPass = config.get("database:pass");
        const dbHost = config.get("database:host");
        const dbPort = config.get("database:port");
        const dbName = config.get("database:name");

        let mongoAuth = "";
        let mongoAuthLog = "";
        if (dbUser) {
            if (dbPass) {
                mongoAuth = `${dbUser}:${dbPass}@`;
                mongoAuthLog = `${dbUser}:*****@`;
            } else {
                mongoAuth = `${dbUser}@`;
                mongoAuthLog = mongoAuth;
            }
        }
        let mongoServer = dbHost;
        if (dbPort) {
            mongoServer = `${dbHost}:${dbPort}`;
        }

        const mongoConnectionLogString = `mongodb://${mongoAuthLog}${mongoServer}/${dbName}`;
        const mongoUrl = `mongodb://${mongoAuth}${mongoServer}/${dbName}`;

        app.services.mongo = false;
        let mongoLogger = app.logger.child({label: "MONGO"});
        mongoLogger.info(`Connecting (${mongoConnectionLogString})...`);
        mongoose.connect(mongoUrl, mongoOptions).catch((err) => {
            mongoLogger.error(err);
            process.exit(1);
        }).then(() => {
            let admin = new mongoose.mongo.Admin(mongoose.connection.db);
            admin.buildInfo((err, info) => {
                mongoLogger.info(`Connected to MongoDB server v${info.version}.`);
                app.emit('service-ready', 'mongo');
            });
        });
    }

    // Setting up i18n
    if (bootstrapOptions.initI18n) {
        if (!config) {
            throw new Error('i18n initialisation require configuration to be loaded!');
        }

        const i18n = require("i18n");

        let i18nOptions = {
            locales: ['en', 'fr'],
            directory: __dirname + '/locales',
            cookie: config.get("language:cookieName"),
            indent: "  "
        };
        if (app.get('env') === 'production') {
            i18nOptions.autoReload = false;
            i18nOptions.updateFiles = false;
        }
        i18n.configure(i18nOptions);
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
    if (bootstrapOptions.setupHttpRouting && config.get('http:compression')) {
        const compression = require('compression');
        app.use(compression())
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
            app.use(sentry.Handlers.errorHandler());
            app.use((err, req, res, next) => {
                sentry.configureScope(scope => {
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

                        scope.setUser(userData);
                    }

                    const protectData = require('tools/protectConfigData');
                    scope.setTag("url", req.url);
                    scope.setTag("method", req.method);
                    scope.setTag("sessionID", req.sessionID);
                    scope.setTag("locale", res.getLocale());
                    scope.setExtra("config", protectData(app.config.get(), [/.*secret.*/, /.*pass.*/, /.*password.*/, /dsn/], '*****'));
                    scope.setExtra("headers", req.headers);
                    scope.setExtra("cookies", req.cookies);
                    scope.setExtra("session", req.session);
                    if (req.user) {
                        scope.setExtra("user", protectData(req.user.toJSON(), [/.*password.*/], '*****'));
                    }
                    scope.setExtra("form", req.form);
                });
                next(err);
            });
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
                if (bootstrapOptions.initLogger) {
                    app.logger.error(err.message);
                    app.logger.debug(err.stack);
                    if (res.sentry) {
                        app.logger.debug(`Sentry ID: ${res.sentry}`)
                    }
                } else {
                    console.error(err.message);
                    console.error(err.stack);
                    if (res.sentry) {
                        console.error('Sentry ID: ' + res.sentry);
                    }
                }
                res.render('error', {
                    pageTitle: 'An error occured',
                    message: err.message,
                    error: err,
                    navModule: "error",
                    sentryId: res.sentry
                });
            });
        } else {
            // production error.ejs handler
            // no stacktraces leaked to user
            app.use((err, req, res, next) => {
                res.status(err.status || 500);
                if (bootstrapOptions.initLogger) {
                    app.logger.error(err.message);
                    app.logger.debug(err.stack);
                    if (res.sentry) {
                        app.logger.debug(`Sentry ID: ${res.sentry}`)
                    }
                } else {
                    console.error(err.message);
                    console.error(err.stack);
                    if (res.sentry) {
                        console.error(`Sentry ID: ${res.sentry}`);
                    }
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
    }

    app.on('ready', function() {
        if (bootstrapOptions.initServerTasks) {
            app.controllers.app.asyncPostListeningInit();
        }
    });

    setTimeout(() => checkAppReadiness(), 1);

    if (bootstrapOptions.initLogger) {
        app.logger.info("App started.");
    }

    return app;
};
