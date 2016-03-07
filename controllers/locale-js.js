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
                'Error while retrieving data for user %s.',
                'Delete %s shop?',
                'Error while retrieving data for shop %s.',
                'Delete %s brand?',
                'Error while retrieving data for brand %s.',
                'Delete %s material?',
                'Error while retrieving data for material %s.',
                'Delete %s filament?',
                'Error while retrieving data for filament %s.'
            ]
        });
    };
    return this;
};