module.exports = function (app) {
    var when = require('when');
    var Material = app.models.material;

    this.index = function (req, res, next) {
        when(Material.find().sort('name').exec())
            .then(function (materials) {
                return res.render('material/index', {
                    materials: materials,
                    pageTitle: 'Materials',
                    errors: []
                });
            })
            .catch(function (err) {
                return next(err);
            });
    };

    this.add = function (req, res, next) {
        if (!req.form.isValid) {
            return res.render('material/add', {
                errors: req.form.getErrors()
            });
        }
        var material = new Material({
            name: req.form.name,
            description: req.form.description,
            density: req.form.density
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
        material.save(function (err) {
            if (err) {
                return next(err);
            }
            return res.redirect("/material");
        });
    };

    this.addForm = function (req, res) {
        return res.render('material/add', {
            errors: []
        });
    };

    this.edit = function (req, res, next) {
        var materialId = req.params.material_id;

        when(Material.findById(materialId).exec())
            .then(function (material) {
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

                material.save(function (err) {
                    if (err) {
                        return next(err);
                    }
                    return res.redirect("/material");
                });
            });
    };

    this.editForm = function (req, res) {
        var materialId = req.params.material_id;

        when(Material.findById(materialId).exec())
            .then(function (material) {
                return res.render('material/edit', {
                    material: material,
                    errors: []
                });
            })
            .catch(function (err) {
                res.status(404);
                return res.json({
                    message: res.__('Material %s not found.', materialId)
                });
            });
    };

    this.get = function (req, res) {
        var materialId = req.params.material_id;

        when(Material.findById(materialId).exec())
            .then(function (material) {
                var materialData = material.toObject({getters: false, virtuals: true, versionKey: false});
                return res.json({
                    material: materialData
                });
            })
            .catch(function (err) {
                res.status(404);
                return res.json({
                    message: res.__('Material %s not found.', materialId)
                });
            });
    };

    this.delete = function (req, res) {
        var materialId = req.params.material_id;

        when(Material.findById(materialId).remove().exec())
            .then(function () {
                return res.json({
                    message: res.__('Material %s successfully deleted.', materialId)
                });
            })
            .catch(function (err) {
                res.status(500);
                return res.json({
                    message: res.__(err.message)
                });
            });
    };

    return this;
};