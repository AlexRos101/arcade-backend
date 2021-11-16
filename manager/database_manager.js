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

async function startTransactions(connection) {
    const query = 'START TRANSACTION';
    await connection.query(query);
}

async function commitTransaction(connection) {
    const query = 'COMMIT';
    await connection.query(query);
}

async function rollbackTransaction(connection) {
    const query = 'ROLLBACK';
    await connection.query(query);
}

async function onConnectionErr(connection, err, isRollBack = false) {
    console.log(err);
    if (connection == null) return;
    if (err.errono === CONST.MYSQL_ERR_NO.CONNECTION_ERROR) return;
    if (isRollBack) await rollbackTransaction(connection);
    connection.release();
}

async function mysqlExecute(connection, query, params = []) {
    // let stringify_params = [];
    // for (let i = 0; i < params.length; i++) {
    //     stringify_params.push(params[i].toString());
    // }

    return await connection.query(query, params);
}

function getOrderByClause(sortType) {
    switch (sortType) {
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

async function getStuff(stuffID) {
    let connection = null;
    try {
        connection = await connect();

        let rows = null;

        if (stuffID == null || stuffID === '') {
            const query = 'SELECT * from tbl_stuff';
            [rows] = await mysqlExecute(connection, query);

            connection.release();
            return rows;
        }
        const query = 'SELECT * from tbl_stuff WHERE id LIKE ?';
        [rows] = await mysqlExecute(connection, query, [stuffID]);

        connection.release();
        if (rows.length === 0) return null;

        return rows[0];
    } catch (err) {
        onConnectionErr(connection, err);
    }

    return null;
}

async function getDiscussionCnt(stuffID) {
    const connection = await connect();

    let rows = null;

    if (stuffID == null || stuffID === '') {
        const query = 'SELECT COUNT(id) as total FROM tbl_discussion';
        [rows] = await mysqlExecute(connection, query, []);
    } else {
        const query =
            'SELECT COUNT(id) as total FROM tbl_discussion WHERE stuff_id LIKE ?';
        [rows] = await mysqlExecute(connection, query, [stuffID]);
    }

    connection.release();
    return rows[0].total;
}

async function getDiscussion(stuffID, limit, cnt) {
    let connection = null;

    try {
        connection = await connect();

        let rows = null;

        if (stuffID == null || stuffID === '') {
            const query =
                'SELECT tbl_discussion.*, COUNT(tbl_comment.id) as comment_cnt FROM tbl_discussion ' +
                'LEFT JOIN tbl_comment ON tbl_discussion.id = tbl_comment.discussion_id ' +
                'GROUP BY tbl_discussion.id ORDER BY tbl_discussion.likes DESC LIMIT ?, ?';
            [rows] = await mysqlExecute(connection, query, [limit, cnt]);
        } else {
            const query =
                'SELECT tbl_discussion.*, COUNT(tbl_comment.id) as comment_cnt FROM tbl_discussion ' +
                'LEFT JOIN tbl_comment ON tbl_discussion.id = tbl_comment.discussion_id ' +
                'WHERE stuff_id LIKE ? GROUP BY tbl_discussion.id ORDER BY tbl_discussion.likes DESC LIMIT ?, ?';
            [rows] = await mysqlExecute(connection, query, [
                stuffID,
                limit,
                cnt,
            ]);
        }

        connection.release();
        return rows;
    } catch (err) {
        onConnectionErr(connection, err);
    }

    return [];
}

async function getDiscussionByKeyword(stuffID, limit, cnt, keyword) {
    let connection = null;

    try {
        connection = await connect();
        const query =
            'SELECT * from tbl_discussion ' +
            'WHERE tbl_discussion.content LIKE ? AND tbl_discussion.stuff_id LIKE ?' +
            ' ORDER BY tbl_discussion.likes DESC LIMIT ?, ?';
        const [rows] = await mysqlExecute(connection, query, [
            `%${keyword}%`,
            stuffID,
            limit,
            cnt,
        ]);

        connection.release();
        return rows;
    } catch (err) {
        onConnectionErr(connection, err);
    }

    return [];
}

async function getDiscussionByID(id) {
    let connection = null;

    try {
        connection = await connect();

        const query =
            'SELECT tbl_discussion.*, COUNT(tbl_comment.id) as comment_cnt from tbl_discussion ' +
            'LEFT JOIN tbl_comment ON tbl_discussion.id = tbl_comment.discussion_id ' +
            'WHERE tbl_discussion.id LIKE ? GROUP BY tbl_discussion.id';
        const [rows] = await mysqlExecute(connection, query, [id]);

        connection.release();
        if (rows.length === 0) return null;

        return rows[0];
    } catch (err) {
        onConnectionErr(connection, err);
    }

    return null;
}

async function getCommentByID(id) {
    let connection = null;

    try {
        connection = await connect();

        const query = 'SELECT * FROM tbl_comment WHERE id LIKE ?';
        const [rows] = await mysqlExecute(connection, query, [id]);

        connection.release();
        if (rows.length === 0) return null;

        return rows[0];
    } catch (err) {
        onConnectionErr(connection, err);
    }

    return null;
}

async function getComment(discussionID) {
    let connection = null;

    try {
        connection = await connect();

        let rows = null;

        if (discussionID == null || discussionID === '') {
            const query = 'SELECT * from tbl_comment';
            [rows] = await mysqlExecute(connection, query);
        } else {
            const query =
                'SELECT * from tbl_comment WHERE discussion_id LIKE ?';
            [rows] = await mysqlExecute(connection, query, [discussionID]);
        }

        connection.release();
        return rows;
    } catch (err) {
        onConnectionErr(err);
    }

    return [];
}

async function addDiscussion(stuffID, content, userType, user) {
    let connection = null;
    let ret = false;

    try {
        connection = await connect();

        await startTransactions(connection);

        const query =
            'INSERT INTO tbl_discussion (stuff_id, content, user, user_type) ' +
            'VALUE (?,?,?,?)';
        const [rows] = await mysqlExecute(connection, query, [
            stuffID,
            content,
            user,
            userType,
        ]);

        await commitTransaction(connection);
        ret = rows.insertId > 0;
        connection.release();
    } catch (err) {
        await onConnectionErr(connection, err, true);
    }

    return ret;
}

async function addComment(discussionID, parentID, content, userType, user) {
    let connection = null;
    let ret = false;

    try {
        connection = await connect();

        await startTransactions(connection);

        const query =
            'INSERT INTO tbl_comment ' +
            '(discussion_id, parent_id, content, user, user_type) ' +
            'VALUE (?,?,?,?,?)';
        const [rows] = await mysqlExecute(connection, query, [
            discussionID,
            parentID,
            content,
            user,
            userType,
        ]);

        await commitTransaction(connection);
        ret = rows.insertId;
        connection.release();
    } catch (err) {
        await onConnectionErr(connection, err, true);
    }

    return ret;
}

async function addToken(connection, item) {
    let ret = 0;

    try {
        const query =
            'INSERT INTO tbl_item ' +
            '(game_id, category_id, contract_address, token_id, name, description, ' +
            'attach_url, owner, is_anonymous, arcadedoge_price) ' +
            'VALUE(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        const [rows] = await mysqlExecute(connection, query, [
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

async function addMintTx(connection, id, item, txid, timestamp) {
    let ret = false;

    try {
        const query =
            'INSERT INTO tbl_history (txid, token_id, from_address, to_address, type, block_timestamp) ' +
            'VALUE(?, ?, ?, ?, ?, ?)';
        const [rows] = await mysqlExecute(connection, query, [
            txid,
            id,
            item.owner,
            item.owner,
            CONST.TX_TYPE.MINT,
            timestamp,
        ]);
        ret = rows.insertId > 0;
    } catch (err) {
        console.log(err);
    }

    return ret;
}

async function updateSyncBlockNumber(connection, contractType, blockNumber) {
    let ret = false;

    try {
        const query =
            'UPDATE tbl_status SET block_number = ? WHERE contract_type = ?';
        const [rows] = await mysqlExecute(connection, query, [
            blockNumber,
            contractType,
        ]);
        ret = rows.affectedRows > 0;
    } catch (err) {
        console.log(err);
    }

    return ret;
}

async function mintToken(item, txid, blockNumber, timestamp) {
    let connection = null;
    let ret = false;

    try {
        connection = await connect();

        await startTransactions(connection);

        const tokenID = await addToken(connection, item);
        if (tokenID === 0) throw new Error('Adding token failed.');

        if (!(await addMintTx(connection, tokenID, item, txid, timestamp))) {
            throw new Error('Adding mint tx failed.');
        }

        if (
            !(await updateSyncBlockNumber(
                connection,
                CONST.CONTRACT_TYPE.NFT,
                blockNumber
            ))
        ) {
            throw new Error('Updating sync block number failed.');
        }

        await commitTransaction(connection);

        ret = true;

        connection.release();
    } catch (err) {
        await onConnectionErr(connection, err, true);
    }

    return ret;
}

async function getSyncBlockNumber(contractType) {
    let ret = -1;
    let connection = null;

    try {
        connection = await connect();
        const query =
            'SELECT block_number FROM tbl_status WHERE contract_type = ?';
        const [rows] = await mysqlExecute(connection, query, [contractType]);
        ret = rows[0].block_number;
        connection.release();
    } catch (err) {
        onConnectionErr(connection, err);
    }

    return ret;
}

async function getTokenByID(id) {
    let connection = null;
    let ret = null;

    try {
        connection = await connect();

        const query = 'SELECT * from tbl_item WHERE id = ?';
        const [rows] = await mysqlExecute(connection, query, [id]);
        if (rows.length > 0) ret = rows[0];

        connection.release();
    } catch (err) {
        onConnectionErr(connection, err);
    }

    return ret;
}

async function updateTokenByID(
    id,
    gameID,
    categoryID,
    name,
    description,
    isAnonymous,
    price
) {
    let connection = null;
    let ret = null;

    try {
        connection = await connect();

        const query =
            'UPDATE tbl_item ' +
            'SET game_id=?, category_id=?, name=?, description=?, is_anonymous=?, arcadedoge_price=? ' +
            'WHERE id = ?';
        const [rows] = await mysqlExecute(connection, query, [
            gameID,
            categoryID,
            name,
            description,
            isAnonymous,
            price,
            id,
        ]);
        ret = rows.affectedRows > 0;

        connection.release();
    } catch (err) {
        onConnectionErr(connection, err);
    }

    return ret;
}

async function getTokenByTokenID(tokenID) {
    let connection = null;
    let ret = null;

    try {
        connection = await connect();

        const query = 'SELECT * from tbl_item WHERE token_id = ?';
        const [rows] = await mysqlExecute(connection, query, [tokenID]);
        if (rows.length > 0) ret = rows[0];
        connection.release();
    } catch (err) {
        onConnectionErr(connection, err);
    }

    return ret;
}

async function getTokenByContractInfo(contractAddress, tokenID) {
    let connection = null;
    let ret = null;

    try {
        connection = await connect();

        const query =
            'SELECT * from tbl_item ' +
            'WHERE contract_address = ? AND token_id = ?';
        const [rows] = await mysqlExecute(connection, query, [
            contractAddress,
            tokenID,
        ]);
        if (rows.length > 0) ret = rows[0];

        connection.release();
    } catch (err) {
        onConnectionErr(connection, err);
    }

    return ret;
}

async function deleteToken(connection, id) {
    let ret = false;

    try {
        const query = 'UPDATE tbl_item SET is_burnt = ? WHERE id = ?';
        const [rows] = await mysqlExecute(connection, query, [
            CONST.BURN_STATUS.BURNT,
            id,
        ]);
        ret = rows.affectedRows > 0;
    } catch (err) {
        console.log(err);
    }

    return ret;
}

async function addBurnTx(connection, item, txid, timestamp) {
    let ret = false;

    try {
        const query =
            'INSERT INTO tbl_history ' +
            '(txid, token_id, from_address, to_address, type, block_timestamp) VALUE (?, ?, ?, ?, ?, ?)';
        const [rows] = await mysqlExecute(connection, query, [
            txid,
            item.id,
            item.owner,
            item.owner,
            CONST.TX_TYPE.BUNRT,
            timestamp,
        ]);
        ret = rows.insertId > 0;
    } catch (err) {
        console.log(err);
    }

    return ret;
}

async function burnToken(
    contractAddress,
    tokenID,
    txid,
    blockNumber,
    timestamp
) {
    let connection = null;
    let ret = false;

    try {
        connection = await connect();

        await startTransactions(connection);

        const token = await getTokenByContractInfo(contractAddress, tokenID);
        if (token == null) throw new Error('Not exist token.');

        if (!(await deleteToken(connection, token.id))) {
            throw new Error('Deleting token failed.');
        }

        if (!(await addBurnTx(connection, token, txid, timestamp))) {
            throw new Error('Adding burn tx failed.');
        }

        if (
            !(await updateSyncBlockNumber(
                connection,
                CONST.CONTRACT_TYPE.NFT,
                blockNumber
            ))
        ) {
            throw new Error('Updating sync block number failed.');
        }

        await commitTransaction(connection);
        ret = true;

        connection.release();
    } catch (err) {
        await onConnectionErr(connection, err, true);
    }

    return ret;
}

async function updateTokenVisible(
    connection,
    id,
    visible,
    arcadedogePrice = 0
) {
    let ret = false;

    try {
        if (visible === CONST.VISIBILITY_STATUS.SHOW) {
            const query =
                'UPDATE tbl_item SET is_visible = ?, arcadedoge_price = ? ' +
                'WHERE id = ?';
            const [rows] = await mysqlExecute(connection, query, [
                visible,
                arcadedogePrice,
                id,
            ]);
            ret = rows.affectedRows > 0;
        } else if (visible === CONST.VISIBILITY_STATUS.HIDDEN) {
            const query = 'UPDATE tbl_item SET is_visible = ? WHERE id = ?';
            const [rows] = await mysqlExecute(connection, query, [visible, id]);
            ret = rows.affectedRows > 0;
        }
    } catch (err) {
        console.log(err);
    }

    return ret;
}

async function sellToken(
    contractAddress,
    tokenID,
    arcadedogePrice,
    blockNumber
) {
    let connection = null;
    let ret = false;

    try {
        connection = await connect();

        await startTransactions(connection);

        const token = await getTokenByContractInfo(contractAddress, tokenID);
        if (token == null) throw new Error('Not exist token.');

        if (
            !(await updateTokenVisible(
                connection,
                token.id,
                CONST.VISIBILITY_STATUS.SHOW,
                arcadedogePrice
            ))
        ) {
            throw new Error('Setting visible failed.');
        }

        if (
            !(await updateSyncBlockNumber(
                connection,
                CONST.CONTRACT_TYPE.EXCHANGE,
                blockNumber
            ))
        ) {
            throw new Error('Updating sync block failed.');
        }

        await commitTransaction(connection);
        ret = true;

        connection.release();
    } catch (err) {
        await onConnectionErr(connection, err, true);
    }

    return ret;
}

async function cancelSellToken(contractAddress, tokenID, blockNumber) {
    let connection = null;
    let ret = false;

    try {
        connection = await connect();

        await startTransactions(connection);

        const token = await getTokenByContractInfo(contractAddress, tokenID);
        if (token == null) throw new Error('Not exist token.');

        if (
            !(await updateTokenVisible(
                connection,
                token.id,
                CONST.VISIBILITY_STATUS.HIDDEN
            ))
        ) {
            throw new Error('Setting visible failed.');
        }

        if (
            !(await updateSyncBlockNumber(
                connection,
                CONST.CONTRACT_TYPE.EXCHANGE,
                blockNumber
            ))
        ) {
            throw new Error('Updating sync block failed.');
        }

        await commitTransaction(connection);
        ret = true;

        connection.release();
    } catch (err) {
        await onConnectionErr(connection, err, true);
    }

    return ret;
}

async function updateTokenOwner(connection, id, owner) {
    let ret = false;

    try {
        const query =
            'UPDATE tbl_item SET owner = ?, is_visible = false WHERE id = ?';
        const [rows] = await mysqlExecute(connection, query, [owner, id]);
        ret = rows.affectedRows > 0;
    } catch (err) {
        console.log(err);
    }

    return ret;
}

async function addExchangeTx(
    connection,
    id,
    from,
    to,
    assetID,
    amount,
    txid,
    timestamp
) {
    let ret = false;

    try {
        const query =
            'INSERT INTO tbl_history ' +
            '(txid, token_id, from_address, to_address, asset_id, token_amount, type, block_timestamp) ' +
            'VALUE(?, ?, ?, ?, ?, ?, ?, ?)';
        const [rows] = await mysqlExecute(connection, query, [
            txid,
            id,
            from,
            to,
            assetID,
            amount,
            CONST.TX_TYPE.EXCHANGE,
            timestamp,
        ]);
        ret = rows.insertId > 0;
    } catch (err) {
        console.log(err);
    }

    return ret;
}

async function addTransferTx(connection, id, from, to, txid, timestamp) {
    let ret = false;

    try {
        const query =
            'INSERT INTO tbl_history ' +
            '(txid, token_id, from_address, to_address, type, block_timestamp) VALUE(?, ?, ?, ?, ?, ?)';
        const [rows] = await mysqlExecute(connection, query, [
            txid,
            id,
            from,
            to,
            CONST.TX_TYPE.EXCHANGE,
            timestamp,
        ]);
        ret = rows.insertId > 0;
    } catch (err) {
        console.log(err);
    }

    return ret;
}

async function increaseTradeCnt(connection, id) {
    let ret = false;

    try {
        const query =
            'UPDATE tbl_item SET trade_cnt = trade_cnt + 1 WHERE id = ?';
        const [rows] = await mysqlExecute(connection, query, [id]);
        ret = rows.affectedRows > 0;
    } catch (err) {
        console.log(err);
    }

    return ret;
}

async function exchangeToken(
    contractAddress,
    tokenID,
    owner,
    assetID,
    amount,
    buyer,
    txid,
    blockNumber,
    timestamp
) {
    let connection = null;
    let ret = false;

    try {
        connection = await connect();

        await startTransactions(connection);

        const token = await getTokenByContractInfo(contractAddress, tokenID);
        if (token == null) throw new Error('Not exist token.');

        if (!(await updateTokenOwner(connection, token.id, buyer))) {
            throw new Error('Updating token owner failed.');
        }

        if (
            !(await addExchangeTx(
                connection,
                token.id,
                owner,
                buyer,
                assetID,
                amount,
                txid,
                timestamp
            ))
        ) {
            throw new Error('Adding exchange tx failed.');
        }

        if (!(await increaseTradeCnt(connection, token.id))) {
            throw new Error('Increasing trade cnt failed.');
        }

        if (
            !(await updateSyncBlockNumber(
                connection,
                CONST.CONTRACT_TYPE.EXCHANGE,
                blockNumber
            ))
        ) {
            throw new Error('Updating sync block number failed.');
        }
        await commitTransaction(connection);
        ret = true;

        connection.release();
    } catch (err) {
        await onConnectionErr(connection, err, true);
    }

    return ret;
}

async function transferToken(
    contractAddress,
    tokenID,
    from,
    to,
    txid,
    blockNumber,
    timestamp
) {
    let connection = null;
    let ret = false;

    try {
        connection = await connect();

        await startTransactions(connection);

        const token = await getTokenByContractInfo(contractAddress, tokenID);
        if (token == null) throw new Error('Not exist token.');

        if (!(await updateTokenOwner(connection, token.id, to))) {
            throw new Error('Updating token owner failed.');
        }

        if (
            !(await addTransferTx(
                connection,
                token.id,
                from,
                to,
                txid,
                timestamp
            ))
        ) {
            throw new Error('Adding transfer tx failed.');
        }

        if (
            !(await updateSyncBlockNumber(
                connection,
                CONST.CONTRACT_TYPE.NFT,
                blockNumber
            ))
        ) {
            throw new Error('Updating sync block number failed.');
        }

        await commitTransaction(connection);
        ret = true;

        connection.release();
    } catch (err) {
        await onConnectionErr(connection, err, true);
    }

    return ret;
}

async function updateOtherSyncBlockNumber(contractType, blockNumber) {
    let connection = null;
    let ret = false;

    try {
        connection = await connect();

        await startTransactions(connection);

        ret = await updateSyncBlockNumber(
            connection,
            contractType,
            blockNumber
        );

        await commitTransaction(connection);

        connection.release();
    } catch (err) {
        await onConnectionErr(connection, err, true);
    }

    return ret;
}

async function getGames() {
    let connection = null;

    try {
        connection = await connect();
        const query = 'SELECT * FROM tbl_game';
        const [rows] = await mysqlExecute(connection, query);
        connection.release();
        return rows;
    } catch (err) {
        onConnectionErr(connection, err);
    }

    return [];
}

async function getCategories() {
    let connection = null;

    try {
        connection = await connect();
        const query = 'SELECT * from tbl_category';
        const [rows] = await mysqlExecute(connection, query);
        connection.release();
        return rows;
    } catch (err) {
        onConnectionErr(connection, err);
    }

    return [];
}

async function getItemsByAddress(address, sortType, limit, cnt) {
    let connection = null;

    try {
        connection = await connect();
        const query =
            'SELECT tbl_item.*, tbl_category.name as category_name from tbl_item ' +
            'LEFT JOIN tbl_category ON tbl_item.category_id = tbl_category.id ' +
            `WHERE is_burnt = 0 AND owner = ? ${getOrderByClause(
                sortType
            )} LIMIT ?, ?`;
        const [rows] = await mysqlExecute(connection, query, [
            address,
            limit,
            cnt,
        ]);
        connection.release();
        return rows;
    } catch (err) {
        onConnectionErr(connection, err);
    }

    return [];
}

async function getItemsByAddressCnt(address) {
    let connection = null;

    try {
        connection = await connect();
        const query =
            'SELECT COUNT(id) as total from tbl_item ' +
            'WHERE is_burnt = 0 AND owner = ?';
        const [rows] = await mysqlExecute(connection, query, [address]);
        connection.release();
        return rows[0].total;
    } catch (err) {
        onConnectionErr(connection, err);
    }

    return 0;
}

async function getMarketItems(game, category, sortType, limit, cnt) {
    let connection = null;

    try {
        connection = await connect();

        let query =
            'SELECT tbl_item.*, tbl_category.name as category_name from tbl_item ' +
            'LEFT JOIN tbl_category ON tbl_item.category_id = tbl_category.id ' +
            'WHERE is_visible = ? AND is_burnt = 0';
        const params = [CONST.VISIBILITY_STATUS.SHOW];

        if (game !== 0) {
            query += ' AND tbl_item.game_id = ?';
            params.push(game);
        }

        if (category !== 0) {
            query += ' AND category_id = ?';
            params.push(category);
        }

        query += ` ${getOrderByClause(sortType)} LIMIT ?, ?`;
        params.push(limit);
        params.push(cnt);
        const [rows] = await mysqlExecute(connection, query, params);
        connection.release();
        return rows;
    } catch (err) {
        onConnectionErr(connection, err);
    }

    return [];
}

async function getMarketItemsCnt(game, category) {
    let connection = null;

    try {
        connection = await connect();

        let query =
            'SELECT COUNT(id) as total from tbl_item ' +
            'WHERE is_visible = ? AND is_burnt = 0';
        const params = [CONST.VISIBILITY_STATUS.SHOW];

        if (game !== 0) {
            query += ' AND tbl_item.game_id = ?';
            params.push(game);
        }

        if (category !== 0) {
            query += ' AND category_id = ?';
            params.push(category);
        }

        const [rows] = await mysqlExecute(connection, query, params);
        connection.release();
        return rows[0].total;
    } catch (err) {
        onConnectionErr(connection, err);
    }

    return 0;
}

async function insertLikes(discussionID, parentID, user) {
    let connection = null;
    let ret = false;

    try {
        connection = await connect();

        const query =
            'INSERT INTO tbl_likes ' +
            '(discussion_id, parent_id, user) VALUE(?, ?, ?)';
        const [rows] = await mysqlExecute(connection, query, [
            discussionID,
            parentID,
            user,
        ]);
        ret = rows.insertId > 0;

        connection.release();
    } catch (err) {
        onConnectionErr(connection, err);
    }

    return ret;
}

async function deleteLikes(discussionID, parentID, user) {
    let connection = null;
    let ret = false;

    try {
        connection = await connect();

        const query =
            'DELETE FROM tbl_likes ' +
            'WHERE discussion_id LIKE ? AND parent_id LIKE ? AND user LIKE ?';
        const [rows] = await mysqlExecute(connection, query, [
            discussionID,
            parentID,
            user,
        ]);
        ret = rows.affectedRows > 0;

        connection.release();
    } catch (err) {
        onConnectionErr(connection, err);
    }

    return ret;
}

async function getLikes(discussionID, parentID, user) {
    let connection = null;

    try {
        connection = await connect();
        const query =
            'SELECT id from tbl_likes ' +
            'WHERE discussion_id LIKE ? AND parent_id LIKE ? AND user LIKE ?';
        const [rows] = await mysqlExecute(connection, query, [
            discussionID,
            parentID,
            user,
        ]);
        connection.release();
        return rows;
    } catch (err) {
        onConnectionErr(connection, err);
    }

    return [];
}

async function getLikesCount(discussionID, parentID) {
    let connection = null;

    try {
        connection = await connect();
        const query =
            'SELECT COUNT(id) as total from tbl_likes ' +
            'WHERE discussion_id LIKE ? AND parent_id LIKE ?';
        const [rows] = await mysqlExecute(connection, query, [
            discussionID,
            parentID,
        ]);
        connection.release();
        return rows[0].total;
    } catch (err) {
        onConnectionErr(connection, err);
    }

    return 0;
}

async function getTxs(gameId, index, count) {
    let connection = null;

    try {
        connection = await connect();

        const query =
            'SELECT id, from_address, to_address, type as tx_type, token_id, gamepoint_amount as amount, ' +
            'block_timestamp ' +
            'FROM tbl_history ' +
            'WHERE game_id = ? AND id > ? ORDER BY id LIMIT 0, ?';

        const [rows] = await mysqlExecute(connection, query, [
            gameId,
            index,
            count,
        ]);

        connection.release();
        return rows;
    } catch (err) {
        onConnectionErr(connection, err, false);
    }
    return null;
}

async function addSwapTx(
    connection,
    id,
    address,
    tokenAmount,
    gamePointAmount,
    type,
    txid,
    timestamp
) {
    let ret = false;

    try {
        const query =
            'INSERT INTO tbl_history ' +
            '(txid, game_id, from_address, to_address, token_amount, gamepoint_amount, type, block_timestamp) ' +
            'VALUE(?, ?, ?, ?, ?, ?, ?, ?)';
        const [rows] = await mysqlExecute(connection, query, [
            txid,
            id,
            address,
            address,
            tokenAmount,
            gamePointAmount,
            type,
            timestamp,
        ]);
        ret = rows.insertId > 0;
    } catch (err) {
        console.log(err);
    }

    return ret;
}

async function buyGamePoint(
    id,
    address,
    tokenAmount,
    gamePointAmount,
    txid,
    timestamp,
    blockNumber
) {
    let ret = false;
    let connection = null;

    try {
        connection = await connect();

        await startTransactions(connection);

        if (
            !(await addSwapTx(
                connection,
                id,
                address,
                tokenAmount,
                gamePointAmount,
                CONST.SWAP_TYPE.DEPOSIT,
                txid,
                timestamp
            ))
        ) {
            throw new Error('Adding buy request failed!');
        }

        if (
            !(await updateSyncBlockNumber(
                connection,
                CONST.CONTRACT_TYPE.SWAP,
                blockNumber
            ))
        ) {
            throw new Error('Updating sync block number failed.');
        }

        await commitTransaction(connection);
        ret = true;

        connection.release();
    } catch (err) {
        await onConnectionErr(connection, err, true);
    }

    return ret;
}

async function sellGamePoint(
    id,
    address,
    tokenAmount,
    gamePointAmount,
    txid,
    timestamp,
    blockNumber
) {
    let ret = false;
    let connection = null;

    try {
        connection = await connect();

        await startTransactions(connection);

        if (
            !(await addSwapTx(
                connection,
                id,
                address,
                tokenAmount,
                gamePointAmount,
                CONST.SWAP_TYPE.WITHDRAW,
                txid,
                timestamp
            ))
        ) {
            throw new Error('Adding buy request failed!');
        }

        if (
            !(await updateSyncBlockNumber(
                connection,
                CONST.CONTRACT_TYPE.SWAP,
                blockNumber
            ))
        ) {
            throw new Error('Updating sync block number failed.');
        }

        await commitTransaction(connection);
        ret = true;

        connection.release();
    } catch (err) {
        await onConnectionErr(connection, err, true);
    }

    return ret;
}

module.exports = {
    getStuff,
    getDiscussion,
    getComment,
    getDiscussionByID,
    addDiscussion,
    addComment,
    mintToken,
    getSyncBlockNumber,
    getTokenByID,
    updateTokenByID,
    getTokenByTokenID,
    getTokenByContractInfo,
    burnToken,
    sellToken,
    cancelSellToken,
    exchangeToken,
    transferToken,
    getGames,
    getCategories,
    getItemsByAddress,
    getItemsByAddressCnt,
    getMarketItems,
    getMarketItemsCnt,
    updateOtherSyncBlockNumber,
    getDiscussionByKeyword,
    insertLikes,
    deleteLikes,
    getLikes,
    getLikesCount,
    getDiscussionCnt,
    getCommentByID,
    getTxs,
    buyGamePoint,
    sellGamePoint,
};
