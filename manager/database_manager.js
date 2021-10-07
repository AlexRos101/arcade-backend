const CONST = require('../common/constants');

/* eslint-disable */
async function connect() {
    return new Promise((resolve, reject) => {
        mysqlPool
            .getConnection()
            .then((connection) => {
                resolve(connection);
            })
            .catch((err) => {
                console.log(err);
                reject(err);
            });
    });
}
/* eslint-enable */

async function start_transaction(connection) {
    let query = 'START TRANSACTION';
    await connection.query(query);
}

async function commit_transaction(connection) {
    let query = 'COMMIT';
    await connection.query(query);
}

async function rollback_transaction(connection) {
    let query = 'ROLLBACK';
    await connection.query(query);
}

async function on_connection_err(connection, err, is_roll_back = false) {
    console.log(err);
    if (connection == null) return;
    if (err.errono == CONST.MYSQL_ERR_NO.CONNECTION_ERROR) return;
    if (is_roll_back) await rollback_transaction(connection);
    connection.release();
}

async function get_stuff(stuff_id) {
    let connection = null;
    try {
        connection = await connect();

        let rows = null;

        if (stuff_id == null || stuff_id == '') {
            let query = 'SELECT * from tbl_stuff';
            [rows] = await mysql_execute(connection, query);

            connection.release();
            return rows;
        } else {
            let query = 'SELECT * from tbl_stuff WHERE id LIKE ?';
            [rows] = await mysql_execute(connection, query, [stuff_id]);

            connection.release();
            if (rows.length == 0) return null;

            return rows[0];
        }
    } catch (err) {
        on_connection_err(connection, err);
    }

    return null;
}

async function get_discussion_cnt(stuff_id) {
    let connection = await connect();

    let rows = null;

    if (stuff_id == null || stuff_id == '') {
        let query = 'SELECT COUNT(id) as total FROM tbl_discussion';
        [rows] = await mysql_execute(connection, query, []);
    } else {
        let query =
            'SELECT COUNT(id) as total FROM tbl_discussion WHERE stuff_id LIKE ?';
        [rows] = await mysql_execute(connection, query, [stuff_id]);
    }

    connection.release();
    return rows[0].total;
}

async function get_discussion(stuff_id, limit, cnt) {
    let connection = null;

    try {
        connection = await connect();

        let rows = null;

        if (stuff_id == null || stuff_id == '') {
            let query =
                'SELECT tbl_discussion.*, COUNT(tbl_comment.id) as comment_cnt FROM tbl_discussion ' +
                'LEFT JOIN tbl_comment ON tbl_discussion.id = tbl_comment.discussion_id ' +
                'GROUP BY tbl_discussion.id ORDER BY tbl_discussion.likes DESC LIMIT ?, ?';
            [rows] = await mysql_execute(connection, query, [limit, cnt]);
        } else {
            let query =
                'SELECT tbl_discussion.*, COUNT(tbl_comment.id) as comment_cnt FROM tbl_discussion ' +
                'LEFT JOIN tbl_comment ON tbl_discussion.id = tbl_comment.discussion_id ' +
                'WHERE stuff_id LIKE ? GROUP BY tbl_discussion.id ORDER BY tbl_discussion.likes DESC LIMIT ?, ?';
            [rows] = await mysql_execute(connection, query, [
                stuff_id,
                limit,
                cnt,
            ]);
        }

        connection.release();
        return rows;
    } catch (err) {
        on_connection_err(connection, err);
    }

    return [];
}

async function get_discussion_by_keyword(stuff_id, limit, cnt, keyword) {
    let connection = null;

    try {
        connection = await connect();
        let query =
            'SELECT * from tbl_discussion ' +
            'WHERE tbl_discussion.content LIKE ? AND tbl_discussion.stuff_id LIKE ?' +
            ' ORDER BY tbl_discussion.likes DESC LIMIT ?, ?';
        let [rows] = await mysql_execute(connection, query, [
            '%' + keyword + '%',
            stuff_id,
            limit,
            cnt,
        ]);

        connection.release();
        return rows;
    } catch (err) {
        on_connection_err(connection, err);
    }

    return [];
}

async function get_discussion_by_id(id) {
    let connection = null;

    try {
        connection = await connect();

        let query =
            'SELECT tbl_discussion.*, COUNT(tbl_comment.id) as comment_cnt from tbl_discussion ' +
            'LEFT JOIN tbl_comment ON tbl_discussion.id = tbl_comment.discussion_id ' +
            'WHERE tbl_discussion.id LIKE ? GROUP BY tbl_discussion.id';
        let [rows] = await mysql_execute(connection, query, [id]);

        connection.release();
        if (rows.length == 0) return null;

        return rows[0];
    } catch (err) {
        on_connection_err(connection, err);
    }

    return null;
}

