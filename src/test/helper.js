'use strict';

let mongoose = require('mongoose');

process.env.NODE_ENV = 'test';

module.exports = {
    mongoose:  null,

    connectDB: async function (done) {
        mongoose.Promise = global.Promise;
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGO_URL, {
                useMongoClient: true,
                promiseLibrary: global.Promise
            });
        }
    },

    disconnectDB: function(done) {
        mongoose.disconnect();

        if (done) done();
    },

    clearDB: function (done) {
        for (let i in mongoose.connection.collections) {
            mongoose.connection.collections[i].remove(function () {
            });
        }
        if (done) done();
    }
}
