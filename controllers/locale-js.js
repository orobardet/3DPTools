module.exports = function (app) {
    this.localeJs = function (req, res) {
        res.set('Content-Type', 'text/javascript; charset=utf-8');
        return res.render('locale-js', {
            layout: false,
            localeStrings: [
                'Yes',
                'No',
                'Confirm',
                'Delete %s user?',
                'Error while retrieving data for user %s.'
            ]
        });
    };
    return this;
};