const CONST = require('../common/constants');
const logManager = require('./log_manager');

/* eslint-disable */
async function connect() {
    return new Promise((resolve, reject) => {
        mysqlPool
            .getConnection()
            .then((connection) => {
                resolve(connection);
            })
            .catch((err) => {
                logManager.error(err);
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
    logManager.error(err);
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
        logManager.error(`getStuff failed: stuffID=${stuffID}`);
        await onConnectionErr(connection, err);
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
        logManager.error(
            `getDiscussion failed: stuffID=${stuffID}, limit=${limit}, cnt=${cnt}`
        );
        await onConnectionErr(connection, err);
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
        logManager.error(
            `getDiscussionByKeyword failed: stuffID=${stuffID}, limit=${limit}, cnt=${cnt}, keyword=${keyword}`
        );
        await onConnectionErr(connection, err);
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
        logManager.error(`getDiscussionByID failed: id=${id}`);
        await onConnectionErr(connection, err);
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
        logManager.error(`getCommentByID failed: id=${id}`);
        await onConnectionErr(connection, err);
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
        logManager.error(`getComment failed: discussionID=${discussionID}`);
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
        logManager.error(
            `addDiscussion failed: stuffID=${stuffID}, content=${content}, userType=${userType}, user=${user}`
        );
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
        logManager.error(
            `addComment failed: discussionID=${discussionID}, parentID=${parentID}, content=${content}, ` +
                `userType=${userType}, user=${user}`
        );
        await onConnectionErr(connection, err, true);
    }

    return ret;
}

async function getGameId(connection, tokenId) {
    const res = -1;

    try {
        const query = 'SELECT game_id FROM tbl_item WHERE token_id = ?';
        const [rows] = await mysqlExecute(connection, query, [tokenId]);

        if (rows.length > 0) {
            return rows[0].game_id;
        }
    } catch (err) {
        logManager.error(
            `getGameId failed: tokenId=${tokenId} error=${JSON.stringify(err)}`
        );
    }

    return res;
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
        logManager.error(
            `addToken failed: item=${JSON.stringify(
                item
            )}, error=${JSON.stringify(err)}`
        );
        logManager.error(err);
    }
    return ret;
}

async function addMintTx(connection, id, gameId, item, txid, timestamp) {
    let ret = false;

    try {
        const query =
            'INSERT INTO tbl_history (txid, game_id, token_id, from_address, to_address, type, block_timestamp) ' +
            'VALUE(?, ?, ?, ?, ?, ?, ?)';
        const [rows] = await mysqlExecute(connection, query, [
            txid,
            gameId,
            id,
            item.owner,
            item.owner,
            CONST.TX_TYPE.MINT,
            timestamp,
        ]);
        ret = rows.insertId > 0;
    } catch (err) {
        logManager.error(
            `addMintTx failed: id=${id}, gameId=${gameId}, item=${JSON.stringify(
                item
            )}, txid=${txid}, ` +
                `timestamp=${timestamp}, error=${JSON.stringify(err)}`
        );
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
        logManager.error(
            `updateSyncBlockNumber failed: contractType=${contractType}, blockNumber=${blockNumber}, ` +
                `error=${JSON.stringify(err)}`
        );
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

        if (
            !(await addMintTx(
                connection,
                tokenID,
                item.game_id,
                item,
                txid,
                timestamp
            ))
        ) {
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
        logManager.error(
            `mintToken failed: item=${JSON.stringify(
                item
            )}, txid=${txid}, blockNumber=${blockNumber}, ` +
                `timestamp=${timestamp}`
        );
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
        logManager.error(
            `getSyncBlockNumber failed: contractType=${contractType}`
        );
        await onConnectionErr(connection, err);
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
        logManager.error(`getTokenByID failed: id=${id}`);
        await onConnectionErr(connection, err);
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
        logManager.error(
            `updateTokenByID failed: id=${id}, gameID=${gameID}, categoryID=${categoryID}, name=${name}, ` +
                `description=${description}, isAnonymous=${isAnonymous}, price=${price}`
        );
        await onConnectionErr(connection, err);
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
        logManager.error(`getTokenByTokenID failed: tokenID=${tokenID}`);
        await onConnectionErr(connection, err);
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
        logManager.error(
            `getTokenByContractInfo failed: contractAddress=${contractAddress}, tokenID=${tokenID}`
        );
        await onConnectionErr(connection, err);
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
        logManager.error(
            `deleteToken failed: id=${id}, error=${JSON.stringify(err)}`
        );
    }

    return ret;
}

async function addBurnTx(connection, gameId, item, txid, timestamp) {
    let ret = false;

    try {
        const query =
            'INSERT INTO tbl_history ' +
            '(txid, game_id, token_id, from_address, to_address, type, block_timestamp) VALUE (?, ?, ?, ?, ?, ?, ?)';
        const [rows] = await mysqlExecute(connection, query, [
            txid,
            gameId,
            item.id,
            item.owner,
            item.owner,
            CONST.TX_TYPE.BUNRT,
            timestamp,
        ]);
        ret = rows.insertId > 0;
    } catch (err) {
        logManager.error(
            `addBurnTx failed: gameId=${gameId}, item=${JSON.stringify(
                item
            )}, txid=${txid}, timestamp=${timestamp} ` +
                `error=${JSON.stringify(err)}`
        );
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

        const gameId = await getGameId(connection, tokenID);
        if (gameId === -1) throw new Error('Not exist gameId');

        if (!(await deleteToken(connection, token.id))) {
            throw new Error('Deleting token failed.');
        }

        if (!(await addBurnTx(connection, gameId, token, txid, timestamp))) {
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
        logManager.error(
            `burnToken failed: contractAddress=${contractAddress}, tokenID=${tokenID}, txid=${txid}, ` +
                `blockNumber=${blockNumber}, timestamp=${timestamp}`
        );
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
        logManager.error(
            `updateTokenVisible failed: id=${id}, visible=${visible}, arcadedogePrice=${arcadedogePrice}, ` +
                `error=${JSON.stringify(err)}`
        );
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
        logManager.error(
            `sellToken failed: contractAddress=${contractAddress}, tokenID=${tokenID}, ` +
                `arcadedogePrice=${arcadedogePrice}, blockNumber=${blockNumber}`
        );
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
        logManager.error(
            `cancelSellToken failed: contractAddress=${contractAddress}, tokenID=${tokenID}, blockNumber=${blockNumber}`
        );
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
        logManager.error(
            `updateTokenOwner failed: id=${id}, owner=${owner}, error=${JSON.stringify(
                err
            )}`
        );
    }

    return ret;
}

async function addExchangeTx(
    connection,
    gameId,
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
            '(txid, game_id, token_id, from_address, to_address, asset_id, token_amount, type, block_timestamp) ' +
            'VALUE(?, ?, ?, ?, ?, ?, ?, ?, ?)';
        const [rows] = await mysqlExecute(connection, query, [
            txid,
            gameId,
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
        logManager.error(
            `addExchangeTx failed: gameId=${gameId}, id=${id}, from=${from}, to=${to}, assetID=${assetID}, ` +
                `amount=${amount}, txid=${txid}, timestamp=${timestamp} error=${JSON.stringify(
                    err
                )}`
        );
    }

    return ret;
}

async function addTransferTx(
    connection,
    gameId,
    id,
    from,
    to,
    txid,
    timestamp
) {
    let ret = false;

    try {
        const query =
            'INSERT INTO tbl_history ' +
            '(txid, game_id, token_id, from_address, to_address, type, block_timestamp) VALUE(?, ?, ?, ?, ?, ?, ?)';
        const [rows] = await mysqlExecute(connection, query, [
            txid,
            gameId,
            id,
            from,
            to,
            CONST.TX_TYPE.EXCHANGE,
            timestamp,
        ]);
        ret = rows.insertId > 0;
    } catch (err) {
        logManager.error(
            `addTransferTx failed: gameId=${gameId}, id=${id}, from=${from}, to=${to}, txid=${txid}, ` +
                `timestamp=${timestamp} error=${JSON.stringify(err)}`
        );
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
        logManager.error(
            `increaseTradeCnt failed: id=${id}, error=${JSON.stringify(err)}`
        );
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

        const gameId = await getGameId(connection, tokenID);
        if (gameId === -1) throw new Error('Not exist gameId');

        if (!(await updateTokenOwner(connection, token.id, buyer))) {
            throw new Error('Updating token owner failed.');
        }

        if (
            !(await addExchangeTx(
                connection,
                gameId,
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
        logManager.error(
            `exchangeToken failed: contractAddress=${contractAddress}, tokenID=${tokenID}, owner=${owner}, ` +
                `assetID=${assetID}, amount=${amount}, buyer=${buyer}, txid=${txid}, blockNumber=${blockNumber}, ` +
                `timestamp=${timestamp}`
        );
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

        const gameId = await getGameId(connection, tokenID);
        if (gameId === -1) throw new Error('Not exist gameId');

        if (!(await updateTokenOwner(connection, token.id, to))) {
            throw new Error('Updating token owner failed.');
        }

        if (
            !(await addTransferTx(
                connection,
                gameId,
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
        logManager.error(
            `transferToken failed: contractAddress=${contractAddress}, tokenID=${tokenID}, from=${from}, to=${to}, ` +
                `txid=${txid}, blockNumber=${blockNumber}, timestamp=${timestamp}`
        );
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
        logManager.error(
            `updateOtherSyncBlockNumber failed: contractType=${contractType}, blockNumber=${blockNumber}`
        );
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
        logManager.error('getGames failed: No parameters');
        await onConnectionErr(connection, err);
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
        logManager.error('getCategories failed: No parameters');
        await onConnectionErr(connection, err);
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
        logManager.error(
            `getItemsByAddress failed: address=${address}, sortType=${sortType}, limit=${limit}, cnt=${cnt}`
        );
        await onConnectionErr(connection, err);
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
        logManager.error(`getItemsByAddressCnt failed: address=${address}`);
        await onConnectionErr(connection, err);
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
        logManager.error(
            `getMarketItems failed: game=${game}, category=${category}, sortType=${sortType}, limit=${limit}, ` +
                `cnt=${cnt}`
        );
        await onConnectionErr(connection, err);
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
        logManager.error(
            `getMarketItemsCnt failed: game=${game}, category=${category}`
        );
        await onConnectionErr(connection, err);
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
        logManager.error(
            `insertLikes failed: discussionID=${discussionID}, parentID=${parentID}, user=${user}`
        );
        await onConnectionErr(connection, err);
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
        logManager.error(
            `deleteLikes failed: discussionID=${discussionID}, parentID=${parentID}, user=${user}`
        );
        await onConnectionErr(connection, err);
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
        logManager.error(
            `getLikes failed: discussionID=${discussionID}, parentID=${parentID}, user=${user}`
        );
        await onConnectionErr(connection, err);
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
        logManager.error(
            `getLikesCount failed: discussionID=${discussionID}, parentID=${parentID}`
        );
        await onConnectionErr(connection, err);
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
        logManager.error(
            `getTxs failed: gameId=${gameId}, index=${index}, count=${count}`
        );
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
        logManager.error(
            `addSwapTx failed: id=${id}, address=${address}, tokenAmount=${tokenAmount}, ` +
                `gamePointAmount=${gamePointAmount}, type=${type}, txid=${txid}, timestamp=${timestamp}, ` +
                `error=${JSON.stringify(err)}`
        );
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
        logManager.error(
            `buyGamePoint failed: id=${id}, address=${address}, tokenAmount=${tokenAmount}, ` +
                `gamePointAmount=${gamePointAmount}, txid=${txid}, timestamp=${timestamp}, blockNumber=${blockNumber}`
        );
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
        logManager.error(
            `sellGamePoint failed: id=${id}, address=${address}, tokenAmount=${tokenAmount}, ` +
                `gamePointAmount=${gamePointAmount}, txid=${txid}, timestamp=${timestamp}, blockNumber=${blockNumber}`
        );
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
