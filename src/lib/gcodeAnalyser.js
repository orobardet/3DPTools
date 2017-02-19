module.exports = function (app) {
    var GCodeInterpreter = require('gcode-interpreter').GCodeInterpreter;

    var handlers = {
        'G0': function(params) {
            //console.log('G0', params);
        },
        'G1': function(params) {
            //console.log('G1', params);
        },
        'G2': function(params) {
            //console.log('G2', params);
        },
        'G17': function(params) {
            //console.log('G17');
        },
        'G20': function(params) {
            //console.log('G20');
        },
        'G90': function(params) {
            //console.log('G90');
        },
        'G94': function(params) {
            //console.log('G94');
        },
        'G54': function(params) {
            //console.log('G54');
        }
    };

    this.commandCounts = {};

    this.analyze = function(file) {
        var gcodeInterpreted = new GCodeInterpreter({ handlers: handlers });
        var that = this;

        gcodeInterpreted.loadFromFile(file, function(err, data) {
            if (err) {
                throw(err);
            }
        })
        .on('data', function(data) {
            if (data.line.match(/^;LAYER:(\d+)\s*$/)) {
                console.log(data.line);
            }
            if (data.words && data.words.length) {
                var cmd = data.words[0][0] + data.words[0][1];
                if (that.commandCounts[cmd]) {
                    that.commandCounts[cmd]++;
                } else {
                    that.commandCounts[cmd] = 1;
                }
            }
            // 'data' event listener
        })
        .on('end', function(results) {
            console.log(that.commandCounts);
            // 'end' event listener
        });
    };

    return this;
};