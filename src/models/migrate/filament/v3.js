module.exports = function(filament, currentVersion) {
    var localVersion = 3;

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

        filament.lastUsedDate = filament.modificationDate;

        filament._version = localVersion;
    }

    return this;
};