async function get_comment(discussion_id) {
    let connection = null;

    try {
        connection = await connect();

        let rows = null;

        if (discussion_id == null || discussion_id == '') {
            let query = 'SELECT * from tbl_comment';
            [rows] = await mysql_execute(connection, query);
        } else {
            let query = 'SELECT * from tbl_comment WHERE discussion_id LIKE ?';
            [rows] = await mysql_execute(connection, query, [discussion_id]);
        }

        connection.release();
        return rows;
    } catch (err) {
        on_connection_err(err);
    }

    return [];
}

async function add_discussion(stuff_id, content, user_type, user) {
    let connection = null;
    let ret = false;

    try {
        connection = await connect();

        await start_transaction(connection);

        let query =
            'INSERT INTO tbl_discussion (stuff_id, content, user, user_type) ' +
            'VALUE (?,?,?,?)';
        let [rows] = await mysql_execute(connection, query, [
            stuff_id,
            content,
            user,
            user_type,
        ]);

        await commit_transaction(connection);
        ret = rows.insertId > 0;
        connection.release();
    } catch (err) {
        await on_connection_err(connection, err, true);
    }

    return ret;
}

async function add_comment(discussion_id, parent_id, content, user_type, user) {
    let connection = null;
    let ret = false;

    try {
        connection = await connect();

        await start_transaction(connection);

        let query =
            'INSERT INTO tbl_comment ' +
            '(discussion_id, parent_id, content, user, user_type) ' +
            'VALUE (?,?,?,?,?)';
        let [rows] = await mysql_execute(connection, query, [
            discussion_id,
            parent_id,
            content,
            user,
            user_type,
        ]);

        await commit_transaction(connection);
        ret = rows.insertId > 0;
        connection.release();
    } catch (err) {
        await on_connection_err(connection, err, true);
    }

    return ret;
}

async function add_token(connection, item) {
    let ret = 0;

    try {
        let query =
            'INSERT INTO tbl_item ' +
            '(game_id, category_id, contract_address, token_id, name, description, ' +
            'attach_url, owner, is_anonymous, arcadedoge_price) ' +
            'VALUE(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        let [rows] = await mysql_execute(connection, query, [
            item.game_id,
            item.category_id,
            item.contract_address,
            item.token_id,
            item.name,
            item.description,
            item.attach_url,
            item.owner,
            item.is_anonymous,
            item.arcadedoge_price,
        ]);
        ret = rows.insertId;
    } catch (err) {
        console.log(err);
    }
    return ret;
}

async function add_mint_tx(connection, id, item) {
    let ret = false;

    try {
        let query =
            'INSERT INTO tbl_history (token_id, from_address, to_address, type) ' +
            'VALUE(?, ?, ?, ?)';
        let [rows] = await mysql_execute(connection, query, [
            id,
            item.owner,
            item.owner,
            CONST.TX_TYPE.MINT,
        ]);
        ret = rows.insertId > 0;
    } catch (err) {
        console.log(err);
    }

    return ret;
}

async function update_sync_block_number(
    connection,
    contract_type,
    block_number
) {
    let ret = false;

    try {
        let query =
            'UPDATE tbl_status SET block_number = ? WHERE contract_type = ?';
        let [rows] = await mysql_execute(connection, query, [
            block_number,
            contract_type,
        ]);
        ret = rows.affectedRows > 0;
    } catch (err) {
        console.log(err);
    }

    return ret;
}

async function mint_token(item, block_number) {
    let connection = null;
    let ret = false;

    try {
        connection = await connect();

        await start_transaction(connection);

        let token_id = await add_token(connection, item);
        if (token_id == 0) throw new Error('Adding token failed.');

        if (!(await add_mint_tx(connection, token_id, item))) {
            throw new Error('Adding mint tx failed.');
        }

        if (
            !(await update_sync_block_number(
                connection,
                CONST.CONTRACT_TYPE.NFT,
                block_number
            ))
        ) {
            throw new Error('Updating sync block number failed.');
        }

        await commit_transaction(connection);

        ret = true;

        connection.release();
    } catch (err) {
        await on_connection_err(connection, err, true);
    }

    return ret;
}

