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

async function add_token(connection, item) {
    var ret = 0;

    try {
        var query = "INSERT INTO tbl_item (game_id, category_id, contract_address, token_id, name, description, attach_url, owner, is_anonymous, arcadedoge_price) VALUE(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        var [rows, fields] = await connection.execute(query, [item.game_id, item.category_id, item.contract_address, item.token_id, item.name, item.description, item.attach_url, item.owner, item.is_anonymous, item.arcadedoge_price]);
        ret = rows.insertId;
    } catch (err) {
        console.log(err);
    }
    return ret;
}

async function add_mint_tx(connection, id, item) {
    var ret = false;

    try {
        var query = "INSERT INTO tbl_history (token_id, from_address, to_address, type) VALUE(?, ?, ?, ?)";
        var [rows, fields] = await connection.execute(query, [id, item.owner, item.owner, CONST.TX_TYPE.MINT]);
        ret = rows.insertId > 0;
    } catch (err) {
        console.log(err);
    }

    return ret;
}

async function update_sync_block_number(connection, contract_type, block_number) {
    var ret = false;

    try {
        var query = "UPDATE tbl_status SET block_number = ? WHERE contract_type = ?";
        let [rows, fields] = await connection.execute(query, [block_number, contract_type]);
        ret = rows.affectedRows > 0;
    } catch (err) {
        console.log(err);
    }

    return ret;
}

async function mint_token(item, block_number) {
    var connection = await connect();
    var ret = false;

    try {
        await start_transaction(connection);

        var token_id = await add_token(connection, item);
        if (token_id == 0) throw new Error('Adding token failed.');

        if (!(await add_mint_tx(connection, token_id, item))) throw new Error('Adding mint tx failed.');

        if (!(await update_sync_block_number(connection, CONST.CONTRACT_TYPE.NFT, block_number))) throw new Error('Updating sync block number failed.');

        await commit_transaction(connection);

        ret = true;
    } catch (err) {
        console.log(err);
        await rollback_transaction(connection);
    }

    connection.end();
    return ret;
}

async function get_sync_block_number(contract_type) {
    var connection = await connect();
    var ret = -1;

    try {
        var query = "SELECT block_number FROM tbl_status WHERE contract_type = ?";
        let [rows, fields] = await connection.execute(query, [contract_type]);
        ret = rows[0].block_number;
    } catch (err) {
        console.log(err);
    }

    connection.end();

    return ret;
}

async function get_token_by_id(id) {
    var connection = await connect();
    var ret = null;

    try {
        var query = "SELECT * from tbl_item WHERE id = ?";
        let [rows, fields] = await connection.execute(query, [id]);
        if (rows.length > 0) ret = rows[0];
    } catch (err) {
        console.log(err);
    }

    connection.end();
    return ret;
}

async function get_token_by_contract_info(contract_address, token_id) {
    var connection = await connect();
    var ret = null;

    try {
        var query = "SELECT * from tbl_item WHERE contract_address = ? AND token_id = ?";
        let [rows, fields] = await connection.execute(query, [contract_address, token_id]);
        if (rows.length > 0) ret = rows[0];
    } catch (err) {
        console.log(err);
    }

    connection.end();
    return ret;
}

async function delete_token(connection, id) {
    var ret = false;

    try {
        var query = "UPDATE tbl_item SET is_burnt = ? WHERE id = ?";
        let [rows, fields] = await connection.execute(query, [CONST.BURN_STATUS.BURNT, id]);
        ret = rows.affectedRows > 0;
    } catch (err) {
        console.log(err);
    }

    return ret;
}

async function add_burn_tx(connection, item) {
    var ret = false;

    try {
        var query = "INSERT INTO tbl_history (token_id, from_address, to_address, type) VALUE (?, ?, ?, ?)";
        let [rows, fields] = await connection.execute(query, [item.id, item.owner, item.owner, CONST.TX_TYPE.BUNRT]);
        ret = rows.insertId > 0;
    } catch (err) {
        console.log(err);
    }

    return ret;
}

async function bunr_token(contract_address, token_id, block_number) {
    var connection = await connect();
    var ret = false;

    try {
        await start_transaction(connection);
        
        var token = await get_token_by_contract_info(contract_address, token_id);
        if (token == null) throw new Error('Not exist token.');

        if (!(await delete_token(connection, token.id))) throw new Error('Deleting token failed.');

        if (!(await add_burn_tx(connection, token))) throw new Error('Adding burn tx failed.');

        if (!(await update_sync_block_number(connection, CONST.CONTRACT_TYPE.NFT, block_number))) throw new Error('Updating sync block number failed.');
        
        await commit_transaction(connection);
        ret = true;
    } catch (err) {
        console.log(err);
        await rollback_transaction(connection);
    }

    connection.end();
    return ret;
}

