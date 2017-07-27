'use strict';

const helper = require('./helper.js');

before(done => {
    helper.connectDB();
    helper.clearDB();
    done();
});

after(done => {
    helper.clearDB();
    helper.disconnectDB();
    done();
});