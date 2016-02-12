var express = require('express');
var router = express.Router();

/* add user */
router.post('/', function (req, res, next) {
    if ((req.body.password !== req.body.password2) ||
        (req.body.password === '') ||
        (req.body.password2 === '')) {
        next('route');
    } else {
        res.redirect("/setup/done");
    }
});

/* setup root */
router.get('/', function (req, res) {
    res.render('setup/index', {
        layout: 'setup/layout'
    });
});

/* setup finished */
router.get('/done', function (req, res) {
    res.render('setup/done', {
        layout: 'setup/layout'
    });
});

module.exports = {
    rootPath: "/setup",
    "router": router
};
