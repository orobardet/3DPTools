'use strict';

module.exports = function (app) {
    const router = require('express').Router();
    const Controller = app.controllers.material;
    const Form = app.forms.material;
    const multer = require('multer');
    const fileUpload = multer({
        dest: app.get('config').get('upload:tmpPath'),
        limits: {fileSize: 10000000, files: 1}
    });

    router.use((req, res, next) => {
        res.locals.navModule = 'material';
        next();
    });

    router.get('/', Controller.index);

    router.get('/get/:material_id', Controller.get);

    router.post('/add', Form.material, Controller.add);
    router.get('/add', Controller.addForm);

    router.post('/edit/:material_id', Form.material, Controller.edit);
    router.get('/edit/:material_id', Controller.editForm);

    router.delete('/delete/:material_id', Controller.delete);

    router.post('/add-file/:material_id', fileUpload.single('file'), Form.file, Controller.addFile);
    router.get('/add-file/:material_id', Controller.fileForm);
    router.get('/get-file/:material_id/:file_id', Controller.getFile);
    router.delete('/delete-file/:material_id/:file_id', Controller.deleteFile);

    app.use('/material', router);

    return this;
};
