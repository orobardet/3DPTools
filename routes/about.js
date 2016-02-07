var express = require('express');
var router = express.Router();

router.get('/', function (req, res, next) {
    res.render('about', {
        pageTitle: 'About',
        navModule: 'about'
    });
});

module.exports = router;