async function update_token_visible(connection, id, visible, arcadedoge_price = 0) {
    var ret = false;

    try {
        if (visible == CONST.VISIBILITY_STATUS.SHOW) {
            var query = "UPDATE tbl_item SET is_visible = ?, arcadedoge_price = ? WHERE id = ?";
            let [rows, fields] = await connection.execute(query, [visible, arcadedoge_price, id]);
            ret = rows.affectedRows > 0;
        } else if (visible == CONST.VISIBILITY_STATUS.HIDDEN) {
            var query = "UPDATE tbl_item SET is_visible = ? WHERE id = ?";
            let [rows, fields] = await connection.execute(query, [visible, id]);
            ret = rows.affectedRows > 0;
        }
    } catch (err) {
        console.log(err);
    }

    return ret;
}

async function sell_token(contract_address, token_id, arcadedoge_price, block_number) {
    var connection = await connect();
    var ret = false;

    try {
        await start_transaction(connection);

        var token = await get_token_by_contract_info(contract_address, token_id);
        if (token == null) throw new Error('Not exist token.');

        if (!(await update_token_visible(connection, token.id, CONST.VISIBILITY_STATUS.SHOW, arcadedoge_price))) throw new Error('Setting visible failed.');

        if (!(await update_sync_block_number(connection, CONST.CONTRACT_TYPE.EXCHANGE, block_number))) throw new Error('Updating sync block failed.');

        await commit_transaction(connection);
        ret = true;
    } catch (err) {
        console.log(err);
        await rollback_transaction(connection);
    }

    connection.end();
    return ret;
}

async function cancel_sell_token(contract_address, token_id, block_number) {
    var connection = await connect();
    var ret = false;

    try {
        await start_transaction(connection);

        var token = await get_token_by_contract_info(contract_address, token_id);
        if (token == null) throw new Error('Not exist token.');

        if (!(await update_token_visible(connection, token.id, CONST.VISIBILITY_STATUS.HIDDEN))) throw new Error('Setting visible failed.');

        if (!(await update_sync_block_number(connection, CONST.CONTRACT_TYPE.EXCHANGE, block_number))) throw new Error('Updating sync block failed.');

        await commit_transaction(connection);
        ret = true;
    } catch (err) {
        console.log(err);
        await rollback_transaction(connection);
    }

    connection.end();
    return ret;
}

async function update_token_owner(connection, id, owner) {
    var ret = false;

    try {
        var query = "UPDATE tbl_item SET owner = ?, is_visible = false WHERE id = ?";
        let [rows, fields] = await connection.execute(query, [owner, id]);
        ret = rows.affectedRows > 0;
    } catch (err) {
        console.log(err);
    }

    return ret;
}

async function add_exchange_tx(connection, id, from, to, asset_id, amount) {
    var ret = false;

    try {
        var query = "INSERT INTO tbl_history (token_id, from_address, to_address, asset_id, amount, type) VALUE(?, ?, ?, ?, ?, ?)";
        let [rows, fields] = await connection.execute(query, [id, from, to, asset_id, amount, CONST.TX_TYPE.EXCHANGE]);
        ret = rows.insertId > 0;
    } catch (err) {
        console.log(err);
    }

    return ret;
}

async function add_transfer_tx(connection, id, from, to) {
    var ret = false;

    try {
        var query = "INSERT INTO tbl_history (token_id, from_address, to_address, type) VALUE(?, ?, ?, ?)";
        let [rows, fields] = await connection.execute(query, [id, from, to, CONST.TX_TYPE.EXCHANGE]);
        ret = rows.insertId > 0;
    } catch (err) {
        console.log(err);
    }

    return ret;
}

async function increase_trade_cnt(connection, id) {
    var ret = false;

    try {
        var query = "UPDATE tbl_item SET trade_cnt = trade_cnt + 1 WHERE id = ?";
        let [rows, fields] = await connection.execute(query, [id]);
        ret = rows.affectedRows > 0;
    } catch (err) {
        console.log(err);
    }

    return ret;
}

async function exchange_token(contract_address, token_id, owner, asset_id, amount, buyer, block_number) {
    var connection = await connect();
    var ret = false;

    try {
        await start_transaction(connection);

        var token = await get_token_by_contract_info(contract_address, token_id);
        if (token == null) throw new Error('Not exist token.');

        if (!(await update_token_owner(connection, token.id, buyer))) throw new Error('Updating token owner failed.');

        if (!(await add_exchange_tx(connection, token.id, owner, buyer, asset_id, amount))) throw new Error('Adding exchange tx failed.');
        
        if (!(await increase_trade_cnt(connection, token.id))) throw new Error('Increasing trade cnt failed.');

        if (!(await update_sync_block_number(connection, CONST.CONTRACT_TYPE.EXCHANGE, block_number))) throw new Error('Updating sync block number failed.');
        await commit_transaction(connection);
        ret = true;
    } catch (err) {
        console.log(err);
        await rollback_transaction(connection);
    }

    connection.end();
    return ret;
}

