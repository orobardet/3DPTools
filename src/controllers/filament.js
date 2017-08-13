'use strict';

module.exports = function (app) {
    const Filament = app.models.filament;
    const Shop = app.models.shop;
    const Brand = app.models.brand;
    const Material = app.models.material;
    const fs = require('fs-promise');
    const gm = require('gm').subClass({imageMagick: true});

    // Sorting modes definition
    // Each mode correspond to a list of field to order, with order way for each field (1 or -1)
    const filamentSortDefinition = {
        'default': {
            label: 'Default sort',
            sort: {
                'color.code': 1,
                'material.name': 1,
                'brand.name': 1
            }
        },
        'price_kg_asc': {
            label: 'Price/Kg - to +',
            sort: {
                'pricePerKg': 1,
                'material.name': 1,
                'color.code': 1,
                'brand.name': 1
            }
        },
        'price_kg_desc': {
            label: 'Price/Kg + to -',
            sort: {
                'pricePerKg': -1,
                'material.name': 1,
                'color.code': 1,
                'brand.name': 1
            }
        },
        'material_left_asc': {
            label: 'Material left - to +',
            sort: {
                'materialLeftPercentage': 1,
                'material.name': 1,
                'color.code': 1,
                'brand.name': 1
            }
        },
        'material_left_desc': {
            label: 'Material left + to -',
            sort: {
                'materialLeftPercentage': -1,
                'material.name': 1,
                'color.code': 1,
                'brand.name': 1
            }
        }
    };

    /**
     * List and search of filament
     */
    this.index = async (req, res) => {
        req.setOriginUrl([
            'filament/view',
            'filament/add',
            'filament/edit',
            'filament/left-material',
            'filament/add-picture',
            'filament/finished',
            'filament/cost-calculator'
        ], req.originalUrl);

        // Prepare a simplified sort list that will be used in the GUI for displaying sort options
        const sortList = Object.entries(filamentSortDefinition).map(([sortId, sortData]) => {
            return {value: sortId, label: sortData.label}
        });

        // Analyse received parameters and extract potential filter (search) values
        const search = req.form;
        let filamentFilter = {};
        if (search.material && search.material !== '') {
            filamentFilter.material = search.material;
        }
        if (search.shop && search.shop !== '') {
            filamentFilter.shop = search.shop;
        }
        if (search.brand && search.brand !== '') {
            filamentFilter.brand = search.brand;
        }
        if (search.color && search.color !== '') {
            filamentFilter['color.code'] = search.color;
        }
        filamentFilter.finished = false;
        if (search.finished) {
            if (search.finished === 'finished') {
                filamentFilter.finished = true;
            } else if (search.finished === 'all') {
                delete filamentFilter.finished;
            }
        }

        // Check if the potential sort field received in parameters is valid (i.e. it is known)
        let selectedSort = 'default';
        if (search.sort && Object.keys(filamentSortDefinition).indexOf(search.sort) > -1) {
            selectedSort = search.sort;
        }

        // Retrieve the filament list, possibly with filter and sort options
        // Also retrieve the lists of all materials, brands, shops and colors,
        // that will be used to construct filter form
        let [filaments, materials, brands, shops, colors] = await Promise.all([
            Filament.list({
                filter: filamentFilter,
                sort: filamentSortDefinition[selectedSort].sort
            }),
            Material.find().sort('name').exec(),
            Brand.find().sort('name').exec(),
            Shop.find().sort('name').exec(),
            Filament.getColors()
        ]);
        // Add an empty entry at the beginning of each filter list (which means 'no filtering on this field')
        materials.unshift({name:'&nbsp;', id:null});
        shops.unshift({name:'&nbsp;', id:null});
        brands.unshift({name:'&nbsp;', id:null});
        colors.unshift({name:'&nbsp;', code: null});

        let formSearchData = filamentFilter;
        if (search.finished) {
            filamentFilter.finished = search.finished;
        }
        if (typeof formSearchData.finished !== 'undefined' && formSearchData.finished === false) {
            delete formSearchData.finished;
        }

        return res.render('filament/index', {
            search: Object.keys(formSearchData).length?search:null,
            materials: materials,
            brands: brands,
            shops: shops,
            colors: colors,
            filaments: filaments,
            sortList: sortList,
            selectedSort: selectedSort,
            pageTitle: 'Filaments',
            errors: []
        });
    };

    /**
     * Compute filament statistics, for the stat page.
     *
     * Heavily depends on Filament model, which is the one doing real stats computation.
     */
    this.stats = async (req, res, next) => {
        try {
            let [
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
                purchaseInterval,
                usagePerColors,
                usagePerMaterials,
                usagePerBrands,
                pricePerKg
            ] = await Promise.all([
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
                Filament.getPurchaseIntervalStats(),
                Filament.getUsagePerColors(),
                Filament.getUsagePerMaterials(),
                Filament.getUsagePerBrands(),
                Filament.getStatsCostPerKg()
            ]);

            return res.render('filament/stats', {
                navSubModule: 'stats',
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
                    purchaseInterval: purchaseInterval,
                    usagePer: {
                        colors: usagePerColors,
                        materials: usagePerMaterials,
                        brands: usagePerBrands
                    },
                    pricePerKg: pricePerKg
                },
                errors: []
            });
        } catch (err) {
            return next(err);
        }
    };

    /**
     * Show the add new filament form
     */
    this.addForm = async (req, res, next) => {
        try {
            const filamentId = req.params.filament_id;

            // Get the data to populate form choices:
            // - shops, brands, materials lists
            // - List of all colors used in existing filaments
            let [shops, brands, materialsTree, materials, usedColors, sourceFilament] = await Promise.all([
                Shop.find().sort('name').exec(),
                Brand.find().sort('name').exec(),
                Material.list({tree: true, locale: res.getLocale()}),
                Material.list({locale: res.getLocale()}),
                Filament.find().distinct('color').exec(),
                Filament.findById(filamentId).populate('material brand shop').exec()
            ]);

            // Get the list of all predefined colors (from config), and removed them
            // from colors already used in filament (to avoid duplicates)
            const predefinedColors = res.app.get('config').get('filament:colors');
            usedColors = this.filterPredefinedColors(usedColors, predefinedColors);

            return res.render('filament/add', {
                cancelUrl: req.getOriginUrl("filament/add", "/filament"),
                shops: shops,
                brands: brands,
                materialsTree: materialsTree,
                materials: materials,
                usedColors: usedColors,
                predefinedColors: predefinedColors,
                sourceFilament: sourceFilament,
                errors: (req.form) ? req.form.getErrors() : []
            });
        } catch (err) {
            return next(err);
        }

    };

    /**
     * Add a new filament (process the form shown by `this.addForm`)
     */
    this.add = async (req, res, next) => {
        try {
            if (!req.form.isValid) {
                return this.addForm(req, res, next);
            }

            let filament = new Filament({
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
                flowPercentage: 100
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
            if (req.form.printingSpeedMin) {
                filament.printingSpeed.min = req.form.printingSpeedMin;
            }
            if (req.form.printingSpeedMax) {
                filament.printingSpeed.max = req.form.printingSpeedMax;
            }

            await filament.save();

            return res.redirect(req.getOriginUrl("filament/add", "/filament"));
        } catch(err) {
            return next(err);
        }
    };

    /**
     * Remove from a used colors list the colors in a predefined list,
     * so that the result used list does not contains any predefined colors (avoiding duplicates)
     */
    this.filterPredefinedColors = (used, predefined) => {
        let filtered = {};
        let predefinedValues = Object.values(predefined);

        for (let color of used) {
            if (predefinedValues.indexOf(color.code) === -1) {
                filtered[color.name] = color.code;
            }
        }

        return filtered;
    };

    /**
     * Show the edit filament form
     */
    this.editForm = async (req, res, next) => {
        try {
            const filamentId = req.params.filament_id;

            let filament;
            // Get the filament to edit
            try {
                filament = await Filament.findById(filamentId).populate('material brand shop').exec();
            } catch (err) {
                res.status(404);
                return res.json({
                    message: res.__('filament %s not found.', filamentId)
                });
            }

            // Get the data to populate form choices:
            // - shops, brands, materials lists
            // - List of all colors used in existing filaments
            let [shops, brands, materialsTree, materials, usedColors] = await Promise.all([
                Shop.find().sort('name').exec(),
                Brand.find().sort('name').exec(),
                Material.list({tree: true, locale: res.getLocale()}),
                Material.list({locale: res.getLocale()}),
                Filament.find().distinct('color').exec()
            ]);

            const predefinedColors = res.app.get('config').get('filament:colors');
            usedColors = this.filterPredefinedColors(usedColors, predefinedColors);

            // Get the list of all predefined colors (from config), and removed them
            // from colors already used in filament (to avoid duplicates)
            return res.render('filament/edit', {
                cancelUrl: req.getOriginUrl("filament/edit", "/filament"),
                filament: filament,
                shops: shops,
                brands: brands,
                materialsTree: materialsTree,
                materials: materials,
                usedColors: usedColors,
                predefinedColors: predefinedColors,
                errors: (req.form) ? req.form.getErrors() : []
            });
        } catch (err) {
            return next(err);
        }
    };

    /**
     * Save an edited filament (process the form shown by `this.editForm`)
     */
    this.edit = async (req, res, next) => {
        try {
            const filamentId = req.params.filament_id;

            let filament = await Filament.findById(filamentId).exec();

            if (!req.form.isValid) {
                return this.editForm(req, res, next);
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
            filament.printingSpeed.min = req.form.printingSpeedMin;
            filament.printingSpeed.max = req.form.printingSpeedMax;
            filament.name = req.form.name;

            await filament.save();

            return res.redirect(req.getOriginUrl("filament/edit", "/filament"));

        } catch (err) {
            return next(err);
        }
    };

    /**
     * Get filament data
     */
    this.get = async (req, res, next) => {
        try {
            const filamentId = req.params.filament_id;
            let filament;

            try {
                // Pas de populate des magasin/marque/matière, pour éviter que le document ne soit trop gros.
                filament = await Filament.findById(filamentId).exec();
            } catch(err) {
                res.status(404);
                return res.json({
                    message: res.__('Filament %s not found.', filamentId)
                });
            }

            let filamentData = filament.toObject({getters: false, virtuals: true, versionKey: false});
            delete filamentData.pictures; // Pour éviter de renvoyer un document avec toutes les images qui ne soit trop gros.

            return res.json({
                filament: filamentData
            });

        } catch(err) {
            return next(err);
        }
    };

    /**
     * Show the filament details
     */
    this.show = async (req, res, next) => {
        try {
            const filamentId = req.params.filament_id;

            req.setOriginUrl([
                'filament/view',
                'filament/add',
                'filament/edit',
                'filament/left-material',
                'filament/finished',
                'filament/add-picture'
            ], req.originalUrl);

            // Retrieve filament from database
            let filament;
            try {
                filament = await Filament.findById(filamentId).populate('material brand shop').exec();
            } catch(err) {
                res.status(404);
                return res.json({
                    message: res.__('Filament %s not found.', filamentId)
                });
            }

            return res.render('filament/show', {
                filament: filament
            });

        } catch(err) {
            return next(err);
        }
    };

    /**
     * Delete a filament
     */
    this.delete = async (req, res, next) => {
        try {
            const filamentId = req.params.filament_id;
            let filament;

            try {
                filament = await Filament.findById(filamentId).remove().exec();
            } catch (err) {
                res.status(500);
                return res.json({
                    message: res.__(err.message)
                });

            }

            return res.json({
                message: res.__('Filament %s successfully deleted.', filamentId)
            });

        } catch(err) {
            return next(err);
        }
    };

    /**
     * Show the form to set material left of filament
     */
    this.leftMaterialForm = async (req, res, next) => {
        try {
            const filamentId = req.params.filament_id;
            let filament;

            try {
                filament = await Filament.findById(filamentId).populate('material brand shop').exec();
            } catch (err) {
                res.status(404);
                return res.json({
                    message: res.__('filament %s not found.', filamentId)
                });
            }

            return res.render('filament/left-material', {
                cancelUrl: req.getOriginUrl("filament/left-material", "/filament"),
                filament: filament,
                errors: (req.form) ? req.form.getErrors() : []
            });

        } catch (err) {
            return next(err);
        }
    };

    /**
     * Change the material left of a filament (process the form shown by `this.leftMaterialForm`)
     */
    this.leftMaterial = async (req, res, next) => {
        try {
            const filamentId = req.params.filament_id;
            let filament;

            try {
                filament = await Filament.findById(filamentId).exec();
            } catch (err) {
                res.status(404);
                return res.json({
                    message: res.__('filament %s not found.', filamentId)
                });
            }

            if (!req.form.isValid) {
                return this.leftMaterialForm(req, res, next);
            }

            const leftLength = req.form.leftLength;
            const leftTotalWeight = req.form.leftTotalWeight;
            const relativeLength = req.form.relativeLength;

            if (leftLength) {
                filament.setLeftLength(req.form.leftLength);
                filament.setLastUsed();

                await filament.save();

                return res.redirect(req.getOriginUrl("filament/left-material", "/filament"));
            } else if (leftTotalWeight) {
                let weight = req.form.leftTotalWeight;
                if (req.form.weighUnit === "g") {
                    weight /= 1000;
                }
                filament.setLeftTotalWeight(weight);
                filament.setLastUsed();

                await filament.save();
                return res.redirect(req.getOriginUrl("filament/left-material", "/filament"));
            } else if (relativeLength) {
                const sign = req.form.relativeLengthSign;
                let leftLength = filament.getLeftLength();

                if (sign === '+') {
                    leftLength += parseFloat(relativeLength);
                } else {
                    leftLength -= parseFloat(relativeLength);
                }
                filament.setLeftLength(leftLength);
                filament.setLastUsed();

                await filament.save();
                return res.redirect(req.getOriginUrl("filament/left-material", "/filament"));
            } else {
                return res.redirect(req.getOriginUrl("filament/left-material", "/filament"));
            }

        } catch (err) {
            return next(err);
        }
    };

    /**
     * Manage live preview of left material form, by computing filament left from input data
     */
    this.computeLeftMaterial = async (req, res, next) => {
        try {
            const filamentId = req.params.filament_id;

            let filament = await Filament.findById(filamentId).exec();

            if (!req.form.isValid) {
                return this.leftMaterialForm(req, res, next);
            }

            const leftLength = req.form.leftLength;
            const leftTotalWeight = req.form.leftTotalWeight;
            const relativeLength = req.form.relativeLength;

            let responseData = {};
            if (leftLength) {
                filament.setLeftLength(req.form.leftLength);
                responseData.weight = filament.leftMaterialWeight();
            }
            if (leftTotalWeight) {
                let weight = req.form.leftTotalWeight;
                if (req.form.weighUnit === "g") {
                    weight /= 1000;
                }
                filament.setLeftTotalWeight(weight);
                responseData.length = filament.getLeftLength();
            }
            if (relativeLength) {
                const sign = req.form.relativeLengthSign;
                let leftLength = filament.getLeftLength();

                if (sign === '+') {
                    leftLength += parseFloat(relativeLength);
                } else {
                    leftLength -= parseFloat(relativeLength);
                }

                filament.setLeftLength(leftLength);
                responseData.weight = filament.leftMaterialWeight();
                responseData.length = filament.getLeftLength();
            }

            if (leftLength || leftTotalWeight || relativeLength) {
                responseData.percentageLeft = filament.materialLeftPercentage;
            }

            return res.json(responseData);

        } catch(err) {
            return next(err);
        }
    };

    /**
     * Show the form to add a picture to a filament
     */
    this.pictureForm = async (req, res, next) => {
        try {
            const filamentId = req.params.filament_id;

            let filament = await Filament.findById(filamentId).exec();

            return res.render('filament/picture', {
                cancelUrl: req.getOriginUrl("filament/add-picture", "/filament"),
                filamentId: filamentId,
                filament: filament,
                errors: []
            });

        } catch(err) {
            return next(err);
        }
    };

    /**
     * Add a picture to a filament (process the form shown by `this.pictureForm`)
     */
    this.addPicture = async (req, res, next) => {
        try {
            const filamentId = req.params.filament_id;
            const uploadedPicture = req.file;

            let filament = await Filament.findById(filamentId).exec();

            gm(uploadedPicture.path).autoOrient().write(uploadedPicture.path, async err => {
                if (err) {
                    return next(err);
                }

                let picture = {
                    name: uploadedPicture.originalname,
                    size: uploadedPicture.size,
                    mimeType: uploadedPicture.mimetype,
                    data: await fs.readFile(uploadedPicture.path)
                };

                filament.addPicture(picture);

                await fs.unlink(uploadedPicture.path);

                await filament.save();

                return res.redirect(req.getOriginUrl("filament/add-picture", "/filament"));
            });
        } catch (err) {
            return next(err);
        }
    };

    /**
     * Delete a picture from a filament
     */
    this.deletePicture = async (req, res, next) => {
        try {
            const filamentId = req.params.filament_id;
            const pictureId = req.params.picture_id;

            let filament;

            try {
                filament = await Filament.findById(filamentId).exec();
            } catch (err) {
                return res.json({
                    message: res.__("filament %s not found..", filamentId)
                });
            }


            if (filament.deletePicture(pictureId)) {
                await filament.save();

                if (req.method === 'DELETE') {
                    return res.json({});
                }

                return res.redirect("/filament/show/" + filament.id);
            } else {
                res.status(404);
                if (req.method === 'DELETE') {
                    return res.json({
                        message: res.__("Filament's picture %s not found.", pictureId)
                    });
                }

                return next(new Error(res.__("Filament's picture %s not found.", pictureId)));
            }
        } catch (err) {
            return next(err);
        }
    };

    /**
     * Get a picture of a filament
     */
    this._getPicture = async (downloadPicture, req, res, next) => {
        try {
            const filamentId = req.params.filament_id;
            const pictureId = req.params.picture_id;
            let filament;

            try {
                filament = await Filament.findById(filamentId).exec();
            } catch (err) {
                res.status(404);
                return res.json({
                    message: res.__('Filament %s not found.', filamentId)
                });
            }

            const picture = filament.getPicture(pictureId);
            if (picture) {
                res.set('Content-Type', picture.mimeType);
                res.set('Content-Length', picture.size);
                if (downloadPicture) {
                    res.set('Content-Disposition', 'attachment; filename="' + picture.name + '"');
                }

                return res.send(picture.data);
            }

            res.status(404);
            return res.json({
                message: res.__('Picture %s not found.', pictureId)
            });

        } catch (err) {
            return next(err);
        }
    };

    /**
     * Get a picture of a filament to display it
     */
    this.showPicture = async (req, res, next) => {
        try {
            return this._getPicture(false, req, res, next);

        } catch (err) {
            return next(err);
        }
    };

    /**
     * Get a picture of a filament to download it
     */
    this.downloadPicture = async (req, res, next) => {
        try {
            return this._getPicture(true, req, res, next);

        } catch (err) {
            return next(err);
        }
    };

    /**
     * Show the cost calculator form
     */
    this.costCalculatorForm = async (req, res, next) => {
        try {
            let [filaments, materials, brands, colors] = await Promise.all([
                Filament.find({finished:false}).populate('material brand shop').sort({
                    'material.name': 1,
                    'color.code': 1,
                    'brand.name': 1
                }),
                Material.find().sort('name').exec(),
                Brand.find().sort('name').exec(),
                Filament.getColors()
            ]);

            // Add an empty entry at the beginning of each filter list (which means 'no filtering on this field')
            materials.unshift({name:'&nbsp;', id:null});
            brands.unshift({name:'&nbsp;', id:null});
            colors.unshift({name:'&nbsp;', code: null});

            return res.render('filament/cost-calculator', {
                cancelUrl: req.getOriginUrl("filament/cost-calculator", "/filament"),
                materials: materials,
                brands: brands,
                colors: colors,
                filaments: filaments,
                errors: (req.form) ? req.form.getErrors() : []
            });

        } catch (err) {
            return next(err);
        }
    };

    /**
     * Compute and return filament cost (process the form shown by `costCalculatorForm`)
     *
     * To be called in Ajax mode, meaning to return JSON, not HTML
     */
    this.costCalculator = async (req, res, next) => {
        try {
            const filamentId = req.params.filament_id;

            let filament = await Filament.findById(filamentId).exec();

            if (!req.form.isValid) {
                return res.json({errors: req.form.errors});
            }

            let responseData = {
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
                filament.setLeftWeight(responseData.weight);
                responseData.length = filament.getLeftLength();
            }

            if (responseData.weight) {
                responseData.cost = responseData.weight * filament.price / filament.initialMaterialWeight;
            }

            return res.json(responseData);

        } catch (err) {
            return next(err);
        }
    };

    /**
     * Search filament to filter cost calculator list
     */
    this.costCalculatorSearch = async (req, res, next) => {
        try {
            // Analyse received parameters and extract potential filter (search) values
            const search = req.form;
            let filamentFilter = {};
            if (search.material && search.material !== '') {
                filamentFilter.material = search.material;
            }
            if (search.brand && search.brand !== '') {
                filamentFilter.brand = search.brand;
            }
            if (search.color && search.color !== '') {
                filamentFilter['color.code'] = search.color;
            }

            // Check if the potential sort field received in parameters is valid (i.e. it is known)
            let selectedSort = 'default';
            if (search.sort && Object.keys(filamentSortDefinition).indexOf(search.sort) > -1) {
                selectedSort = search.sort;
            }

            // Retrieve the filament list, possibly with filter and sort options
            // Also retrieve the lists of all materials, brands, shops and colors,
            // that will be used to construct filter form
            let filaments = await Filament.list({ filter: filamentFilter });

            let filamentsLite = filaments.map( filament => {
                let filamentData = filament.toObject({getters: false, virtuals: true, versionKey: false});
                delete filamentData.pictures; // Pour éviter de renvoyer un document avec toutes les images qui ne soit trop gros.
                return filamentData;
            });

            let formSearchData = filamentFilter;
            let html = await new Promise((resolve, reject) => {
                res.render('filament/partial/cost-calculator-filament-list.ejs',
                    {
                        layout: 'no-layout',
                        filaments: filaments

                    },
                    (err, str) => {
                        if (err) {
                            reject(err);
                        }
                        resolve(str);
                });
            });

            return res.json({
                search: Object.keys(formSearchData).length?search:null,
                filaments: filamentsLite,
                html: html
            });
        } catch (err) {
            return next(err);
        }
    };

    /**
     * Set the filament as finished or not
     */
    this.finished = async (req, res, next) => {
        try {
            const filamentId = req.params.filament_id;
            const filamentStatusParam = req.params.status;

            if ((filamentStatusParam !== "1") && (filamentStatusParam !== "0")) {
                return res.redirect(req.getOriginUrl("filament/finished", "/filament"));
            }

            let filament = await Filament.findById(filamentId).exec();
            const filamentFinished = (filamentStatusParam === "1");

            if (filament.finished === filamentFinished) {
                return res.redirect(req.getOriginUrl("filament/finished", "/filament"));
            }

            filament.finished = filamentFinished;
            if (filamentFinished) {
                filament.finishedDate = Date.now();
            } else {
                filament.finishedDate = null;
            }

            await filament.save();

            return res.redirect(req.getOriginUrl("filament/finished", "/filament"));

        } catch (err) {
            return next(err);
        }
    };

    return this;
};