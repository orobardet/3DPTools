var app = require('../../app')({
    loadConfig:true,
    initSession: false,
    initDb: false,
    initI18n: false,
    initViews: false,
    initLogger: false,
    loadComponents: false,
    loadNavigation: false,
    setupHttpRouting: false
});

var when = require('when');
var colors = require('colors');
var dataDirectory = '../data/test_gcode';
var GCodeAnalyzer = require('../../lib/gcodeAnalyzer');
var Format = require('../../lib/format');

app.program = require('commander');

app.program
    .command('test')
    .arguments('<testName>')
    .action(function (testName) {
        var testsSuite = require('../../'+dataDirectory + '/test_data.json');

        if (!testsSuite[testName]) {
            console.error(colors.red('*** No test "'+testName+'" found.'));
            return;
        }

        var testData = testsSuite[testName];

        var gcode = new GCodeAnalyzer(dataDirectory+'/'+testData.gcode);
        when(gcode.analyze())
            .then(function () {
                // Layers
                var layersCount = gcode.getLayersCount();
                if (layersCount === parseInt(testData.layersCount)) {
                    console.log(layersCount + ' layers: ' + colors.green("OK"));
                } else {
                    console.log(layersCount + ' layers: ' + colors.red("KO") + ', ' + testData.layersCount + ' expected');
                }
                console.log("Z resolution: " + (gcode.getMeanLayerHeight()*1000) +  "µm");

                // Filament length
                var filamentLength = Math.round(gcode.getFilamentLength());
                if (filamentLength === parseInt(testData.filamentLength)) {
                    console.log(filamentLength + 'mm (' + Format.distance(filamentLength) + ') of filament: ' + colors.green("OK"));
                } else {
                    console.log(filamentLength + 'mm (' + Format.distance(filamentLength) + ') of filament: ' + colors.red("KO") + ', ' + testData.filamentLength + ' mm expected');
                }

                // PrintingTime
                var printingTime = Math.round(gcode.getWorkDuration());
                if (printingTime === parseInt(testData.printingTime)) {
                    console.log(printingTime + 's (' + Format.duration(printingTime) + ') of printing time: ' + colors.green("OK"));
                } else {
                    console.log(printingTime + 's (' + Format.duration(printingTime) + ') of printing time: ' + colors.red("KO") + ', ' + testData.printingTime + ' s expected');
                }

                var traveledDistance = Math.round(gcode.getTraveledDistance());
                console.log("Distance traveled: " + traveledDistance + 'mm (' + Format.distance(traveledDistance) + ') ');

                // Lines count
                var linesCount = gcode.getLinesCount();
                if (linesCount === parseInt(testData.linesCount)) {
                    console.log(linesCount + ' lines: ' + colors.green("OK"));
                } else {
                    console.log(linesCount + ' lines: ' + colors.red("KO") + ', ' + testData.linesCount + ' expected');
                }

                // Retractation
                console.log(gcode.getRetractsCount() + " retractations");

                // List unknown commands, if any
                var unkownCommands = gcode.getUnknownCommands();
                if (unkownCommands && Object.keys(unkownCommands).length) {
                    console.log(Object.keys(unkownCommands).length + ' unknow GCode commands found in the file :\n', unkownCommands);
                }

            });
    });

app.program.parse(process.argv);

if (!app.program.args.length) {
    app.program.help();
}
