var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var expressLayouts = require('express-ejs-layouts');
var i18n = require("i18n");

var routes = require('./routes/index');
var about = require('./routes/about');

var app = express();

app.locals = {
    siteTitle: '3DPTools'
};

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
app.use(require('node-sass-middleware')({
    src: path.join(__dirname, 'public'),
    dest: path.join(__dirname, 'public'),
    indentedSyntax: true,
    sourceMap: true
}));

// setting up i18n
i18n.configure({
    locales: ['en', 'fr'],
    directory: __dirname + '/locales',
    cookie: 'locale',
    indent: "  "
});
app.use(i18n.init);

app.use(favicon(path.join(__dirname, 'public', 'images', 'favicon.ico')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public/vendor/jquery')));
app.use(express.static(path.join(__dirname, 'public/vendor/bootstrap')));
app.use(express.static(path.join(__dirname, 'public/vendor/font-awesome')));

app.use('/', routes);
app.use('/about', about);

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
            pageTitle: 'Error',
            message: err.message,
            error: err
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
        error: {}
    });
});

module.exports = app;
