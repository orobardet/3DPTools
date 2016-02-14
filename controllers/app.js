module.exports = function (app) {
    var User = app.models.user;

    this.index = function (req, res, next) {
        res.render('index', {
            pageTitle: 'Home',
            navModule: 'home'
        });
    };

    this.changeLanguage = function (req, res) {
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
    };

    this.needLogin = function (req, res) {
        if (req.isAuthenticated()) {
            return res.redirect('/');
        }

        User.getActiveUserCount().then(function (count) {
            if (!count) {
                return res.redirect('/setup');
            }
        });

        res.render('login', {
            pageTitle: 'Login',
            navModule: 'login',
            showNavbar: false
        });
    };

    this.logout = function (req, res) {
        req.logout();
        res.redirect('/');
    };

    this.isUserLogged = function (req, res, next) {
        if (req.url === '/login' || req.url.match(/^\/setup*/)) {
            return next();
        }

        if (req.isAuthenticated()) {
            return next();
        }
        res.redirect('/login');
    };

    return this;
};