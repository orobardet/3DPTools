'use strict';

module.exports = function (app) {
    const router = require('express').Router();
    const Controller = app.controllers.filament;
    const Form = app.forms.filament;
    const multer = require('multer');
    const fileUpload = multer({
        dest: app.get('config').get('upload:tmpPath'),
        limits: {fileSize: 10000000, files: 1}
    });

    router.use((req, res, next) => {
        res.locals.navModule = 'filament';
        next();
    });

    router.get('/', Form.search, Controller.index);
    router.get('/stats', Controller.stats);

    router.get('/get/:filament_id', Controller.get);
    router.get('/show/:filament_id', Controller.show);

    router.post('/add', Form.filament, Controller.add);
    router.get('/add', Controller.addForm);

    router.post('/edit/:filament_id', Form.filament, Controller.edit);
    router.get('/edit/:filament_id', Controller.editForm);

    router.post('/left-material/:filament_id', Form.leftMaterial, Controller.leftMaterial);
    router.get('/left-material/:filament_id', Controller.leftMaterialForm);
    router.post('/compute-left-material/:filament_id', Form.leftMaterial, Controller.computeLeftMaterial);

    router.post('/add-picture/:filament_id', fileUpload.single('picture'), Controller.addPicture);
    router.get('/add-picture/:filament_id', Controller.pictureForm);
    router.delete('/delete-picture/:filament_id/:picture_id', Controller.deletePicture);
    router.get('/delete-picture/:filament_id/:picture_id', Controller.deletePicture);
    router.get('/get-picture/:filament_id/:picture_id', Controller.showPicture);
    router.get('/download-picture/:filament_id/:picture_id', Controller.downloadPicture);

    router.get('/cost-calculator', Controller.costCalculatorForm);
    router.get('/cost-calculator/search', Form.search, Controller.costCalculatorSearch);
    router.post('/cost-calculator/:filament_id', Form.costCalculator, Controller.costCalculator);

    router.delete('/delete/:filament_id', Controller.delete);

    router.get('/finished/:filament_id/:status', Controller.finished);

    app.use('/filament', router);

    return this;
};
