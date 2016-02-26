module.exports = function (app) {

    this.index = function (req, res) {
        res.render('material/index');
    };

    return this;
};