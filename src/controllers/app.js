module.exports = function (app) {
    var when = require('when');
    var User = app.models.user;
    var Shop = app.models.shop;
    var Brand = app.models.brand;
    var Material = app.models.material;

    this.index = function (req, res, next) {
        when.all([
            Shop.count().exec(),
            Brand.count().exec(),
            Material.count().exec(),
            Shop.findOneRandom(),
            Brand.findOneRandom(),
            Material.findOneRandom()
        ]).spread(function (shopCount, brandCount, materialCount, randomShop, randomBrand, randomMaterial) {
            return res.render('index', {
                pageTitle: 'Home',
                navModule: 'home',
                shopCount: shopCount,
                brandCount: brandCount,
                materialCount: materialCount,
                randomShop: randomShop,
                randomBrand: randomBrand,
                randomMaterial: randomMaterial
            });
        }).otherwise(function (err) {
            next(err);
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

    this.userProfile = function (req, res) {
        res.render('profile');
    };

    return this;
};