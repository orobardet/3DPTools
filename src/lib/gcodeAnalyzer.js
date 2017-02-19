module.exports = function (file, options) {
    var GCodeInterpreter = require('gcode-interpreter').GCodeInterpreter;

    this.options = options || {};
    this.gcodeFilePath = file;

    this.commandCounts = {};
    this.layersCount = 0;
    this.linesCount = 0;

    this.currentTool = 0;
    this.position = { x : 0, y : 0, z: 0};
    this.toolsPosition = [0];
    this.isRelative = false;

    this.filamentLength = 0;

    this.selectTool = function(tool) {
        if (typeof this.toolsPosition[tool] === 'undefined') {
            this.toolsPosition[tool] = 0;
        }

        this.currentTool = tool;
    };

    this.setRelative = function(isRelative) {
        this.isRelative = isRelative;
    };

    this.movePosition = function (params) {
        if (this.isRelative) {

        } else {
            if (params.X) {
            }
            if (params.E) {
                if (params.X || params.Y || params.Z) {
                    this.filamentLength += params.E - this.toolsPosition[this.currentTool];
                }
                this.toolsPosition[this.currentTool] = params.E;
            }
        }
    }

    var that = this;
    var handlers = {
        /* G0 : Rapid linear Move
         * All coordinates from now on are absolute relative to the origin of the machine. (This is the RepRap default.)
         *
         * Parameters:
         *  - Xnnn The position to move to on the X axis
         *  - Ynnn The position to move to on the Y axis
         *  - Znnn Znnn The position to move to on the Z axis
         *  - Ennn The amount to extrude between the starting point and ending point
         *  - Fnnn The feedrate per minute of the move between the starting point and ending point (if supplied)
         *  - Snnn Flag to check if an endstop was hit (S1 to check, S0 to ignore, S2 see note, default is S0)
         * This command can be used without any additional parameters.
         */
        'G0': function(params) {
            that.movePosition(params);
        },

        /* G1 : Linear Move
         * All coordinates from now on are absolute relative to the origin of the machine. (This is the RepRap default.)
         *
         * Parameters:
         *  - Xnnn The position to move to on the X axis
         *  - Ynnn The position to move to on the Y axis
         *  - Znnn Znnn The position to move to on the Z axis
         *  - Ennn The amount to extrude between the starting point and ending point
         *  - Fnnn The feedrate per minute of the move between the starting point and ending point (if supplied)
         *  - Snnn Flag to check if an endstop was hit (S1 to check, S0 to ignore, S2 see note, default is S0)
         * This command can be used without any additional parameters.
         */
        'G1': function(params) {
            that.movePosition(params);
        },

        /* G28: Move to Origin (Home)
         * All coordinates from now on are absolute relative to the origin of the machine. (This is the RepRap default.)
         *
         * Parameters:
         *  - X Flag to go back to the X axis origin
         *  - Y Flag to go back to the Y axis origin
         *  - Z Flag to go back to the Z axis origin
         * This command can be used without any additional parameters.
         */
        'G28': function(params) {
            if (!Object.keys(params).length) {
                that.position = { x : 0, y : 0, y : 0};
                return;
            }

            if (params.X) {
                that.position.X = params.X;
            }
            if (params.Y) {
                that.position.Y = params.Y;
            }
            if (params.Z) {
                that.position.Z = params.Z;
            }
        },

        /* G90: Set to Absolute Positioning
         * All coordinates from now on are absolute relative to the origin of the machine. (This is the RepRap default.)
         * No parameters
         */
        'G90': function(params) {
            that.setRelative(false);
        },

        /* G91: Set to Relative Positioning
         * All coordinates from now on are relative to the last position.
         * No parameters
         */
        'G91': function(params) {
            that.setRelative(true);
        },

        /* G92: Set Position
         * All coordinates from now on are relative to the last position.
         *
         * Parameters:
         *  - Xnnn new X axis position
         *  - Ynnn new Y axis position
         *  - Znnn new Z axis position
         *  - Ennn new extruder position
         * Not all parameters need to be used, but at least *one* has to be used
         */
        'G92': function(params) {
            if (!Object.keys(params).length) {
                that.position = { x : 0, y : 0, y : 0};
                that.toolsPosition[that.currentTool] = 0;
                return;
            }

            if (params.X) {
                that.position.X = params.X;
            }
            if (params.Y) {
                that.position.Y = params.Y;
            }
            if (params.Z) {
                that.position.Z = params.Z;
            }
            if (params.E) {
                that.toolsPosition[that.currentTool] = params.E;
            }
        },

        /* T0: Select tool #0
         * No parameters
         */
        'T0': function(params) {
            that.selectTool(0);
        },

        /* T1: Select tool #1
         * No parameters
         */
        'T1': function(params) {
            that.selectTool(1);
        }
    };

    this.analyze = function(callback) {
        var that = this;
        var gcodeInterpreter = new GCodeInterpreter({ handlers: handlers });

        return new Promise(function(resolve, reject){
            gcodeInterpreter.loadFromFile(that.gcodeFilePath, function(err, data) {
                if (err) {
                    reject(err);
                }
                resolve(this);
            }).on('data', function(data) {
                    // Count layers
                    if (data.line.match(/^;LAYER:(\d+)\s*$/)) {
                        that.layersCount++;
                    }

                    // Count GCode command occurences
                    if (data.words && data.words.length) {
                        var cmd = data.words[0][0] + data.words[0][1];
                        if (that.commandCounts[cmd]) {
                            that.commandCounts[cmd]++;
                        } else {
                            that.commandCounts[cmd] = 1;
                        }
                    }
                })
                .on('end', function(results) {
                    resolve(this);
                });
        });
    };

    this.getUnknownCommands = function() {
        var unknownCmds = {};

        var knownCmds = Object.keys(handlers);

        var that = this;
        Object.keys(this.commandCounts).sort().forEach(function(cmd) {
            if (knownCmds.indexOf(cmd) === -1) {
                unknownCmds[cmd] = that.commandCounts[cmd];
            }
        });

        return unknownCmds;
    };

    this.getCommandsCount = function() {
        return this.commandCounts;
    };

    this.getLayersCount = function() {
        return this.layersCount;
    };

    this.getLinesCount = function() {
        return this.linesCount;
    };

    this.getFilamentLength = function() {
        return this.filamentLength;
    };

    return this;
};