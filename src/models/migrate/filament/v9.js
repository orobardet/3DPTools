'use strict';

module.exports = function(filament, currentVersion, app) {
    const localVersion = 9;

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

        filament.computeLeftMaterialFields();

        filament._version = localVersion;
    };

    return this;
};