async function transfer_token(contract_address, token_id, from, to, block_number) {
    var connection = await connect();
    var ret = false;

    try {
        await start_transaction(connection);

        var token = await get_token_by_contract_info(contract_address, token_id);
        if (token == null) throw new Error('Not exist token.');

        if (!(await update_token_owner(connection, token.id, to))) throw new Error('Updating token owner failed.');

        if (!(await add_transfer_tx(connection, token.id, from, to))) throw new Error('Adding transfer tx failed.');

        if (!(await update_sync_block_number(connection, CONST.CONTRACT_TYPE.NFT, block_number))) throw new Error('Updating sync block number failed.');
        
        await commit_transaction(connection);
        ret = true;
    } catch (err) {
        console.log(err);
        await rollback_transaction(connection);
    }

    connection.end();
    return ret;
}

async function update_other_sync_block_number(contract_type, block_number) {
    var connection = await connect();
    var ret = false;

    try {
        await start_transaction(connection);

        ret = await update_sync_block_number(connection, contract_type, block_number);

        await commit_transaction(connection);
    } catch (err) {
        console.log(err);
        await rollback_transaction(connection);
    }

    connection.end();
    return ret;
}

async function get_games() {
    var connection = await connect();
    var query = "SELECT * FROM tbl_game";
    let [rows, fields] = await connection.execute(query);
    connection.end();
    return rows;
}

async function get_categories() {
    var connection = await connect();
    var query = "SELECT * from tbl_category";
    let [rows, fields] = await connection.execute(query);
    connection.end();
    return rows;
}

async function get_items_by_address(address, sort_type, limit, cnt) {
    var connection = await connect();
    var query = "SELECT tbl_item.*, tbl_category.name as category_name from tbl_item LEFT JOIN tbl_category ON tbl_item.category_id = tbl_category.id WHERE is_burnt = 0 AND owner = ? " + get_order_by_clause(sort_type) + " LIMIT ?, ?";
    let [rows, fields] = await connection.execute(query, [address, limit, cnt]);
    connection.end();
    return rows;
}

async function get_items_by_address_cnt(address) {
    var connection = await connect();
    var query = "SELECT COUNT(id) as total from tbl_item WHERE is_burnt = 0 AND owner = ?";
    let [rows, fields] = await connection.execute(query, [address]);
    connection.end();
    return rows[0].total;
}

async function get_market_items(game, category, sort_type, limit, cnt) {
    var connection = await connect();

    var query = "SELECT tbl_item.*, tbl_category.name as category_name from tbl_item LEFT JOIN tbl_category ON tbl_item.category_id = tbl_category.id WHERE is_visible = ? AND is_burnt = 0";
    var params = [CONST.VISIBILITY_STATUS.SHOW];

    if (game != 0) {
        query += " AND tbl_item.game_id = ?";
        params.push(game);
    }

    if (category != 0) {
        query += " AND category_id = ?";
        params.push(category);
    }

    query += " " + get_order_by_clause(sort_type) + " LIMIT ?, ?";
    params.push(limit);
    params.push(cnt);
    let [rows, fields] = await connection.execute(query, params);
    connection.end();
    return rows;
}



function get_order_by_clause(sort_type) {
    switch(sort_type) {
        case CONST.SORT_TYPE.PRICE_HIGH_LOW:
            return "ORDER BY arcadedoge_price DESC";
        case CONST.SORT_TYPE.PRICE_LOW_HIGH:
            return "ORDER BY arcadedoge_price ASC";
        case CONST.SORT_TYPE.POPULAR:
            return "ORDER BY trade_cnt DESC";
        case CONST.SORT_TYPE.RECENT:
        default:
            return "ORDER BY updated_at DESC";
    }
}

module.exports = {
    get_stuff,
    get_discussion,
    get_comment,
    get_discussion_by_id,
    add_discussion,
    add_comment,
    mint_token,
    get_sync_block_number,
    get_token_by_id,
    get_token_by_contract_info,
    bunr_token,
    sell_token,
    cancel_sell_token,
    exchange_token,
    transfer_token,
    get_games,
    get_categories,
    get_items_by_address,
    get_items_by_address_cnt,
    get_market_items,
    update_other_sync_block_number
}