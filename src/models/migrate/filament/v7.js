'use strict';

module.exports = function(filament, currentVersion, app) {
    const localVersion = 7;
    const Color = require('color');
    const NearestColor = require('lib/nearest-color');

    this.needMigration = function() {
        if (!filament._version || filament._version < localVersion) {
            return true;
        }

        return false;
    };

    this.migrate = function() {
        if (!this.needMigration()) {
            return;
        }

        const predefinedColors = app.get('config').get('filament:colors');

        let normalizedPredefinedColors = {};
        for (let [name, code] of Object.entries(predefinedColors)) {
            let clrConverter = Color(code);
            normalizedPredefinedColors[name] = clrConverter.rgb().array();
        }
        const colorFinder = new NearestColor(normalizedPredefinedColors);

        let clrConverter = Color(filament.color.code);
        let nearest = colorFinder.findNearest(clrConverter.rgb().array());
        if (nearest !== false) {
            filament.masterColorCode = predefinedColors[nearest]
        }

        filament._version = localVersion;
    };

    return this;
};