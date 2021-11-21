const mv = require('mv');
const Unrar = require('unrar');
const yauzl = require('yauzl');
const fs = require('fs');
const { soliditySha3 } = require('web3-utils');
const databaseManager = require('./database_manager');
const config = require('../common/config');
const gameAPI = require('../adapter/game_api');
const CONST = require('../common/constants');

function response(ret, res) {
    res.setHeader('content-type', 'text/plain');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200);
    res.json(ret);
}

function responseInvalid(res) {
    const ret = {
        result: false,
        msg: 'validation failed!',
    };
    response(ret, res);
}

function isValidDiscussionParams(params) {
    if (params.stuff_id == null || params.stuff_id <= 0) {
        return false;
    }
    if (!params.content) {
        return false;
    }
    if (params.user_type !== 0 && params.user_type !== 1) {
        return false;
    }
    if (params.user_type === 0 && !params.user) {
        return false;
    }

    return true;
}

function isValidCommentParams(params) {
    if (params.discussion_id == null || params.discussion_id <= 0) {
        return false;
    }

    if (params.parent_id == null) {
        return false;
    }

    if (!params.content) {
        return false;
    }
    if (params.user_type !== 0 && params.user_type !== 1) {
        return false;
    }
    if (params.user_type === 0 && !params.user) {
        return false;
    }

    return true;
}