async function get_sync_block_number(contract_type) {
    let ret = -1;
    let connection = null;

    try {
        connection = await connect();
        let query =
            'SELECT block_number FROM tbl_status WHERE contract_type = ?';
        let [rows] = await mysql_execute(connection, query, [contract_type]);
        ret = rows[0].block_number;
        connection.release();
    } catch (err) {
        on_connection_err(connection, err);
    }

    return ret;
}

async function get_token_by_id(id) {
    let connection = null;
    let ret = null;

    try {
        connection = await connect();

        let query = 'SELECT * from tbl_item WHERE id = ?';
        let [rows] = await mysql_execute(connection, query, [id]);
        if (rows.length > 0) ret = rows[0];

        connection.release();
    } catch (err) {
        on_connection_err(connection, err);
    }

    return ret;
}

async function update_token_by_id(
    id,
    game_id,
    category_id,
    name,
    description,
    is_anonymous,
    price
) {
    let connection = null;
    let ret = null;

    try {
        connection = await connect();

        let query =
            'UPDATE tbl_item SET game_id=?, category_id=?, name=?, description=?, is_anonymous=?, arcadedoge_price=? WHERE tbl_item.id LIKE ?';
        let [rows] = await mysql_execute(connection, query, [
            game_id,
            category_id,
            name,
            description,
            is_anonymous,
            price,
            id,
        ]);
        ret = rows.affectedRows > 0;

        connection.release();
    } catch (err) {
        on_connection_err(connection, err);
    }

    return ret;
}

async function get_token_by_tokenid(token_id) {
    let connection = null;
    let ret = null;

    try {
        connection = await connect();

        let query = 'SELECT * from tbl_item WHERE token_id = ?';
        let [rows] = await mysql_execute(connection, query, [token_id]);
        if (rows.length > 0) ret = rows[0];
        connection.release();
    } catch (err) {
        on_connection_err(connection, err);
    }

    return ret;
}

async function get_token_by_contract_info(contract_address, token_id) {
    let connection = null;
    let ret = null;

    try {
        connection = await connect();

        let query =
            'SELECT * from tbl_item ' +
            'WHERE contract_address = ? AND token_id = ?';
        let [rows] = await mysql_execute(connection, query, [
            contract_address,
            token_id,
        ]);
        if (rows.length > 0) ret = rows[0];

        connection.release();
    } catch (err) {
        on_connection_err(connection, err);
    }

    return ret;
}

async function delete_token(connection, id) {
    let ret = false;

    try {
        let query = 'UPDATE tbl_item SET is_burnt = ? WHERE id = ?';
        let [rows] = await mysql_execute(connection, query, [
            CONST.BURN_STATUS.BURNT,
            id,
        ]);
        ret = rows.affectedRows > 0;
    } catch (err) {
        console.log(err);
    }

    return ret;
}

async function add_burn_tx(connection, item) {
    let ret = false;

    try {
        let query =
            'INSERT INTO tbl_history ' +
            '(token_id, from_address, to_address, type) VALUE (?, ?, ?, ?)';
        let [rows] = await mysql_execute(connection, query, [
            item.id,
            item.owner,
            item.owner,
            CONST.TX_TYPE.BUNRT,
        ]);
        ret = rows.insertId > 0;
    } catch (err) {
        console.log(err);
    }

    return ret;
}

async function burn_token(contract_address, token_id, block_number) {
    let connection = null;
    let ret = false;

    try {
        connection = await connect();

        await start_transaction(connection);

        let token = await get_token_by_contract_info(
            contract_address,
            token_id
        );
        if (token == null) throw new Error('Not exist token.');

        if (!(await delete_token(connection, token.id))) {
            throw new Error('Deleting token failed.');
        }

        if (!(await add_burn_tx(connection, token))) {
            throw new Error('Adding burn tx failed.');
        }

        if (
            !(await update_sync_block_number(
                connection,
                CONST.CONTRACT_TYPE.NFT,
                block_number
            ))
        ) {
            throw new Error('Updating sync block number failed.');
        }

        await commit_transaction(connection);
        ret = true;

        connection.release();
    } catch (err) {
        await on_connection_err(connection, err, true);
    }

    return ret;
}

