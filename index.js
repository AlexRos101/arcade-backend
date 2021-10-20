const express = require('express');
const cors = require('cors');
const formidableMiddleware = require('express-formidable');
const mysql = require('mysql2/promise');
const config = require('./common/config');
const register_apis = require('./manager/api_manager');
const sync_blocks = require('./block_sync_service');
const database = require('./common/database');

global.mysqlPool = mysql.createPool(database);

const app = express();
app.use(cors());
app.use(formidableMiddleware());

register_apis(app);

app.listen(config.port_number, () => {
    console.log(`Server running on port: ${config.port_number}`);
});

sync_blocks();
