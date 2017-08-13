'use strict';

module.exports = function (app) {
    const Material = app.models.material;
    const fs = require('fs');

    /**
     * List of all materials
     */
    this.index = async function (req, res, next) {
        let materials;

        try {
            materials = await Material.list({
                tree: true, locale: res.getLocale()
            });
        } catch (err) {
            return next(err);
        }

        return res.render('material/index', {
            materials: materials,
            pageTitle: 'Materials',
            errors: []
        });
    };

    this._prepareAddForm = async (res, data) => {
        let materials = await Material.list({childMaterials: false, locale: res.getLocale()});
        materials.unshift({name: res.__('<none>'), id:null});

        data = Object.assign({
            materials: materials,
            errors: []
        }, data);

        return res.render('material/add', data);
    };

    /**
     * Show the add new material form
     */
    this.addForm = async (req, res, next) => {
        try {
            return this._prepareAddForm(res);
        } catch (err) {
            return next(err);
        }
    };

    /**
     * Add a new material (process the form shown by `this.addForm`)
     */
    this.add = async (req, res, next) => {
        try {
            let errors = {};
            if (!req.form.isValid) {
                errors = req.form.getErrors()
            }

            let parentMaterialId = req.form.parentMaterial;
            let parentMaterial = null;

            if (parentMaterialId) {
                let parentMaterialErrors = [];

                try {
                    parentMaterial = await Material.findById(parentMaterialId).exec();
                } catch (err) {
                    parentMaterial = null;
                }

                if (!parentMaterial) {
                    parentMaterialErrors.push('Unable to find parent material');
                }
                if (parentMaterial.parentMaterial) {
                    parentMaterialErrors.push('A material having parent material can be used as parent material');
                }

                if (parentMaterialErrors.length) {
                    errors.parentMaterial = parentMaterialErrors;
                }
            }

            if (errors && Object.keys(errors).length) {
                return this._prepareAddForm(res, { errors: errors});
            }

            let material = new Material({
                name: req.form.name,
                parentMaterial: (parentMaterial) ? parentMaterial.id : null,
                description: req.form.description,
                density: req.form.density,
            });

            if (req.form.headTempMin) {
                material.headTemp.min = req.form.headTempMin;
            }
            if (req.form.headTempMax) {
                material.headTemp.max = req.form.headTempMax;
            }
            if (req.form.bedTempMin) {
                material.bedTemp.min = req.form.bedTempMin;
            }
            if (req.form.bedTempMax) {
                material.bedTemp.max = req.form.bedTempMax;
            }
            if (req.form.printingSpeedMin) {
                material.printingSpeed.min = req.form.printingSpeedMin;
            }
            if (req.form.printingSpeedMax) {
                material.printingSpeed.max = req.form.printingSpeedMax;
            }

            try {
                await material.save();
            } catch (err) {
                return next(err);

            }

            return res.redirect("/material");
        } catch (err) {
            return next(err);
        }
    };

    /**
     * Show the edit material form
     */
    this.editForm = async function (req, res) {
        let materialId = req.params.material_id;
        let material;

        try {
            material = await Material.findById(materialId).exec();
        } catch (err) {
            res.status(404);
            return res.json({
                message: res.__('Material %s not found.', materialId)
            });
        }

        return res.render('material/edit', {
            material: material,
            errors: []
        });
    };

    /**
     * Save and edited material (process the form shown by `this.editForm`)
     */
    this.edit = async function (req, res, next) {
        let materialId = req.params.material_id;

        let material = await Material.findById(materialId).exec();

        if (!req.form.isValid) {
            return res.render('material/edit', {
                material: material,
                errors: req.form.getErrors()
            });
        }

        material.name = req.form.name;
        material.description = req.form.description;
        material.density = req.form.density;
        if (req.form.headTempMin) {
            material.headTemp.min = req.form.headTempMin;
        }
        if (req.form.headTempMax) {
            material.headTemp.max = req.form.headTempMax;
        }
        if (req.form.bedTempMin) {
            material.bedTemp.min = req.form.bedTempMin;
        }
        if (req.form.bedTempMax) {
            material.bedTemp.max = req.form.bedTempMax;
        }
        if (req.form.printingSpeedMin) {
            material.printingSpeed.min = req.form.printingSpeedMin;
        }
        if (req.form.printingSpeedMax) {
            material.printingSpeed.max = req.form.printingSpeedMax;
        }

        try {
            await material.save();
        } catch (err) {
            return next(err);
        }

        return res.redirect("/material");
    };

    /**
     * Get material data
     */
    this.get = async function (req, res) {
        let materialId = req.params.material_id;
        let material;

        try {
            material = await Material.findById(materialId).exec();
        } catch (err) {
            res.status(404);
            return res.json({
                message: res.__('Material %s not found.', materialId)
            });
        }

        let materialData = material.toObject({getters: false, virtuals: true, versionKey: false});
        return res.json({
            material: materialData
        });
    };

    /**
     * Delete a material
     */
    this.delete = async function (req, res) {
        let materialId = req.params.material_id;

        try {
            if (!await Material.findById(materialId).remove().exec()) {
                throw new Error(res.__('Error while deleting material %s', materialId));
            }
        } catch (err) {
            res.status(500);
            return res.json({
                message: res.__(err.message)
            });

        }

        return res.json({
            message: res.__('Material %s successfully deleted.', materialId)
        });
    };

    /**
     * Show the material file add form
     */
    this.fileForm = async function (req, res, next) {
        let materialId = req.params.material_id;

        let material = await Material.findById(materialId).exec();

        return res.render('material/file', {
            materialId: materialId,
            material: material,
            errors: []
        });
    };

    /**
     * Add a file to a material (process the form shown by `this.fileForm`)
     */
    this.addFile = async function (req, res, next) {
        let materialId = req.params.material_id;

        let material = await Material.findById(materialId).exec();

        let errors = {};
        if (!req.form.isValid) {
            errors = req.form.getErrors();
        }

        if (!req.file) {
            errors.file = ['File is required'];
        }

        if (Object.keys(errors).length) {
            return res.render('material/file', {
                materialId: materialId,
                material: material,
                errors: errors
            });
        }

        let uploadedFile = req.file;
        let file = {
            displayName: req.form.name,
            fileName: uploadedFile.originalname,
            size: uploadedFile.size,
            mimeType: uploadedFile.mimetype,
            data: fs.readFileSync(uploadedFile.path)
        };
        material.addFile(file);

        await fs.unlinkSync(uploadedFile.path);

        await material.save();

        return res.redirect("/material");
    };

    /**
     * Get a file of a material
     */
    this.getFile = async function (req, res) {
        let materialId = req.params.material_id;
        let fileId = req.params.file_id;
        let material;

        try {
            material = await Material.findById(materialId).exec();
        } catch (err) {
            res.status(404);
            return res.json(res.__('Material %s not found.', materialId));
        }

        let file = material.getFile(fileId);
        if (file) {
            res.set('Content-Type', file.mimeType);
            res.set('Content-Length', file.size);
            res.set('Content-Disposition', 'inline; filename="' + file.fileName + '"');

            return res.send(file.data);
        }

        res.status(404);
        return res.send(res.__('File %s not found.', fileId));
    };


    /**
     * Delete a file from a material
     */
    this.deleteFile = async function (req, res, next) {
        let materialId = req.params.material_id;
        let fileId = req.params.file_id;
        let material;

        try {
            material = await Material.findById(materialId).exec();
        } catch (err) {
            res.status(404);
            return res.json(res.__('Material %s not found.', materialId));
        }

        if (!material.deleteFile(fileId)) {
            res.status(404);
            if (req.method === 'DELETE') {
                return res.json({
                    message: res.__("File %s not found.", fileId)
                });
            }

            return next(new Error(res.__("File %s not found.", fileId)));
        }

        await material.save();
        if (req.method === 'DELETE') {
            return res.json({});
        }

        return res.redirect("/material");
    };

    return this;
};