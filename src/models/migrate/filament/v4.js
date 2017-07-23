'use strict';

module.exports = function(filament, currentVersion) {
    const localVersion = 4;

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

        filament.finished = false;
        filament.finishedDate = null;

        filament._version = localVersion;
    }

    return this;
};