'use strict';

module.exports = function (app) {
    const router = require('express').Router();
    const Controller = app.controllers.shop;
    const Form = app.forms.shop;
    const multer = require('multer');
    const fileUpload = multer({
        dest: app.get('config').get('upload:tmpPath'),
        limits: {fileSize: 10000000, files: 1}
    });

    router.use((req, res, next) => {
        res.locals.navModule = 'shop';
        next();
    });

    router.get('/', Controller.index);

    router.get('/get/:shop_id', Controller.get);
    router.get('/get-logo/:shop_id', Controller.getLogo);

    router.post('/add', Form.shop, Controller.add);
    router.get('/add', Controller.addForm);

    router.post('/set-logo/:shop_id', fileUpload.single('logo'), Controller.setLogo);
    router.get('/delete-logo/:shop_id', Controller.deleteLogo);
    router.get('/set-logo/:shop_id', Controller.logoForm);

    router.post('/edit/:shop_id', Form.shop, Controller.edit);
    router.get('/edit/:shop_id', Controller.editForm);

    router.delete('/delete/:shop_id', Controller.delete);

    app.use('/shop', router);

    return this;
};
