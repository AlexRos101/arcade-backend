const express = require('express');
const cors = require('cors');
const formidableMiddleware = require('express-formidable');
const mysql = require('mysql2/promise');
const config = require('./common/config');
const registerAPIs = require('./manager/api_manager');
const syncBlocks = require('./block_sync_service');
const database = require('./common/database');

global.mysqlPool = mysql.createPool(database);

const app = express();
app.use(cors());
app.use(formidableMiddleware());

registerAPIs(app);

app.listen(config.portNumber, () => {
    console.log(`Server running on port: ${config.portNumber}`);
});

syncBlocks();
