'use strict';

let mongoose = require('mongoose');
process.env.NODE_ENV = 'test';

beforeEach(done => {
    function clearDB() {
        for (let i in mongoose.connection.collections) {
           // mongoose.connection.collections[i].remove(function() {});
        }
        return done();
    }

    mongoose.Promise = global.Promise;
    if (mongoose.connection.readyState === 0) {
        mongoose.connect(process.env.MONGO_URL, {
            useMongoClient: true,
            promiseLibrary: global.Promise
        }).catch(err => {
            if (err) {
                throw err;
            }
            return clearDB();
        });
    } else {
        return clearDB();
    }
});

afterEach(done => {
    mongoose.disconnect();
    return done();
});