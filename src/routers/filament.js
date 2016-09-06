module.exports = function (app) {
    var express = require('express');
    var router = express.Router();
    var Controller = app.controllers.filament;
    var FilamentForm = app.forms.filament;
    var multer = require('multer');
    var fileUpload = multer({
        dest: app.get('config').get('upload:tmpPath'),
        limits: {fileSize: 10000000, files: 1}
    });

    router.use(function (req, res, next) {
        res.locals.navModule = 'filament';
        next();
    });

    router.get('/', Controller.index);
    router.get('/stats', Controller.stats);

    router.get('/get/:filament_id', Controller.get);
    router.get('/show/:filament_id', Controller.show);

    router.post('/add', FilamentForm.filament, Controller.add);
    router.get('/add', Controller.addForm);

    router.post('/edit/:filament_id', FilamentForm.filament, Controller.edit);
    router.get('/edit/:filament_id', Controller.editForm);

    router.post('/left-material/:filament_id', FilamentForm.leftMaterial, Controller.leftMaterial);
    router.get('/left-material/:filament_id', Controller.leftMaterialForm);
    router.post('/compute-left-material/:filament_id', FilamentForm.leftMaterial, Controller.computeLeftMaterial);

    router.post('/add-picture/:filament_id', fileUpload.single('picture'), Controller.addPicture);
    router.get('/add-picture/:filament_id', Controller.pictureForm);
    router.delete('/delete-picture/:filament_id/:picture_id', Controller.deletePicture);
    router.get('/delete-picture/:filament_id/:picture_id', Controller.deletePicture);
    router.get('/get-picture/:filament_id/:picture_id', Controller.getPicture);
    router.get('/download-picture/:filament_id/:picture_id', Controller.downloadPicture);

    router.get('/cost-calculator', Controller.costCalculatorForm);

    router.delete('/delete/:filament_id', Controller.delete);

    app.use('/filament', router);
    return this;
};
