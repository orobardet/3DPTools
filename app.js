var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var expressLayouts = require('express-ejs-layouts');
var i18n = require("i18n");
var config = require("nconf");
var session = require('express-session');
var RedisSessionStore = require('connect-redis')(session);
var flash = require('connect-flash');
var mongoose = require('mongoose');
var consign = require('consign');
var moment = require('moment');

var app = express();
app.locals = {
    siteTitle: '3DPTools',
    navModule: 'unknown',
    showNavbar: true
};

// load configuration
config.use('memory');
config.file('default', 'config/default.json');
config.env();
config.argv({
    "c": {
        alias: 'config-file',
        description: 'Configuration file to load',
        required: false,
        default: null,
        type: 'string'
    }
});
if (config.get('config-file')) {
    config.file('user', config.get('config-file'));
}
app.locals.config = config;
app.locals.moment = moment;
app.set('config', config);

// init sessions
app.use(session({
    name: config.get('session:name'),
    resave: false,
    secret: config.get('session:secret'),
    saveUninitialized: false,
    unset: 'destroy',
    store: new RedisSessionStore()
}));
app.use(flash());

// database connection
mongoose.connect(config.get("database:url"), config.get("database:connectOptions"));

// setting up i18n
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

// view engine setup
app.use(expressLayouts);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.set('layout', 'layout');
app.set("layout extractScripts", true);
app.set("layout extractStyles", true);

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());

app.use(favicon(path.join(__dirname, 'public', 'images', 'favicon.ico')));
config.get('httpStatics').forEach(function (staticPath) {
    app.use(express.static(path.join(__dirname, staticPath)));
});

// autoload app components
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

// loading navigation
var navigation = require('./config/navigation');
app.locals.navigation = navigation;
app.set('navigation', navigation);

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
    res.render('error', {
        pageTitle: 'An error occured',
        message: err.message,
        error: {},
        navModule: "error"
    });
});

module.exports = app;
