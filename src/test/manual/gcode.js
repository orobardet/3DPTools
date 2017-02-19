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

var colors = require('colors');
var dataDirectory = '../data/test_gcode';

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
        console.log('Expected:');
        console.log(testData);

        var gcode = new require('../../lib/gcodeAnalyser')(app);
        gcode.analyze(dataDirectory+'/'+testData.gcode);
    });

app.program.parse(process.argv);

if (!app.program.args.length) {
    app.program.help();
}
