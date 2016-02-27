module.exports = function (app) {
    var express = require('express');
    var router = express.Router();
    var Controller = app.controllers.shop;
    var ShopForm = app.forms.shop;
    var multer = require('multer');
    var fileUpload = multer({
        dest: app.get('config').get('upload:tmpPath'),
        limits: {fileSize: 10000000, files: 1}
    });

    router.use(function (req, res, next) {
        res.locals.navModule = 'shop';
        next();
    });

    router.get('/', Controller.index);

    router.get('/get/:shop_id', Controller.get);
    router.get('/get-logo/:shop_id', Controller.getLogo);

    router.post('/add', ShopForm.shop, Controller.add);
    router.get('/add', Controller.addForm);

    router.post('/set-logo/:shop_id', fileUpload.single('logo'), Controller.setLogo);
    router.get('/delete-logo/:shop_id', Controller.deleteLogo);
    router.get('/set-logo/:shop_id', Controller.logoForm);

    router.delete('/delete/:shop_id', Controller.delete);

    app.use('/shop', router);
    return this;
};