async function update_token_visible(
    connection,
    id,
    visible,
    arcadedoge_price = 0
) {
    let ret = false;

    try {
        if (visible == CONST.VISIBILITY_STATUS.SHOW) {
            let query =
                'UPDATE tbl_item SET is_visible = ?, arcadedoge_price = ? ' +
                'WHERE id = ?';
            let [rows] = await mysql_execute(connection, query, [
                visible,
                arcadedoge_price,
                id,
            ]);
            ret = rows.affectedRows > 0;
        } else if (visible == CONST.VISIBILITY_STATUS.HIDDEN) {
            let query = 'UPDATE tbl_item SET is_visible = ? WHERE id = ?';
            let [rows] = await mysql_execute(connection, query, [visible, id]);
            ret = rows.affectedRows > 0;
        }
    } catch (err) {
        console.log(err);
    }

    return ret;
}

async function sell_token(
    contract_address,
    token_id,
    arcadedoge_price,
    block_number
) {
    let connection = null;
    let ret = false;

    try {
        connection = await connect();

        await start_transaction(connection);

        let token = await get_token_by_contract_info(
            contract_address,
            token_id
        );
        if (token == null) throw new Error('Not exist token.');

        if (
            !(await update_token_visible(
                connection,
                token.id,
                CONST.VISIBILITY_STATUS.SHOW,
                arcadedoge_price
            ))
        ) {
            throw new Error('Setting visible failed.');
        }

        if (
            !(await update_sync_block_number(
                connection,
                CONST.CONTRACT_TYPE.EXCHANGE,
                block_number
            ))
        ) {
            throw new Error('Updating sync block failed.');
        }

        await commit_transaction(connection);
        ret = true;

        connection.release();
    } catch (err) {
        await on_connection_err(connection, err, true);
    }

    return ret;
}

async function cancel_sell_token(contract_address, token_id, block_number) {
    let connection = null;
    let ret = false;

    try {
        connection = await connect();

        await start_transaction(connection);

        let token = await get_token_by_contract_info(
            contract_address,
            token_id
        );
        if (token == null) throw new Error('Not exist token.');

        if (
            !(await update_token_visible(
                connection,
                token.id,
                CONST.VISIBILITY_STATUS.HIDDEN
            ))
        ) {
            throw new Error('Setting visible failed.');
        }

        if (
            !(await update_sync_block_number(
                connection,
                CONST.CONTRACT_TYPE.EXCHANGE,
                block_number
            ))
        ) {
            throw new Error('Updating sync block failed.');
        }

        await commit_transaction(connection);
        ret = true;

        connection.release();
    } catch (err) {
        await on_connection_err(connection, err, true);
    }

    return ret;
}

async function update_token_owner(connection, id, owner) {
    let ret = false;

    try {
        let query =
            'UPDATE tbl_item SET owner = ?, is_visible = false WHERE id = ?';
        let [rows] = await mysql_execute(connection, query, [owner, id]);
        ret = rows.affectedRows > 0;
    } catch (err) {
        console.log(err);
    }

    return ret;
}

async function add_exchange_tx(connection, id, from, to, asset_id, amount) {
    let ret = false;

    try {
        let query =
            'INSERT INTO tbl_history ' +
            '(token_id, from_address, to_address, asset_id, amount, type) ' +
            'VALUE(?, ?, ?, ?, ?, ?)';
        let [rows] = await mysql_execute(connection, query, [
            id,
            from,
            to,
            asset_id,
            amount,
            CONST.TX_TYPE.EXCHANGE,
        ]);
        ret = rows.insertId > 0;
    } catch (err) {
        console.log(err);
    }

    return ret;
}

async function add_transfer_tx(connection, id, from, to) {
    let ret = false;

    try {
        let query =
            'INSERT INTO tbl_history ' +
            '(token_id, from_address, to_address, type) VALUE(?, ?, ?, ?)';
        let [rows] = await mysql_execute(connection, query, [
            id,
            from,
            to,
            CONST.TX_TYPE.EXCHANGE,
        ]);
        ret = rows.insertId > 0;
    } catch (err) {
        console.log(err);
    }

    return ret;
}

async function increase_trade_cnt(connection, id) {
    let ret = false;

    try {
        let query =
            'UPDATE tbl_item SET trade_cnt = trade_cnt + 1 WHERE id = ?';
        let [rows] = await mysql_execute(connection, query, [id]);
        ret = rows.affectedRows > 0;
    } catch (err) {
        console.log(err);
    }

    return ret;
}

