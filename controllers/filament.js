module.exports = function (app) {

    this.index = function (req, res) {
        res.render('filament/index');
    };

    return this;
};