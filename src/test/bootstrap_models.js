'use strict';

const helper = require('./helper.js');

before(async () => {
    await helper.connectDB();
    await helper.clearDB();
});

after(async () => {
    await helper.clearDB();
    await helper.disconnectDB();
});