async function exchange_token(
    contract_address,
    token_id,
    owner,
    asset_id,
    amount,
    buyer,
    block_number
) {
    let connection = null;
    let ret = false;

    try {
        connection = await connect();

        await start_transaction(connection);

        let token = await get_token_by_contract_info(
            contract_address,
            token_id
        );
        if (token == null) throw new Error('Not exist token.');

        if (!(await update_token_owner(connection, token.id, buyer))) {
            throw new Error('Updating token owner failed.');
        }

        if (
            !(await add_exchange_tx(
                connection,
                token.id,
                owner,
                buyer,
                asset_id,
                amount
            ))
        ) {
            throw new Error('Adding exchange tx failed.');
        }

        if (!(await increase_trade_cnt(connection, token.id))) {
            throw new Error('Increasing trade cnt failed.');
        }

        if (
            !(await update_sync_block_number(
                connection,
                CONST.CONTRACT_TYPE.EXCHANGE,
                block_number
            ))
        ) {
            throw new Error('Updating sync block number failed.');
        }
        await commit_transaction(connection);
        ret = true;

        connection.release();
    } catch (err) {
        await on_connection_err(connection, err, true);
    }

    return ret;
}

async function transfer_token(
    contract_address,
    token_id,
    from,
    to,
    block_number
) {
    let connection = null;
    let ret = false;

    try {
        connection = await connect();

        await start_transaction(connection);

        let token = await get_token_by_contract_info(
            contract_address,
            token_id
        );
        if (token == null) throw new Error('Not exist token.');

        if (!(await update_token_owner(connection, token.id, to))) {
            throw new Error('Updating token owner failed.');
        }

        if (!(await add_transfer_tx(connection, token.id, from, to))) {
            throw new Error('Adding transfer tx failed.');
        }

        if (
            !(await update_sync_block_number(
                connection,
                CONST.CONTRACT_TYPE.NFT,
                block_number
            ))
        ) {
            throw new Error('Updating sync block number failed.');
        }

        await commit_transaction(connection);
        ret = true;

        connection.release();
    } catch (err) {
        await on_connection_err(connection, err, true);
    }

    return ret;
}

async function update_other_sync_block_number(contract_type, block_number) {
    let connection = null;
    let ret = false;

    try {
        connection = await connect();

        await start_transaction(connection);

        ret = await update_sync_block_number(
            connection,
            contract_type,
            block_number
        );

        await commit_transaction(connection);

        connection.release();
    } catch (err) {
        await on_connection_err(connection, err, true);
    }

    return ret;
}

async function get_games() {
    let connection = null;

    try {
        connection = await connect();
        let query = 'SELECT * FROM tbl_game';
        let [rows] = await mysql_execute(connection, query);
        connection.release();
        return rows;
    } catch (err) {
        on_connection_err(connection, err);
    }

    return [];
}

async function get_categories() {
    let connection = null;

    try {
        connection = await connect();
        let query = 'SELECT * from tbl_category';
        let [rows] = await mysql_execute(connection, query);
        connection.release();
        return rows;
    } catch (err) {
        on_connection_err(connection, err);
    }

    return [];
}

async function get_items_by_address(address, sort_type, limit, cnt) {
    let connection = null;

    try {
        connection = await connect();
        let query =
            'SELECT tbl_item.*, tbl_category.name as category_name from tbl_item ' +
            'LEFT JOIN tbl_category ON tbl_item.category_id = tbl_category.id ' +
            'WHERE is_burnt = 0 AND owner = ? ' +
            get_order_by_clause(sort_type) +
            ' LIMIT ?, ?';
        let [rows] = await mysql_execute(connection, query, [
            address,
            limit,
            cnt,
        ]);
        connection.release();
        return rows;
    } catch (err) {
        on_connection_err(connection, err);
    }

    return [];
}

async function get_items_by_address_cnt(address) {
    let connection = null;

    try {
        connection = await connect();
        let query =
            'SELECT COUNT(id) as total from tbl_item ' +
            'WHERE is_burnt = 0 AND owner = ?';
        let [rows] = await mysql_execute(connection, query, [address]);
        connection.release();
        return rows[0].total;
    } catch (err) {
        on_connection_err(connection, err);
    }

    return 0;
}

async function get_market_items(game, category, sort_type, limit, cnt) {
    let connection = null;

    try {
        connection = await connect();

        let query =
            'SELECT tbl_item.*, tbl_category.name as category_name from tbl_item ' +
            'LEFT JOIN tbl_category ON tbl_item.category_id = tbl_category.id ' +
            'WHERE is_visible = ? AND is_burnt = 0';
        let params = [CONST.VISIBILITY_STATUS.SHOW];

        if (game != 0) {
            query += ' AND tbl_item.game_id = ?';
            params.push(game);
        }

        if (category != 0) {
            query += ' AND category_id = ?';
            params.push(category);
        }

        query += ' ' + get_order_by_clause(sort_type) + ' LIMIT ?, ?';
        params.push(limit);
        params.push(cnt);
        let [rows] = await mysql_execute(connection, query, params);
        connection.release();
        return rows;
    } catch (err) {
        on_connection_err(connection, err);
    }

    return [];
}

