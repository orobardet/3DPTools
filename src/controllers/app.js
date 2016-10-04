module.exports = function (app) {
    var when = require('when');
    var User = app.models.user;
    var Shop = app.models.shop;
    var Brand = app.models.brand;
    var Material = app.models.material;
    var Filament = app.models.filament;

    this.index = function (req, res, next) {
        var config = res.app.get('config');
        var lastUsedCount = config.get("filament:index:lastUsedCount");
        var almostFinishedThreshold = config.get("filament:index:almostFinishedPercentThreshold");

        if (typeof lastUsedCount === 'undefined') {
            lastUsedCount = 5;
        }
        if (typeof almostFinishedThreshold === 'undefined') {
            almostFinishedThreshold = 15;
        }

        when.all([
            Shop.count().exec(),
            Brand.count().exec(),
            Material.count().exec(),
            Shop.findOneRandom(),
            Brand.findOneRandom(),
            Material.findOneRandom(),
            Filament.count({}).exec(),
            Filament.count({finished:true}).exec(),
            Filament.count({materialLeftPercentage:100}).exec(),
            Filament.getTotalWeight(),
            Filament.getTotalLength(),
            Filament.getCountPerMaterials(),
            Filament.find({finished:false, materialLeftPercentage: {$lt : 100}}).sort({lastUsedDate:-1}).limit(lastUsedCount).populate('material brand shop').exec(),
            Filament.find({finished:false, materialLeftPercentage: {$lt : almostFinishedThreshold}}).sort({materialLeftPercentage:1}).populate('material brand shop').exec()
        ]).spread(function (
            shopCount,
            brandCount,
            materialCount,
            randomShop,
            randomBrand,
            randomMaterial,
            filamentTotalCount,
            filamentTotalFinishedCount,
            filamentTotalUnusedCount,
            filamentTotalWeight,
            filamentTotalLength,
            countPerMaterials,
            lastUsedFilaments,
            almostFinishedFilaments
        ) {
            return res.render('index', {
                pageTitle: 'Home',
                navModule: 'home',
                shopCount: shopCount,
                brandCount: brandCount,
                materialCount: materialCount,
                randomShop: randomShop,
                randomBrand: randomBrand,
                randomMaterial: randomMaterial,
                filaments: {
                    stats: {
                        totalCount: filamentTotalCount,
                        totalFinishedCount: filamentTotalFinishedCount,
                        totalUnusedCount: filamentTotalUnusedCount,
                        totalWeight:filamentTotalWeight,
                        totalLength: filamentTotalLength,
                        countPerMaterials: countPerMaterials
                    },
                    lastUsed: lastUsedFilaments,
                    almostFinished: almostFinishedFilaments
                }
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