function registerAPIs(app) {
    app.post('/stuff/all', async (req, res) => {
        const stuffs = await databaseManager.getStuff(null);

        for (let i = 0; i < stuffs.length; i++) {
            const stuff = stuffs[i];
            const discussions = await databaseManager.getDiscussion(
                stuff.id,
                0,
                5
            );
            for (let j = 0; j < discussions.length; j++) {
                const likesCount = await databaseManager.getLikesCount(
                    discussions[j].id,
                    -1
                );
                discussions[j].likes = likesCount;
            }
            stuffs[i].discussions = discussions;
        }

        const ret = {
            result: true,
            data: stuffs,
        };

        response(ret, res);
    });

    app.post('/stuff/search', async (req, res) => {
        const { keyword } = req.fields;
        const stuffs = await databaseManager.getStuff(null);

        for (let i = 0; i < stuffs.length; i++) {
            const stuff = stuffs[i];
            const discussions = await databaseManager.getDiscussionByKeyword(
                stuff.id,
                0,
                3,
                keyword
            );
            stuffs[i].discussions = discussions;
        }

        const ret = {
            result: true,
            data: stuffs,
        };

        response(ret, res);
    });

    app.post('/stuff', async (req, res) => {
        const { id } = req.fields;

        const stuff = await databaseManager.getStuff(id);

        const ret = {
            result: true,
            data: stuff,
        };

        response(ret, res);
    });

    app.post('/discussion/all/', async (req, res) => {
        const { id } = req.fields;
        const { limit } = req.fields;
        const { cnt } = req.fields;

        const discussions = await databaseManager.getDiscussion(id, limit, cnt);
        for (let i = 0; i < discussions.length; i++) {
            const likesCount = await databaseManager.getLikesCount(
                discussions[i].id,
                -1
            );
            discussions[i].likes = likesCount;
        }

        const total = await databaseManager.getDiscussionCnt(id);

        const ret = {
            result: true,
            data: discussions,
            total,
        };

        response(ret, res);
    });

    app.post('/discussion', async (req, res) => {
        const { id } = req.fields;
        const { account } = req.fields;
        const { limit } = req.fields;
        const { cnt } = req.fields;
        let total = 0;

        const discussion = await databaseManager.getDiscussionByID(id);
        const likesCount = await databaseManager.getLikesCount(
            discussion.id,
            -1
        );
        discussion.likes = likesCount;

        let isHot = true;
        const discussions = await databaseManager.getDiscussion(
            discussion.stuff_id,
            0,
            30
        );
        for (let i = 0; i < discussions.length; i++) {
            const likes = await databaseManager.getLikesCount(
                discussions[i].id,
                -1
            );

            if (likes > likesCount) {
                isHot = false;
                break;
            }
        }

        if (discussion != null) {
            discussion.is_hot = isHot;
            const comments = await databaseManager.getComment(id);

            for (let i = comments.length - 1; i >= 0; i--) {
                const commentLikesCount = await databaseManager.getLikesCount(
                    comments[i].discussion_id,
                    comments[i].id
                );
                comments[i].likes = commentLikesCount;

                if (account !== '' && account !== undefined) {
                    comments[i].user_like = await databaseManager.getLikes(
                        comments[i].discussion_id,
                        comments[i].id,
                        account
                    );
                }

                const comment = comments[i];
                if (comment.parent_id === -1) {
                    continue;
                }
                for (let j = i - 1; j >= 0; j--) {
                    if (comments[j].id === comment.parent_id) {
                        if (!('reply' in comments[j])) {
                            comments[j].reply = [];
                        }
                        comments[j].reply.unshift(comment);
                        break;
                    }
                }
                comments.splice(i, 1);
            }
            total = comments.length;
            discussion.comments = comments.slice(limit, limit + cnt);
        }

        const ret = {
            result: true,
            data: discussion,
            total,
        };

        response(ret, res);
    });

    app.post('/discussion/new', async (req, res) => {
        /* eslint-disable-next-line camelcase */
        const { stuff_id } = req.fields;
        const { content } = req.fields;
        /* eslint-disable-next-line camelcase */
        const { user_type } = req.fields;
        const { user } = req.fields;

        if (
            !isValidDiscussionParams({
                stuff_id,
                content,
                user_type,
                user,
            })
        ) {
            responseInvalid(res);
            return;
        }

        const result = await databaseManager.addDiscussion(
            stuff_id,
            content,
            user_type,
            user
        );

        const ret = {
            result: true,
            data: result,
        };

        response(ret, res);
    });

    app.post('/comment', async (req, res) => {
        const { id } = req.fields;

        const result = await databaseManager.getCommentByID(id);

        const likesCount = await databaseManager.getLikesCount(
            result.discussion_id,
            result.id
        );
        result.likes = likesCount;

        const ret = {
            result: true,
            data: result,
        };

        response(ret, res);
    });

    app.post('/comment/new', async (req, res) => {
        /* eslint-disable-next-line camelcase */
        const { discussion_id } = req.fields;
        /* eslint-disable-next-line camelcase */
        const { parent_id } = req.fields;
        const { content } = req.fields;
        /* eslint-disable-next-line camelcase */
        const { user_type } = req.fields;
        const { user } = req.fields;

        if (
            !isValidCommentParams({
                discussion_id,
                parent_id,
                content,
                user_type,
                user,
            })
        ) {
            responseInvalid(res);
            return;
        }

        const result = await databaseManager.addComment(
            discussion_id,
            parent_id,
            content,
            user_type,
            user
        );

        const ret = {
            result: true,
            data: result,
        };

        response(ret, res);
    });

    app.post('/get_games', async (req, res) => {
        const result = await databaseManager.getGames();

        const ret = {
            result: true,
            data: result,
        };

        response(ret, res);
    });

    app.post('/set_likes', async (req, res) => {
        /* eslint-disable-next-line camelcase */
        const { discussion_id } = req.fields;
        /* eslint-disable-next-line camelcase */
        const { parent_id } = req.fields;
        const { user } = req.fields;
        const likesOrUnlikes = req.fields.likes;
        let result = {};
        if (likesOrUnlikes === true) {
            result = await databaseManager.insertLikes(
                discussion_id,
                parent_id,
                user
            );
        } else {
            result = await databaseManager.deleteLikes(
                discussion_id,
                parent_id,
                user
            );
        }

        const ret = {
            result: true,
            data: result,
        };

        response(ret, res);
    });

    app.post('/get_likes', async (req, res) => {
        /* eslint-disable-next-line camelcase */
        const { discussion_id } = req.fields;
        /* eslint-disable-next-line camelcase */
        const { parent_id } = req.fields;
        const { user } = req.fields;

        const result = await databaseManager.getLikes(
            discussion_id,
            parent_id,
            user
        );

        const ret = {
            result: true,
            data: result,
        };

        response(ret, res);
    });

    app.post('/get_categories', async (req, res) => {
        const result = await databaseManager.getCategories();

        const ret = {
            result: true,
            data: result,
        };

        response(ret, res);
    });

    app.post('/get_items_by_address', async (req, res) => {
        const { address } = req.fields;
        /* eslint-disable-next-line camelcase */
        const sort_type = req.fields.sort;
        const { limit } = req.fields;
        const { cnt } = req.fields;

        if (
            !address ||
            /* eslint-disable-next-line camelcase */
            sort_type === null ||
            limit === null ||
            cnt === null
        ) {
            responseInvalid(res);
            return;
        }

        const result = await databaseManager.getItemsByAddress(
            address,
            sort_type,
            limit,
            cnt
        );
        const total = await databaseManager.getItemsByAddressCnt(address);

        const ret = {
            result: true,
            data: result,
            total,
        };

        response(ret, res);
    });

    app.post('/get_market_items', async (req, res) => {
        const { game } = req.fields;
        const { category } = req.fields;
        /* eslint-disable-next-line camelcase */
        const sort_type = req.fields.sort;
        const { limit } = req.fields;
        const { cnt } = req.fields;

        if (
            game == null ||
            category == null ||
            /* eslint-disable-next-line camelcase */
            sort_type == null ||
            limit == null ||
            cnt == null
        ) {
            responseInvalid(res);
            return;
        }

        const result = await databaseManager.getMarketItems(
            game,
            category,
            sort_type,
            limit,
            cnt
        );
        const total = await databaseManager.getMarketItemsCnt(game, category);
        const ret = {
            result: true,
            data: result,
            total,
        };

        response(ret, res);
    });

    app.post('/get_item_by_id', async (req, res) => {
        const { id } = req.fields;

        if (id == null) {
            responseInvalid(res);
            return;
        }

        const result = await databaseManager.getTokenByID(id);

        const ret = {
            result: result != null,
            data: result,
        };

        response(ret, res);
    });

    app.post('/update_item_by_id', async (req, res) => {
        const { id } = req.fields;
        /* eslint-disable-next-line camelcase */
        const { game_id } = req.fields;
        /* eslint-disable-next-line camelcase */
        const { category_id } = req.fields;
        const { name } = req.fields;
        /* eslint-disable-next-line camelcase */
        const { is_anonymous } = req.fields;
        const { description } = req.fields;
        const { price } = req.fields;

        if (id == null) {
            responseInvalid(res);
            return;
        }

        const result = await databaseManager.updateTokenByID(
            id,
            game_id,
            category_id,
            name,
            description,
            is_anonymous,
            price
        );

        const ret = {
            result: result != null,
            data: result,
        };

        response(ret, res);
    });

    app.post('/get_item_by_tokenid', async (req, res) => {
        const id = req.fields.token_id;

        if (id == null) {
            responseInvalid(res);
            return;
        }

        const result = await databaseManager.getTokenByTokenID(id);

        const ret = {
            result: result != null,
            data: result,
        };

        response(ret, res);
    });

    app.post('/upload_material', async (req, res) => {
        const { files } = req;
        if (files.myFile == null) {
            response({ result: false }, res);
            return;
        }

        if (
            files.myFile.name.slice(
                files.myFile.name.length - 4,
                files.myFile.name.length
            ) !== '.rar' &&
            files.myFile.name.slice(
                files.myFile.name.length - 4,
                files.myFile.name.length
            ) !== '.zip'
        ) {
            response({ result: false }, res);
            return;
        }

        const oldpath = files.myFile.path;
        const newpath = config.materialPath + files.myFile.name;
        mv(oldpath, newpath, async (err) => {
            if (err) {
                console.log(err);
                response({ result: false }, res);
                return;
            }

            if (newpath.slice(newpath.length - 4, newpath.length) === '.rar') {
                const archive = new Unrar(newpath);

                archive.list((listErr, entries) => {
                    if (listErr !== null) {
                        console.log(listErr);
                        response({ result: false }, res);
                        return;
                    }

                    for (let i = 0; i < entries.length; i++) {
                        const { name } = entries[i];
                        const { type } = entries[i];
                        if (type === 'File' && name === 'thumbnail.png') {
                            const stream = archive.stream('thumbnail.png'); // name of entry
                            stream.on('error', () => {
                                response({ result: false });
                            });
                            stream.pipe(
                                fs.createWriteStream(
                                    `${
                                        config.thumbnailPath
                                    }${files.myFile.name.slice(
                                        0,
                                        files.myFile.name.length - 4
                                    )}.png`
                                )
                            );

                            response({ result: true }, res);
                            return;
                        }
                    }

                    response(
                        {
                            result: false,
                            code: -1,
                            msg: 'Not exist thumbnail file.',
                        },
                        res
                    );
                });
            } else if (
                newpath.slice(newpath.length - 4, newpath.length) === '.zip'
            ) {
                yauzl.open(
                    newpath,
                    { lazyEntries: true },
                    (openErr, zipfile) => {
                        if (openErr) {
                            console.log(openErr);
                            response({ result: false }, res);
                            return;
                        }

                        let existThumbnail = false;
                        zipfile.readEntry();
                        zipfile.on('entry', (entry) => {
                            if (entry.fileName === 'thumbnail.png') {
                                zipfile.openReadStream(
                                    entry,
                                    (entryErr, readStream) => {
                                        if (entryErr) {
                                            response({ result: false }, res);
                                            return;
                                        }

                                        readStream.on('end', () => {
                                            zipfile.readEntry();
                                        });
                                        readStream.pipe(
                                            fs.createWriteStream(
                                                `${
                                                    config.thumbnailPath
                                                }${files.myFile.name.slice(
                                                    0,
                                                    files.myFile.name.length - 4
                                                )}.png`
                                            )
                                        );
                                        existThumbnail = true;
                                    }
                                );
                            } else {
                                zipfile.readEntry();
                            }
                        });
                        zipfile.once('end', () => {
                            zipfile.close();

                            if (existThumbnail) {
                                response({ result: true }, res);
                            } else {
                                response(
                                    {
                                        result: false,
                                        code: -1,
                                        msg: 'Not exist thumbnail file.',
                                    },
                                    res
                                );
                            }
                        });
                    }
                );
            }
        });
    });

    app.post('/verify/swap_request', async (req, res) => {
        const id = req.fields.id;
        const address = req.fields.address;
        const amount = req.fields.amount;

        if (id === null || !address || amount === null) {
            responseInvalid(res);
            return;
        }

        const gameBackendVerification = await gameAPI.verifySwapRequest(
            address,
            amount
        );

        if (gameBackendVerification.result === CONST.RET_CODE.SUCCESS) {
            const backendSign = soliditySha3(
                gameBackendVerification.data.verification_token,
                soliditySha3(config.backendKey)
            );

            response(
                {
                    result: true,
                    data: {
                        verification_token: backendSign,
                    },
                },
                res
            );
        } else {
            response(
                {
                    result: false,
                    msg: gameBackendVerification.msg,
                },
                res
            );
        }
    });

    app.post('/sync/txs', async (req, res) => {
        const gameId = req.fields.game_id;
        const index = req.fields.index;
        const count = parseInt(req.fields.count, 10);

        if (!gameId || !count) {
            response(
                {
                    result: CONST.GAME_RET_CODE.INVALID_PARAMETERS,
                    msg: 'Validation failed.',
                },
                res
            );
            return;
        }

        const txs = await databaseManager.getTxs(gameId, index, count);
        if (txs) {
            response(
                {
                    result: CONST.GAME_RET_CODE.SUCCESS,
                    data: txs,
                },
                res
            );
        } else {
            response(
                {
                    result: CONST.GAME_RET_CODE.FAILED,
                    msg: 'Internal Error',
                },
                res
            );
        }
    });
}
module.exports = registerAPIs;
