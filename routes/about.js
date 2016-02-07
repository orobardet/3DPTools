var express = require('express');
var router = express.Router();

router.get('/', function (req, res, next) {
    console.log(req);
    res.render('about', {
        pageTitle: 'About',
        navModule: 'about'
    });
});

module.exports = router;
