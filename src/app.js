module.exports = function (bootstrapOptions) {
    var merge = require('merge');
    const fs = require('fs');

    bootstrapOptions = merge({
        loadConfig: true,
        initSession: true,
        initDb: true,
        initI18n: true,
        initViews: true,
        initLogger: true,
        loadComponents: true,
        loadNavigation: true,
        setupHttpRouting: true
    }, bootstrapOptions);

    var express = require('express');
    var config = null;

    // Create Express App
    var app = express();
    app.locals = {
        siteTitle: '3DPTools',
        navModule: 'unknown',
        showNavbar: true
    };

    // Load configuration
    if (bootstrapOptions.loadConfig) {
        config = require("nconf");
        var moment = require('moment');
        var color = require('color');

        config.use('memory');
        config.argv({
            "c": {
                alias: 'config-file',
                description: 'Configuration file to load',
                required: false,
                default: null,
                type: 'string'
            }
        });
        config.env({separator: '__'});
        if (config.get('config-file')) {
            config.file('user', config.get('config-file'));
        }
        config.file('default', 'config/default.json');
        app.locals.config = config;
        app.locals.moment = moment;
        app.locals.Color = color;
        app.config = config;
        app.set('config', config);
        if (fs.existsSync(config.get('sourceCode:changelog:filePath'))) {
            app.locals.changelogAvailable = true;
        }
    }

    // Init sessions
    if (bootstrapOptions.initSession) {
        if (!config) {
            throw new Error('Session initialisation require configuration to be loaded!');
        }

        var session = require('express-session');
        var RedisSessionStore = require('connect-redis')(session);
        var redisStoreOptions = config.get("redis");
        var flash = require('connect-flash');

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

        var mongoose = require('mongoose');

        mongoose.Promise = global.Promise;
        var mongoOptions = config.get("database:connectOptions");
        mongoOptions.promiseLibrary = global.Promise;
        mongoose.connect(config.get("database:url"), mongoOptions);
    }

    // Setting up i18n
    if (bootstrapOptions.initI18n) {
        if (!config) {
            throw new Error('i18n initialisation require configuration to be loaded!');
        }

        var i18n = require("i18n");

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
        var path = require('path');
        var bodyParser = require('body-parser');
        var expressLayouts = require('express-ejs-layouts');
        var favicon = require('serve-favicon');
        var cookieParser = require('cookie-parser');

        app.use(expressLayouts);
        app.set('views', path.join(__dirname, 'views'));
        app.set('view engine', 'ejs');
        app.set('layout', 'layout');
        app.set("layout extractScripts", true);
        app.set("layout extractStyles", true);

        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({extended: false}));

        app.use(favicon(path.join(__dirname, 'public', 'images', 'favicon.ico')));
        config.get('httpStatics').forEach(function (staticPath) {
            app.use(express.static(path.join(__dirname, staticPath)));
        });

        app.use(cookieParser());
    }

    // Init logger
    if (bootstrapOptions.initLogger) {
        var logger = require('morgan');
        if (app.get('env') === 'production') {
            app.use(logger('common'));
        } else {
            app.use(logger('dev'));
        }
    }

    // Autoload app components
    if (bootstrapOptions.loadComponents) {
        var consign = require('consign');

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
        var navigation = require('./config/navigation');
        app.locals.navigation = navigation;
        app.set('navigation', navigation);
    }

    if (bootstrapOptions.setupHttpRouting) {
        // catch 404 and forward to error.ejs handler
        app.use(function (req, res, next) {
            var err = new Error('Not Found');
            err.status = 404;
            next(err);
        });

        // error.ejs handlers
        // development error.ejs handler
        // will print stacktrace
        if (app.get('env') === 'development') {
            app.use(function (err, req, res, next) {
                res.status(err.status || 500);
                console.error(err.message);
                console.error(err.stack);
                res.render('error', {
                    pageTitle: 'An error occured',
                    message: err.message,
                    error: err,
                    navModule: "error"
                });
            });
        }

        // production error.ejs handler
        // no stacktraces leaked to user
        app.use(function (err, req, res, next) {
            res.status(err.status || 500);
            console.error(err.message);
            console.error(err.stack);
            res.render('error', {
                pageTitle: 'An error occured',
                message: err.message,
                error: {},
                navModule: "error"
            });
        });
    }

    return app;
};
