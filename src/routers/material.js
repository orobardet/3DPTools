module.exports = function (app) {
    var express = require('express');
    var router = express.Router();
    var Controller = app.controllers.material;
    var MaterialForm = app.forms.material;
    var multer = require('multer');
    var fileUpload = multer({
        dest: app.get('config').get('upload:tmpPath'),
        limits: {fileSize: 10000000, files: 1}
    });

    router.use(function (req, res, next) {
        res.locals.navModule = 'material';
        next();
    });

    router.get('/', Controller.index);

    router.get('/get/:material_id', Controller.get);

    router.post('/add', MaterialForm.material, Controller.add);
    router.get('/add', Controller.addForm);

    router.post('/edit/:material_id', MaterialForm.material, Controller.edit);
    router.get('/edit/:material_id', Controller.editForm);

    router.delete('/delete/:material_id', Controller.delete);

    router.post('/add-file/:material_id', fileUpload.single('file'), MaterialForm.file, Controller.addFile);
    router.get('/add-file/:material_id', Controller.fileForm);
    router.get('/get-file/:material_id/:file_id', Controller.getFile);
    router.delete('/delete-file/:material_id/:file_id', Controller.deleteFile);

    app.use('/material', router);
    return this;
};
