const mysql = require("mysql2/promise");
var mysql_config = require("../common/database");
var CONST = require("../common/constants");

async function connect() {
    const connection = await mysql.createConnection(mysql_config);
    return connection;
}

async function start_transaction(connection) {
    var query = "START TRANSACTION";
    await connection.query(query);
}

async function commit_transaction(connection) {
    var query = "COMMIT";
    await connection.query(query);
}

async function rollback_transaction(connection) {
    var query = "ROLLBACK";
    await connection.query(query);
}

async function get_stuff(stuff_id) {
    var connection = await connect();

    var [rows, fields] = [null, null];

    if (stuff_id == null || stuff_id == '') {
        var query = "SELECT * from tbl_stuff";
        [rows, fields] = await connection.execute(query);

        connection.end();
        return rows;
    } else  {
        var query = "SELECT * from tbl_stuff WHERE id LIKE ?";
        [rows, fields] = await connection.execute(query, [stuff_id]);

        connection.end();
        if (rows.length == 0)
            return null;

        return rows[0];
    }
}

async function get_discussion(stuff_id, limit, cnt) {
    var connection = await connect();

    var [rows, fields] = [null, null];

    if (stuff_id == null || stuff_id == '') {
        var query = "SELECT * from tbl_discussion ORDER BY tbl_discussion.likes DESC LIMIT ?, ?";
        [rows, fields] = await connection.execute(query, [limit, cnt]);
    } else {
        var query = "SELECT * from tbl_discussion WHERE stuff_id LIKE ? ORDER BY tbl_discussion.likes DESC LIMIT ?, ?";
        [rows, fields] = await connection.execute(query, [stuff_id, limit, cnt]);
    }
    
    connection.end();
    return rows;
}

async function get_discussion_by_id(id) {
    var connection = await connect();

    var query = "SELECT * from tbl_discussion WHERE id LIKE ?";
    var [rows, fields] = await connection.execute(query, [id]);
    
    connection.end();
    if (rows.length == 0)
        return null;

    return rows[0];
}

async function get_comment(discussion_id) {
    var connection = await connect();

    var [rows, fields] = [null, null];

    if (discussion_id == null || discussion_id == '') {
        var query = "SELECT * from tbl_comment";
        [rows, fields] = await connection.execute(query);
    } else {
        var query = "SELECT * from tbl_comment WHERE discussion_id LIKE ?";
        [rows, fields] = await connection.execute(query, [discussion_id]);
    }
    
    connection.end();
    return rows;
}

async function add_discussion(stuff_id, content, user_type, user) {
    var connection = await connect();
    var ret = false;

    try {
        await start_transaction(connection);

        var query = "INSERT INTO tbl_discussion (stuff_id, content, user, user_type) VALUE (?,?,?,?)";
        let [rows, fields] = await connection.execute(query, [stuff_id, content, user, user_type]);

        await commit_transaction(connection);
        ret = rows.insertId > 0;
    } catch (err) {
        console.log(err);
        await rollback_transaction(connection);
    }

    connection.end();
    return ret;
}

async function add_comment(discussion_id, parent_id, content, user_type, user) {
    var connection = await connect();
    var ret = false;

    try {
        await start_transaction(connection);

        var query = "INSERT INTO tbl_comment (discussion_id, parent_id, content, user, user_type) VALUE (?,?,?,?,?)";
        let [rows, fields] = await connection.execute(query, [discussion_id, parent_id, content, user, user_type]);

        await commit_transaction(connection);
        ret = rows.insertId > 0;
    } catch (err) {
        console.log(err);
        await rollback_transaction(connection);
    }

    connection.end();
    return ret;
}



module.exports = {
    get_stuff,
    get_discussion,
    get_comment,
    get_discussion_by_id,
    add_discussion,
    add_comment
}