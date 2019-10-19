'use strict';

let mongoose = require('mongoose');

process.env.NODE_ENV = 'test';

module.exports = {
    mongoose:  null,

    connectDB: async function () {
        mongoose.Promise = global.Promise;
        if (mongoose.connection.readyState === 0) {
            return await mongoose.connect(process.env.MONGO_URL, {
                promiseLibrary: global.Promise,
                useNewUrlParser: true,
                useUnifiedTopology: true
            });
        }
    },

    disconnectDB: async function() {
        return await mongoose.disconnect();
    },

    clearDB: async function () {
        let collectionClearings = [];
        for (let i in mongoose.connection.collections) {
            collectionClearings.push(mongoose.connection.collections[i].deleteMany())
        }
        return await Promise.all(collectionClearings);
    }
};
