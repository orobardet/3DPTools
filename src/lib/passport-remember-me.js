/**
 * Code from https://www.npmjs.com/package/passport-remember-me module, with small modification
 * to pass req object to verify and issue callback.
 */

/**
 * Module dependencies.
 */
var Strategy = require('./passport-remember-me/strategy');

/**
 * Module version.
 */
require('pkginfo')(module, 'version');

/**
 * Expose constructors.
 */
exports.Strategy = Strategy;