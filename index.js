var express = require("express");
var cors = require('cors');
var config = require('./common/config');
var register_apis = require('./manager/api_manager');
const formidableMiddleware = require('express-formidable');
var sync_blocks = require('./block_sync_service');

var app = express();
app.use(cors());
app.use(formidableMiddleware());

register_apis(app);

app.listen(config.port_number, () => {
    console.log('Server running on port: ' + config.port_number);
});

//sync_blocks();