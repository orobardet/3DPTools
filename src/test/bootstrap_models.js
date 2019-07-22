'use strict';

const helper = require('./helper.js');

before(async function() {
    this.timeout(5000);
    await helper.connectDB();
    return await helper.clearDB();
});

after(async function() {
    this.timeout(5000);
    await helper.clearDB();
    return await helper.disconnectDB();
});