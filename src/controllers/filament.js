module.exports = function (app) {
    var when = require('when');
    var Filament = app.models.filament;
    var Shop = app.models.shop;
    var Brand = app.models.brand;
    var Material = app.models.material;
    var thisController = this;
    var fs = require('fs');
    var gm = require('gm').subClass({imageMagick: true});
    var thatController = this;

    this.index = function (req, res, next) {
        when(Filament.find().populate('material brand shop').sort({
            'material.name': 1,
            'color.code': 1,
            'brand.name': 1
        }).exec())
            .then(function (filaments) {
                return res.render('filament/index', {
                    filaments: filaments,
                    pageTitle: 'Filaments',
                    errors: []
                });
            })
            .catch(function (err) {
                return next(err);
            });
    };

    this.add = function (req, res, next) {
        if (!req.form.isValid) {
            return thisController.addForm(req, res, next);
        }

        var filament = new Filament({
            name: req.form.name,
            description: req.form.description,
            brand: req.form.brand,
            material: req.form.material,
            diameter: req.form.diameter,
            color: {
                name: req.form.colorName,
                code: req.form.colorCode
            },
            shop: req.form.shop,
            buyDate: new Date(req.form.buyDate * 1000),
            price: req.form.price,
            density: req.form.density,
            initialMaterialWeight: req.form.initialMaterialWeight,
            initialTotalWeight: req.form.initialTotalWeight,
            materialLeftPercentage: 100,
            flowPercentage: 100,
            speedPercentage: 100
        });
        if (req.form.headTempMin) {
            filament.headTemp.min = req.form.headTempMin;
        }
        if (req.form.headTempMax) {
            filament.headTemp.max = req.form.headTempMax;
        }
        if (req.form.headTempExperienced) {
            filament.headTemp.experienced = req.form.headTempExperienced;
        }
        if (req.form.bedTempMin) {
            filament.bedTemp.min = req.form.bedTempMin;
        }
        if (req.form.bedTempMax) {
            filament.bedTemp.max = req.form.bedTempMax;
        }
        if (req.form.bedTempExperienced) {
            filament.bedTemp.experienced = req.form.bedTempExperienced;
        }
        if (req.form.flowPercentage && req.form.flowPercentage !== '') {
            filament.flowPercentage = req.form.flowPercentage;
        }
        if (req.form.speedPercentage && req.form.speedPercentage !== '') {
            filament.speedPercentage = req.form.speedPercentage;
        }
        filament.save(function (err) {
            if (err) {
                return next(err);
            }
            return res.redirect("/filament");
        });
    };

    this.filterPredefinedColors = function (used, predefined) {
        var filtered = {};
        var predefinedValues = [];

        for (var idx in predefined) {
            predefinedValues.push(predefined[idx]);
        }

        for (var idx in used) {
            var color = used[idx];
            if (predefinedValues.indexOf(color.code) == -1) {
                filtered[color.name] = color.code;
            }
        }

        return filtered;
    };

    this.addForm = function (req, res) {
        when.all([
            Shop.find().sort('name').exec(),
            Brand.find().sort('name').exec(),
            Material.find().sort('name').exec(),
            Filament.find().distinct('color').exec()
        ]).spread(function (shops, brands, materials, usedColors) {
            var predefinedColors = res.app.get('config').get('filament:colors');
            usedColors = thatController.filterPredefinedColors(usedColors, predefinedColors);
            return res.render('filament/add', {
                shops: shops,
                brands: brands,
                materials: materials,
                usedColors: usedColors,
                predefinedColors: predefinedColors,
                errors: (req.form) ? req.form.getErrors() : []
            });
        });
    };

    this.edit = function (req, res, next) {
        var filamentId = req.params.filament_id;

        when(Filament.findById(filamentId).exec())
            .then(function (filament) {
                if (!req.form.isValid) {
                    return thisController.editForm(req, res, next);
                }

                filament.name = req.form.name;
                filament.description = req.form.description;
                filament.brand = req.form.brand;
                filament.material = req.form.material;
                filament.diameter = req.form.diameter;
                filament.color.name = req.form.colorName;
                filament.color.code = req.form.colorCode;
                filament.shop = req.form.shop;
                filament.buyDate = new Date(req.form.buyDate * 1000);
                filament.price = req.form.price;
                filament.density = req.form.density;
                filament.initialMaterialWeight = req.form.initialMaterialWeight;
                filament.initialTotalWeight = req.form.initialTotalWeight;
                filament.headTemp.min = req.form.headTempMin;
                filament.headTemp.max = req.form.headTempMax;
                filament.headTemp.experienced = req.form.headTempExperienced;
                filament.bedTemp.min = req.form.bedTempMin;
                filament.bedTemp.max = req.form.bedTempMax;
                filament.bedTemp.experienced = req.form.bedTempExperienced;
                filament.flowPercentage = (req.form.flowPercentage !== '') ? req.form.flowPercentage : 100;
                filament.speedPercentage = (req.form.speedPercentage !== '') ? req.form.speedPercentage : 100;
                filament.name = req.form.name;

                filament.save(function (err) {
                    if (err) {
                        return next(err);
                    }
                    return res.redirect("/filament");
                });
            });
    };

    this.editForm = function (req, res) {
        var filamentId = req.params.filament_id;

        when(Filament.findById(filamentId).populate('material brand shop').exec())
            .then(function (filament) {
                when.all([
                    Shop.find().sort('name').exec(),
                    Brand.find().sort('name').exec(),
                    Material.find().sort('name').exec(),
                    Filament.find().distinct('color').exec()
                ]).spread(function (shops, brands, materials, usedColors) {
                    var predefinedColors = res.app.get('config').get('filament:colors');
                    usedColors = thatController.filterPredefinedColors(usedColors, predefinedColors);
                    return res.render('filament/edit', {
                        filament: filament,
                        shops: shops,
                        brands: brands,
                        materials: materials,
                        usedColors: usedColors,
                        predefinedColors: predefinedColors,
                        errors: (req.form) ? req.form.getErrors() : []
                    });
                });
            })
            .catch(function (err) {
                res.status(404);
                return res.json({
                    message: res.__('filament %s not found.', filamentId)
                });
            });
    };

    this.get = function (req, res) {
        var filamentId = req.params.filament_id;

        // Pas de populate des magasins/marque/matière, pour éviter que le document ne soit trop gros.
        when(Filament.findById(filamentId).exec())
            .then(function (filament) {
                var filamentData = filament.toObject({getters: false, virtuals: true, versionKey: false});
                delete filamentData.pictures; // Pour éviter de renvoyer un document avec toutes les images qui ne soit trop gros.

                return res.json({
                    filament: filamentData
                });
            })
            .catch(function (err) {
                res.status(404);
                return res.json({
                    message: res.__('Filament %s not found.', filamentId)
                });
            });
    };

    this.show = function (req, res) {
        var filamentId = req.params.filament_id;

        when(Filament.findById(filamentId).populate('material brand shop').exec())
            .then(function (filament) {
                return res.render('filament/show', {
                    filament: filament
                });
            })
            .catch(function (err) {
                res.status(404);
                return res.json({
                    message: res.__('Filament %s not found.', filamentId)
                });
            });
    };

    this.delete = function (req, res) {
        var filamentId = req.params.filament_id;

        when(Filament.findById(filamentId).remove().exec())
            .then(function () {
                return res.json({
                    message: res.__('Filament %s successfully deleted.', filamentId)
                });
            })
            .catch(function (err) {
                res.status(500);
                return res.json({
                    message: res.__(err.message)
                });
            });
    };

    this.leftMaterialForm = function (req, res) {
        var filamentId = req.params.filament_id;

        when(Filament.findById(filamentId).populate('material brand shop').exec())
            .then(function (filament) {
                return res.render('filament/left-material', {
                    filament: filament,
                    errors: (req.form) ? req.form.getErrors() : []
                });
            })
            .catch(function (err) {
                res.status(404);
                return res.json({
                    message: res.__('filament %s not found.', filamentId)
                });
            });
    };

    this.leftMaterial = function (req, res, next) {
        var filamentId = req.params.filament_id;

        when(Filament.findById(filamentId).exec())
            .then(function (filament) {
                if (!req.form.isValid) {
                    return thisController.leftMaterialForm(req, res, next);
                }

                if (req.form.leftLength) {
                    filament.setLeftLength(req.form.leftLength);

                    filament.save(function (err) {
                        if (err) {
                            return next(err);
                        }
                        return res.redirect("/filament/show/" + filamentId);
                    });
                } else if (req.form.leftLength) {

                } else {
                    return res.redirect("/filament/show/" + filamentId);
                }
            });
    };

    this.addPicture = function (req, res, next) {
        var filamentId = req.params.filament_id;
        var uploadedPicture = req.file;

        when(Filament.findById(filamentId).exec())
            .then(function (filament) {
                gm(uploadedPicture.path).autoOrient().write(uploadedPicture.path, function (err) {
                    if (err) {
                        return next(err);
                    }

                    var picture = {
                        name: uploadedPicture.originalname,
                        size: uploadedPicture.size,
                        mimeType: uploadedPicture.mimetype,
                        data: fs.readFileSync(uploadedPicture.path)
                    }
                    filament.addPicture(picture);

                    fs.unlink(uploadedPicture.path);

                    filament.save(function (err) {
                        if (err) {
                            return next(err);
                        }
                        return res.redirect("/filament/show/" + filament.id);
                    });
                });
            });
    };

    this.deletePicture = function (req, res, next) {
        var filamentId = req.params.filament_id;
        var pictureId = req.params.picture_id;

        when(Filament.findById(filamentId).exec())
            .then(function (filament) {
                if (filament.deletePicture(pictureId)) {
                    filament.save(function (err) {
                        if (err) {
                            return next(err);
                        }
                        if (req.method === 'DELETE') {
                            return res.json({});
                        }

                        return res.redirect("/filament/show/" + filament.id);
                    });
                } else {
                    res.status(404);
                    if (req.method === 'DELETE') {
                        return res.json({
                            message: res.__("Filament's picture %s not found.", pictureId)
                        });
                    }

                    return next(new Error(res.__("Filament's picture %s not found.", pictureId)));
                }
            });
    };

    this.getPicture = function (req, res) {
        var filamentId = req.params.filament_id;
        var pictureId = req.params.picture_id;

        when(Filament.findById(filamentId).exec())
            .then(function (filament) {
                var picture = filament.getPicture(pictureId);
                if (picture) {
                    res.set('Content-Type', picture.mimeType);
                    res.set('Content-Length', picture.size);
                    return res.send(picture.data);
                }
                res.status(404);
                return res.json({
                    message: res.__('Picture %s not found.', pictureId)
                });
            })
            .catch(function (err) {
                res.status(404);
                return res.json({
                    message: res.__('Filament %s not found.', filamentId)
                });
            });
    };

    this.pictureForm = function (req, res, next) {
        var filamentId = req.params.filament_id;

        when(Filament.findById(filamentId).exec())
            .then(function (filament) {
                return res.render('filament/picture', {
                    filamentId: filamentId,
                    filament: filament,
                    errors: []
                });
            })
            .catch(function (err) {
                return next(err);
            });
    };

    this.downloadPicture = function (req, res) {
        var filamentId = req.params.filament_id;
        var pictureId = req.params.picture_id;

        when(Filament.findById(filamentId).exec())
            .then(function (filament) {
                var picture = filament.getPicture(pictureId);
                if (picture) {
                    res.set('Content-Type', picture.mimeType);
                    res.set('Content-Length', picture.size);
                    res.set('Content-Disposition', 'attachment; filename="' + picture.name + '"');
                    return res.send(picture.data);
                }
                res.status(404);
                return res.send(res.__('Picture %s not found.', pictureId));
            })
            .catch(function (err) {
                res.status(404);
                return res.json(res.__('Filament %s not found.', filamentId));
            });
    };

    return this;
};