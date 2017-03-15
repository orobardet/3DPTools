var Point = function(point) {
    this.x = 0;
    this.y = 0;
    this.z = 0;

    if (point) {
        if (point.x) { this.x = point.x; }
        if (point.y) { this.y = point.y; }
        if (point.z) { this.z = point.z; }
    }

    this.copy = function(point) {
        if (point instanceof Point) {
            this.x = point.x;
            this.y = point.y;
            this.z = point.z;
        }
    };

    this.equals = function(point) {
        if (point instanceof Point && this.x === point.x && this.y === point.y && this.z === point.z) {
            return true;
        }
        return false;
    };
};

var Tool = function() {
    this.extrudeurPosition = 0;
    this.currentRetractation = 0;
    this.isRelative = false;
    this.filamentLength = 0;
    this.temperatureOrder = 0;
};

var Bed = function() {
    this.temperatureOrder = 0;
};

var Fan = function() {
    this.speed = 0;
}

module.exports = function (file, options) {
    var extend = require('util')._extend;
    var GCodeInterpreter = require('gcode-interpreter').GCodeInterpreter;

    this.options = options || {};
    this.gcodeFilePath = file;

    // Counters
    this.commandsCounts = {};
    this.retractsCount = 0;
    this.lines = [];

    // Layers stats
    this.layersCount = 0;
    this.layersHeight = [];
    this.previousLayerZ = 0;

    // Internal states
    this.currentTool = 0;
    this.position = new Point();
    this.tools = [new Tool()];
    this.isRelative = false;
    this.bed = new Bed();
    this.fans = [];

    this.analyze = function(callback) {
        var that = this;
        var gcodeInterpreter = new GCodeInterpreter({ handlers: this.gCodeHandlers });

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
                    if (that.commandsCounts[cmd]) {
                        that.commandsCounts[cmd]++;
                    } else {
                        that.commandsCounts[cmd] = 1;
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

        var knownCmds = Object.keys(this.gCodeHandlers);

        var that = this;
        Object.keys(this.commandsCounts).sort().forEach(function(cmd) {
            if (knownCmds.indexOf(cmd) === -1) {
                unknownCmds[cmd] = that.commandsCounts[cmd];
            }
        });

        return unknownCmds;
    };

    this.getCommandsCount = function() {
        return this.commandsCounts;
    };

    this.getLayersCount = function() {
        return this.layersCount;
    };

    this.getLayersHeight = function() {
        return this.layersHeight;
    };

    this.getMeanLayerHeight = function() {
        var height = 0;

        var layersCount = this.layersHeight.length;
        if (layersCount) {
            for (var i = 0; i < layersCount; i++) {
                height += this.layersHeight[i];
            }
            height /= layersCount;
        }

        return height;
    };

    this.getLinesCount = function() {
        return this.lines.length;
    };

    this.getFilamentLength = function() {
        var filamentLength = 0;

        var toolsCount = this.tools.length;
        if (toolsCount) {
            for (var i = 0; i < toolsCount ; i++) {
                filamentLength += this.tools[i].filamentLength;
            }
        }

        return filamentLength;
    };

    this.getRetractsCount = function() {
        return this.retractsCount;
    }

    //--------------------------------------------------

    this.declareNewTool = function(tool) {
        if (typeof this.tools[tool] === 'undefined') {
            this.tools[tool] = new Tool();
        }
    };

    this.declareNewFan = function(fan) {
        if (typeof this.fans[fan] === 'undefined') {
            this.fans[fan] = new Fan();
        }
    };

    this.selectTool = function(tool) {
        this.declareNewTool(tool);
        this.currentTool = tool;
    };

    this.setRelative = function(isRelative) {
        this.isRelative = isRelative;
    };

    this.doMove = function(startPoint, endPoint) {
        this.position = endPoint;
    };

    this.doLine = function(startPoint, endPoint, extruderMove) {
        if (extruderMove) {
            this.tools[this.currentTool].extrudeurPosition += extruderMove;
            if (!startPoint.equals(endPoint)) {
                if (extruderMove > 0) {
                    // Extrude including previous retractation distancess
                    this.tools[this.currentTool].filamentLength += extruderMove + this.tools[this.currentTool].currentRetractation;
                    this.tools[this.currentTool].currentRetractation = 0;
                } else {
                    // Reserve retractaction distances for the next extrusion move
                    this.tools[this.currentTool].currentRetractation += extruderMove;
                }

                this.lines.push([startPoint, endPoint]);
            }

            if (extruderMove < 0) {
                this.retractsCount++;
            }
        }
        this.doMove(startPoint, endPoint);
    };

    // TODO : calcul temps de déplacement
    this.linearMove = function(params) {
        var newPosition = new Point(this.position);
        var extruderMove = 0;

        if (this.isRelative) {
            if (typeof params.X !== 'undefined') {
                newPosition.x -= params.X;
            }
            if (typeof params.Y !== 'undefined') {
                newPosition.y -= params.Y;
            }
            if (typeof params.Z !== 'undefined') {
                newPosition.z -= params.Z;
            }
            if (typeof params.E !== 'undefined') {
                extruderMove = params.E;
            }
        } else {
            //  Absolute move
            if (typeof params.X !== 'undefined') {
                newPosition.x = params.X;
            }
            if (typeof params.Y !== 'undefined') {
                newPosition.y = params.Y;
            }
            if (typeof params.Z !== 'undefined') {
                newPosition.z = params.Z;
            }
            if (typeof params.E !== 'undefined') {
                extruderMove = params.E - this.tools[this.currentTool].extrudeurPosition;
            }
        }

        // Detect layer height
        if (typeof params.Z !== 'undefined' && typeof this.layersHeight[this.layersCount - 1] === 'undefined') {
            var zOffset = newPosition.z - this.previousLayerZ;
            if (zOffset < 1 && zOffset > 0) {
                this.layersHeight[this.layersCount - 1] = zOffset;
                this.previousLayerZ = newPosition.z;
            }
        }

        // Do a line or just a move? A line if the extruder is at work
        if (typeof params.E !== 'undefined') {
            this.doLine(this.position, newPosition, extruderMove);
        } else {
            this.doMove(this.position, newPosition);
        }
    };

    //--------------------------------------------------
    var that = this;
    this.gCodeHandlers = {
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
            that.linearMove(params);
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
            that.linearMove(params);
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
                that.position = new Point();
                return;
            }

            if (typeof params.X !== 'undefined') {
                that.position.x = params.X;
            }
            if (typeof params.Y !== 'undefined') {
                that.position.y = params.Y;
            }
            if (typeof params.Z !== 'undefined') {
                that.position.z = params.Z;
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
                that.position = new Point();
                that.tools[that.currentTool].extrudeurPosition = 0;
                return;
            }

            if (typeof params.X !== 'undefined') {
                that.position.x = params.X;
            }
            if (typeof params.Y !== 'undefined') {
                that.position.y = params.Y;
            }
            if (typeof params.Z !== 'undefined') {
                that.position.z = params.Z;
            }
            if (typeof params.E !== 'undefined') {
                that.tools[that.currentTool].extrudeurPosition = params.E;
            }
        },

        /* M82: Set extruder to absolute mode
         * Makes the extruder interpret extrusion as absolute positions.
         */
        'M82': function(params) {
            var toolNumber = that.currentTool;

            if (typeof params.T !== 'undefined') {
                toolNumber = params.T;
                that.declareNewTool(toolNumber);
            }
            if (typeof params.S !== 'undefined') {
                that.tools[toolNumber].isRelative = false;
            }
        },

        /* M83: Set extruder to relative mode
         * Makes the extruder interpret extrusion as relative positions.
         */
        'M83': function(params) {
            var toolNumber = that.currentTool;

            if (typeof params.T !== 'undefined') {
                toolNumber = params.T;
                that.declareNewTool(toolNumber);
            }
            if (typeof params.S !== 'undefined') {
                that.tools[toolNumber].isRelative = true;
            }
        },

        /* M84: Stop idle hold
         * Makes the extruder interpret extrusion as relative positions.
         *
         * Parameters:
         *  - Snnn Stop idle and after this number of seconds restart it
         *  - Xnnn Disable only X axis motor (nnn has no importance)
         *  - Ynnn Disable only Y axis motor (nnn has no importance)
         *  - Znnn Disable only Z axis motor (nnn has no importance)
         */
        'M84': function(params) {
        },

        /* M104: Set Extruder Temperature
         * Set the temperature of the current extruder and return control to the host immediately.
         *
         * Parameters:
         *  - Tnnn The extruder tool (optional)
         *  - Snnn Target temperature
         */
        'M104': function(params) {
            var toolNumber = that.currentTool;

            if (typeof params.T !== 'undefined') {
                toolNumber = params.T;
                that.declareNewTool(toolNumber);
            }
            if (typeof params.S !== 'undefined') {
                that.tools[toolNumber].temperatureOrder = params.S;
            }
        },

        /* M106: Fan On
         * Set fan parameters.
         *
         * Parameters:
         *  - Pnnn Fan number (optional, defaults to 0)
         *  - Snnn Fan speed (0 to 255)
         */
        'M106': function(params) {
            var fanNumber = 0;

            if (typeof params.P !== 'undefined') {
                fanNumber = params.P;
            }
            that.declareNewFan(fanNumber);

            if (typeof params.S !== 'undefined') {
                that.fans[fanNumber].speed = params.S;
            }
        },

        /* M107: Fan Off
         * Stop all fans
         */
        'M107': function(params) {
            var fanCounts = that.fans.length;
            if (fanCounts) {
                for (var i ; i < fanCounts ; i++) {
                    that.fans[i].speed = 0;
                }
            }
        },

        /* M109: Set Extruder Temperature and Wait
         * Set the temperature of the current extruder and wait for it
         *
         * Parameters:
         *  - Tnnn The extruder tool (optional)
         *  - Snnn Target temperature
         */
        'M109': function(params) {
            var toolNumber = that.currentTool;

            if (typeof params.T !== 'undefined') {
                toolNumber = params.T;
                that.declareNewTool(toolNumber);
            }
            if (typeof params.S !== 'undefined') {
                that.tools[toolNumber].temperatureOrder = params.S;
            }
        },

        /* M140: Set Bed Temperature (Fast)
         * Set the temperature of the build bed and return control to the host immediately
         *
         * Parameters:
         *  - Snnn Target temperature
         */
        'M140': function(params) {
            if (typeof params.S !== 'undefined') {
                that.bed.temperatureOrder = params.S;
            }
        },

        /* M190: Set Bed Temperature and wait
         * Set the temperature of the build bed and wait for it
         *
         * Parameters:
         *  - Snnn Target temperature
         */
        'M190': function(params) {
            if (typeof params.S !== 'undefined') {
                that.bed.temperatureOrder = params.S;
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

    return this;
};