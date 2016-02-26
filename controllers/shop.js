module.exports = function (app) {

    this.index = function (req, res) {
        res.render('shop/index');
    };

    return this;
};