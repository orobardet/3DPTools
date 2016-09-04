module.exports = function(filament, currentVersion) {
    var localVersion = 2;

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

        filament.modificationDate = filament.creationDate;

        filament._version = localVersion;
    }

    return this;
};