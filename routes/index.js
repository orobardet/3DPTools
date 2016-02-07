var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {
        pageTitle: 'Home',
        navModule: 'home'
    });
});

// set language
router.get('/_lang/:lang', function (req, res) {
    if (req.params.lang) {
        var lang = req.params.lang,
            config = res.app.get('config');

        if (lang.match(/auto/i)) {
            res.clearCookie(config.get("language:cookieName"));
        } else {
            res.cookie(config.get("language:cookieName"), lang);
        }
    }

    var referrer = req.get('Referrer');
    if (referrer) {
        res.redirect(referrer);
    } else {
        res.redirect('/');
    }
});
module.exports = router;
