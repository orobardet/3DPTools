'use strict';

module.exports = function(filament, currentVersion) {
    const localVersion = 6;

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

        if (filament.speedPercentage) {
            delete filament.speedPercentage;
        }

        filament._version = localVersion;
    }

    return this;
};