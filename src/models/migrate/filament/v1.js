module.exports = function(filament, currentVersion) {
    var localVersion = 1;

    this.needMigration = function() {
        if (!filament._version) {
            return true;
        }

        return false;
    };

    this.migrate = function() {
        if (!this.needMigration()) {
            return;
        }

        filament.creationDate = filament.buyDate;

        filament._version = localVersion;
    }

    return this;
};