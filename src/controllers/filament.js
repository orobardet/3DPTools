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
        req.setOriginUrl([
            'filament/view',
            'filament/add',
            'filament/edit',
            'filament/left-material',
            'filament/add-picture',
            'filament/cost-calculator'
        ], req.originalUrl);

        var search = req.form;
        var filamentFilter = {};

        if (search.material && search.material !== '') {
            filamentFilter.material = search.material;
        }

        when.all([
            Filament.find(filamentFilter).populate('material brand shop').sort({
            'material.name': 1,
            'color.code': 1,
            'brand.name': 1
        }).exec(),
            Material.find().sort('name').exec(),
            Brand.find().sort('name').exec(),
            Shop.find().sort('name').exec()
        ]).spread(function (filaments, materials, brands, shops) {

                materials.unshift({name:'', id:''});
                return res.render('filament/index', {
                    search: search,
                    materials: materials,
                    brands: brands,
                    shops: shops,
                    filaments: filaments,
                    pageTitle: 'Filaments',
                    errors: []
                });
            })
            .catch(function (err) {
                return next(err);
            });
    };

    this.stats = function (req, res, next) {
        when.all([
            Filament.count({}).exec(),
            Filament.getTotalCost(),
            Filament.getTotalWeight(),
            Filament.getTotalLength(),
            Filament.getStatsPerUsage(),
            Filament.getCountPerBrands(),
            Filament.getCountPerShops(),
            Filament.getCountPerMaterials(),
            Filament.getCountPerColors(),
            Filament.getCostPerBrands(),
            Filament.getCostPerShops(),
            Filament.getCostPerMaterials(),
            Filament.getCostPerColors(),
            Filament.getBoughtTimeline(),
            Filament.getUsagePerColors(),
            Filament.getUsagePerMaterials(),
            Filament.getUsagePerBrands(),
            Filament.getStatsCostPerKg()
        ]).spread(function (
            filamentTotalCount,
            filamentTotalCost,
            filamentTotalWeight,
            filamentTotalLength,
            statsPerUsage,
            countPerBrands,
            countPerShops,
            countPerMaterials,
            countPerColors,
            costPerBrands,
            costPerShops,
            costPerMaterials,
            costPerColors,
            boughtTimeline,
            usagePerColors,
            usagePerMaterials,
            usagePerBrands,
            pricePerKg
        ) {
            return res.render('filament/stats', {
                pageTitle: 'Filaments statistics',
                stats: {
                    totals: {
                        count: filamentTotalCount,
                        cost: filamentTotalCost,
                        weight: filamentTotalWeight,
                        length: filamentTotalLength
                    },
                    count: {
                        total: filamentTotalCount,
                        byBrands: countPerBrands,
                        byShops: countPerShops,
                        byMaterials: countPerMaterials,
                        byColors: countPerColors
                    },
                    costs: {
                        total: filamentTotalCost,
                        byBrands: costPerBrands,
                        byShops: costPerShops,
                        byMaterials: costPerMaterials,
                        byColors: costPerColors
                    },
                    usage: {
                        weight: {
                            total: statsPerUsage.totalWeight,
                            left: statsPerUsage.totalLeftWeight,
                            used: statsPerUsage.totalWeight - statsPerUsage.totalLeftWeight
                        },
                        length: {
                            total: statsPerUsage.totalLength,
                            left: statsPerUsage.totalLeftLength,
                            used: statsPerUsage.totalLength - statsPerUsage.totalLeftLength
                        },
                        cost: {
                            total: statsPerUsage.totalCost,
                            left: statsPerUsage.totalLeftCost,
                            used: statsPerUsage.totalCost - statsPerUsage.totalLeftCost
                        }
                    },
                    boughtHistory: boughtTimeline,
                    usagePer: {
                        colors: usagePerColors,
                        materials: usagePerMaterials,
                        brands: usagePerBrands
                    },
                    pricePerKg: pricePerKg
                },
                errors: []
            });
        }).otherwise(function (err) {
            next(err);
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
            return res.redirect(req.getOriginUrl("filament/add", "/filament"));
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
                cancelUrl: req.getOriginUrl("filament/add", "/filament"),
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
                    return res.redirect(req.getOriginUrl("filament/edit", "/filament"));
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
                        cancelUrl: req.getOriginUrl("filament/edit", "/filament"),
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

        req.setOriginUrl([
            'filament/view',
            'filament/add',
            'filament/edit',
            'filament/left-material',
            'filament/add-picture'
        ], req.originalUrl);

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
                    cancelUrl: req.getOriginUrl("filament/left-material", "/filament"),
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
                    filament.setLastUsed();

                    filament.save(function (err) {
                        if (err) {
                            return next(err);
                        }
                        return res.redirect(req.getOriginUrl("filament/left-material", "/filament"));
                    });
                } else if (req.form.leftTotalWeight) {
                    var weight = req.form.leftTotalWeight;
                    if (req.form.weighUnit === "g") {
                        weight /= 1000;
                    }
                    filament.setLeftTotalWeight(weight);
                    filament.setLastUsed();

                    filament.save(function (err) {
                        if (err) {
                            return next(err);
                        }
                        return res.redirect(req.getOriginUrl("filament/left-material", "/filament"));
                    });
                } else {
                    return res.redirect(req.getOriginUrl("filament/left-material", "/filament"));
                }
            });
    };

    this.computeLeftMaterial = function (req, res, next) {
        var filamentId = req.params.filament_id;

        when(Filament.findById(filamentId).exec())
            .then(function (filament) {
                if (!req.form.isValid) {
                    return thisController.leftMaterialForm(req, res, next);
                }

                var responseData = {};
                if (req.form.leftLength) {
                    filament.setLeftLength(req.form.leftLength);
                    responseData.weight = filament.leftMaterialWeight();
                }
                if (req.form.leftTotalWeight) {
                    var weight = req.form.leftTotalWeight;
                    if (req.form.weighUnit === "g") {
                        weight /= 1000;
                    }
                    filament.setLeftTotalWeight(weight);
                    responseData.length = filament.getLeftLength();
                }
                responseData.percentageLeft = filament.materialLeftPercentage;
                return res.json(responseData);
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
                        return res.redirect(req.getOriginUrl("filament/add-picture", "/filament"));
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
                    cancelUrl: req.getOriginUrl("filament/add-picture", "/filament"),
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

    this.costCalculatorForm = function (req, res, next) {
        when(Filament.find().populate('material brand shop').sort({
            'material.name': 1,
            'color.code': 1,
            'brand.name': 1
        })).then(function (filaments) {
            return res.render('filament/cost-calculator', {
                cancelUrl: req.getOriginUrl("filament/cost-calculator", "/filament"),
                filaments: filaments,
                errors: (req.form) ? req.form.getErrors() : []
            });
        });
    };

    this.costCalculator = function (req, res, next) {
        var filamentId = req.params.filament_id;

        when(Filament.findById(filamentId).exec())
            .then(function (filament) {
                if (!req.form.isValid) {
                    return res.json({ errors: req.form.errors });
                }

                var responseData = {
                    cost: null,
                    weight: null,
                    length: null
                };

                if (req.form.length) {
                    filament.setLeftLength(req.form.length);
                    responseData.weight = filament.leftMaterialWeight();
                    responseData.length = req.form.length;
                }

                if (req.form.weight) {
                    responseData.weight = req.form.weight;
                    if (req.form.weighUnit === "g") {
                        responseData.weight /= 1000;
                    }
                    filament.setLeftTotalWeight(responseData.weight);
                    responseData.length = filament.getLeftLength();
                }

                if (responseData.weight) {
                    responseData.cost = responseData.weight * filament.price / filament.initialMaterialWeight;
                }

                return res.json(responseData);
            });
    };

    return this;
};