async function get_market_items_cnt(game, category) {
    let connection = null;

    try {
        connection = await connect();

        let query =
            'SELECT COUNT(id) as total from tbl_item ' +
            'WHERE is_visible = ? AND is_burnt = 0';
        let params = [CONST.VISIBILITY_STATUS.SHOW];

        if (game != 0) {
            query += ' AND tbl_item.game_id = ?';
            params.push(game);
        }

        if (category != 0) {
            query += ' AND category_id = ?';
            params.push(category);
        }

        let [rows] = await mysql_execute(connection, query, params);
        connection.release();
        return rows[0].total;
    } catch (err) {
        on_connection_err(connection, err);
    }

    return 0;
}

async function insert_likes(discussion_id, parent_id, user) {
    let connection = null;
    let ret = false;

    try {
        connection = await connect();

        let query =
            'INSERT INTO tbl_likes ' +
            '(discussion_id, parent_id, user) VALUE(?, ?, ?)';
        let [rows] = await mysql_execute(connection, query, [
            discussion_id,
            parent_id,
            user,
        ]);
        ret = rows.insertId > 0;

        connection.release();
    } catch (err) {
        on_connection_err(connection, err);
    }

    return ret;
}

async function delete_likes(discussion_id, parent_id, user) {
    let connection = null;
    let ret = false;

    try {
        connection = await connect();

        let query =
            'DELETE FROM tbl_likes ' +
            'WHERE discussion_id LIKE ? AND parent_id LIKE ? AND user LIKE ?';
        let [rows] = await mysql_execute(connection, query, [
            discussion_id,
            parent_id,
            user,
        ]);
        ret = rows.affectedRows > 0;

        connection.release();
    } catch (err) {
        on_connection_err(connection, err);
    }

    return ret;
}

async function get_likes(discussion_id, parent_id, user) {
    let connection = null;

    try {
        connection = await connect();
        let query =
            'SELECT id from tbl_likes ' +
            'WHERE discussion_id LIKE ? AND parent_id LIKE ? AND user LIKE ?';
        let [rows] = await mysql_execute(connection, query, [
            discussion_id,
            parent_id,
            user,
        ]);
        connection.release();
        return rows;
    } catch (err) {
        on_connection_err(connection, err);
    }

    return [];
}

async function get_likes_count(discussion_id, parent_id) {
    let connection = null;

    try {
        connection = await connect();
        let query =
            'SELECT COUNT(id) as total from tbl_likes ' +
            'WHERE discussion_id LIKE ? AND parent_id LIKE ?';
        let [rows] = await mysql_execute(connection, query, [
            discussion_id,
            parent_id,
        ]);
        connection.release();
        return rows[0].total;
    } catch (err) {
        on_connection_err(connection, err);
    }

    return 0;
}

function get_order_by_clause(sort_type) {
    switch (sort_type) {
        case CONST.SORT_TYPE.PRICE_HIGH_LOW:
            return 'ORDER BY arcadedoge_price DESC';
        case CONST.SORT_TYPE.PRICE_LOW_HIGH:
            return 'ORDER BY arcadedoge_price ASC';
        case CONST.SORT_TYPE.POPULAR:
            return 'ORDER BY trade_cnt DESC';
        case CONST.SORT_TYPE.RECENT:
        default:
            return 'ORDER BY updated_at DESC';
    }
}

async function mysql_execute(connection, query, params = []) {
    // let stringify_params = [];
    // for (let i = 0; i < params.length; i++) {
    //     stringify_params.push(params[i].toString());
    // }

    return await connection.query(query, params);
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
    update_token_by_id,
    get_token_by_tokenid,
    get_token_by_contract_info,
    burn_token,
    sell_token,
    cancel_sell_token,
    exchange_token,
    transfer_token,
    get_games,
    get_categories,
    get_items_by_address,
    get_items_by_address_cnt,
    get_market_items,
    get_market_items_cnt,
    update_other_sync_block_number,
    get_discussion_by_keyword,
    insert_likes,
    delete_likes,
    get_likes,
    get_likes_count,
    get_discussion_cnt,
};
