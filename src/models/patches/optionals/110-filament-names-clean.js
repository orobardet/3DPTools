'use strict';

module.exports = function() {
    return async function(app) {
        console.log("Removing name for filament where it match '<materialName> <colorName>'...");

        let filaments = await app.models.filament.find({name: { $not: /^[\w]*$/ }}).populate("material").exec();

        let cleanedFilaments = 0;
        for (let filament of filaments) {
            if (filament.name.toLowerCase() == filament.material.name.toLowerCase() + " " + filament.color.name.toLowerCase()) {
                console.log(`  Removing filament ${filament.id} name ${filament.name}`);
                filament.name = "";
                filament.setInMigration();
                await filament.save();
                cleanedFilaments++;
            }
        }
        console.log(`Done, ${cleanedFilaments} filaments with name removed.`);
    }
};