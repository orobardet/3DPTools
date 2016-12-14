module.exports = function(filament, currentVersion) {
    var localVersion = 5;

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

        if (filament.initialMaterialWeight) {
            filament.pricePerKg = filament.price / filament.initialMaterialWeight;
        }

        filament._version = localVersion;
    }

    return this;
};