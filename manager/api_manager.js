const config = require('../common/config');
const database_manager = require('./database_manager');
const mv = require('mv');
const Unrar = require('unrar');
const yauzl = require('yauzl');

function register_apis(app) {
    app.post('/stuff/all', async (req, res) => {
        let stuffs = await database_manager.get_stuff(null);

        for (let i = 0; i < stuffs.length; i++) {
            const stuff = stuffs[i];
            const discussions = await database_manager.get_discussion(
                stuff.id,
                0,
                5
            );
            for (let j = 0; j < discussions.length; j++) {
                const likes_count = await database_manager.get_likes_count(
                    discussions[j].id,
                    -1
                );
                discussions[j].likes = likes_count;
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
        const keyword = req.fields.keyword;
        let stuffs = await database_manager.get_stuff(null);

        for (let i = 0; i < stuffs.length; i++) {
            const stuff = stuffs[i];
            const discussions = await database_manager.get_discussion_by_keyword(
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
        const id = req.fields.id;

        const stuff = await database_manager.get_stuff(id);

        const ret = {
            result: true,
            data: stuff,
        };

        response(ret, res);
    });

    app.post('/discussion/all/', async (req, res) => {
        const id = req.fields.id;
        const limit = req.fields.limit;
        const cnt = req.fields.cnt;

        let discussions = await database_manager.get_discussion(id, limit, cnt);
        for (let i = 0; i < discussions.length; i++) {
            const likes_count = await database_manager.get_likes_count(
                discussions[i].id,
                -1
            );
            discussions[i].likes = likes_count;
        }

        const total = await database_manager.get_discussion_cnt(id);

        const ret = {
            result: true,
            data: discussions,
            total: total,
        };

        response(ret, res);
    });

    app.post('/discussion', async (req, res) => {
        const id = req.fields.id;
        const account = req.fields.account;
        const limit = req.fields.limit;
        const cnt = req.fields.cnt;
        let total = 0;

        let discussion = await database_manager.get_discussion_by_id(id);
        const likes_count = await database_manager.get_likes_count(
            discussion.id,
            -1
        );
        discussion.likes = likes_count;

        let is_hot = true;
        const discussions = await database_manager.get_discussion(
            discussion.stuff_id,
            0,
            30
        );
        for (let i = 0; i < discussions.length; i++) {
            const likes = await database_manager.get_likes_count(
                discussions[i].id,
                -1
            );

            if (likes > likes_count) {
                is_hot = false;
                break;
            }
        }
        discussion.is_hot = is_hot;

        if (discussion != null) {
            let comments = await database_manager.get_comment(id);

            for (let i = comments.length - 1; i >= 0; i--) {
                const likes_count = await database_manager.get_likes_count(
                    comments[i].discussion_id,
                    comments[i].id
                );
                comments[i].likes = likes_count;

                if (account != '' && account != undefined) {
                    comments[i].user_like = await database_manager.get_likes(
                        comments[i].discussion_id,
                        comments[i].id,
                        account
                    );
                }

                const comment = comments[i];
                if (comment.parent_id == -1) {
                    continue;
                }
                for (let j = i - 1; j >= 0; j--) {
                    if (comments[j].id == comment.parent_id) {
                        if (!('reply' in comments[j])) {
                            comments[j].reply = new Array();
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
            total: total,
        };

        response(ret, res);
    });

    app.post('/discussion/new', async (req, res) => {
        const stuff_id = req.fields.stuff_id;
        const content = req.fields.content;
        const user_type = req.fields.user_type;
        const user = req.fields.user;

        if (
            !isValidDiscussionParams({
                stuff_id: stuff_id,
                content: content,
                user_type: user_type,
                user: user,
            })
        ) {
            response_invalid(res);
            return;
        }

        const result = await database_manager.add_discussion(
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
        const id = req.fields.id;

        let result = await database_manager.get_comment_by_id(id);

        const likes_count = await database_manager.get_likes_count(
            result.discussion_id,
            result.id
        );
        result.likes = likes_count;

        const ret = {
            result: true,
            data: result,
        };

        response(ret, res);
    });

    app.post('/comment/new', async (req, res) => {
        const discussion_id = req.fields.discussion_id;
        const parent_id = req.fields.parent_id;
        const content = req.fields.content;
        const user_type = req.fields.user_type;
        const user = req.fields.user;

        if (
            !isValidCommentParams({
                discussion_id: discussion_id,
                parent_id: parent_id,
                content: content,
                user_type: user_type,
                user: user,
            })
        ) {
            response_invalid(res);
            return;
        }

        const result = await database_manager.add_comment(
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
        const result = await database_manager.get_games();

        const ret = {
            result: true,
            data: result,
        };

        response(ret, res);
    });

    app.post('/set_likes', async (req, res) => {
        const discussion_id = req.fields.discussion_id;
        const parent_id = req.fields.parent_id;
        const user = req.fields.user;
        const likesOrUnlikes = req.fields.likes;
        let result = {};
        if (likesOrUnlikes == true) {
            result = await database_manager.insert_likes(
                discussion_id,
                parent_id,
                user
            );
        } else {
            result = await database_manager.delete_likes(
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
        const discussion_id = req.fields.discussion_id;
        const parent_id = req.fields.parent_id;
        const user = req.fields.user;

        const result = await database_manager.get_likes(
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
        const result = await database_manager.get_categories();

        const ret = {
            result: true,
            data: result,
        };

        response(ret, res);
    });

    app.post('/get_items_by_address', async (req, res) => {
        const address = req.fields.address;
        const sort_type = req.fields.sort;
        const limit = req.fields.limit;
        const cnt = req.fields.cnt;

        if (
            address == null ||
            address == '' ||
            sort_type == null ||
            limit == null ||
            cnt == null
        ) {
            response_invalid(res);
            return;
        }

        const result = await database_manager.get_items_by_address(
            address,
            sort_type,
            limit,
            cnt
        );
        const total = await database_manager.get_items_by_address_cnt(address);

        const ret = {
            result: true,
            data: result,
            total: total,
        };

        response(ret, res);
    });

    app.post('/get_market_items', async (req, res) => {
        const game = req.fields.game;
        const category = req.fields.category;
        const sort_type = req.fields.sort;
        const limit = req.fields.limit;
        const cnt = req.fields.cnt;

        if (
            game == null ||
            category == null ||
            sort_type == null ||
            limit == null ||
            cnt == null
        ) {
            response_invalid(res);
            return;
        }

        const result = await database_manager.get_market_items(
            game,
            category,
            sort_type,
            limit,
            cnt
        );
        const total = await database_manager.get_market_items_cnt(game, category);
        const ret = {
            result: true,
            data: result,
            total: total,
        };

        response(ret, res);
    });

    app.post('/get_item_by_id', async (req, res) => {
        const id = req.fields.id;

        if (id == null) {
            response_invalid(res);
            return;
        }

        const result = await database_manager.get_token_by_id(id);

        const ret = {
            result: result != null,
            data: result,
        };

        response(ret, res);
    });

    app.post('/update_item_by_id', async (req, res) => {
        const id = req.fields.id;
        const game_id = req.fields.game_id;
        const category_id = req.fields.category_id;
        const name = req.fields.name;
        const is_anonymous = req.fields.is_anonymous;
        const description = req.fields.description;
        const price = req.fields.price;

        if (id == null) {
            response_invalid(res);
            return;
        }

        const result = await database_manager.update_token_by_id(
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
            response_invalid(res);
            return;
        }

        const result = await database_manager.get_token_by_tokenid(id);

        const ret = {
            result: result != null,
            data: result,
        };

        response(ret, res);
    });

    app.post('/upload_material', async (req, res) => {
        const files = req.files;
        if (files.myFile == null) {
            response({ result: false }, res);
            return;
        }

        if (
            files.myFile.name.slice(
                files.myFile.name.length - 4,
                files.myFile.name.length
            ) != '.rar' &&
            files.myFile.name.slice(
                files.myFile.name.length - 4,
                files.myFile.name.length
            ) != '.zip'
        ) {
            response({ result: false }, res);
            return;
        }

        const oldpath = files.myFile.path;
        const newpath = config.material_path + files.myFile.name;
        mv(oldpath, newpath, async function (err) {
            if (err) {
                console.log(err);
                response({ result: false }, res);
                return;
            }

            if (newpath.slice(newpath.length - 4, newpath.length) == '.rar') {
                const archive = new Unrar(newpath);

                archive.list(function (err, entries) {
                    for (let i = 0; i < entries.length; i++) {
                        const name = entries[i].name;
                        const type = entries[i].type;
                        if (type == 'File' && name == 'thumbnail.png') {
                            const stream = archive.stream('thumbnail.png'); // name of entry
                            stream.on('error', () => {
                                response({ result: false });
                            });
                            stream.pipe(
                                require('fs').createWriteStream(
                                    config.thumbnail_path +
                                        files.myFile.name.slice(
                                            0,
                                            files.myFile.name.length - 4
                                        ) +
                                        '.png'
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
                    return;
                });
            } else if (
                newpath.slice(newpath.length - 4, newpath.length) == '.zip'
            ) {
                yauzl.open(newpath, { lazyEntries: true }, (err, zipfile) => {
                    if (err) {
                        response({ result: false }, res);
                        return;
                    }

                    let exist_thumbnail = false;
                    zipfile.readEntry();
                    zipfile.on('entry', (entry) => {
                        if (entry.fileName == 'thumbnail.png') {
                            zipfile.openReadStream(entry, (err, readStream) => {
                                if (err) {
                                    response({ result: false }, res);
                                    return;
                                }

                                readStream.on('end', () => {
                                    zipfile.readEntry();
                                });
                                readStream.pipe(
                                    require('fs').createWriteStream(
                                        config.thumbnail_path +
                                            files.myFile.name.slice(
                                                0,
                                                files.myFile.name.length - 4
                                            ) +
                                            '.png'
                                    )
                                );
                                exist_thumbnail = true;
                            });
                        } else {
                            zipfile.readEntry();
                        }
                    });
                    zipfile.once('end', () => {
                        zipfile.close();

                        if (exist_thumbnail) {
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
                });
            }
        });
    });
}

function response(ret, res) {
    res.setHeader('content-type', 'text/plain');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200);
    res.json(ret);
}

function response_invalid(res) {
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
    if (params.content == null || params.content == '') {
        return false;
    }
    if (params.user_type != 0 && params.user_type != 1) {
        return false;
    }
    if (params.user_type == 0 && (params.user == null || params.user == '')) {
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

    if (params.content == null || params.content == '') {
        return false;
    }
    if (params.user_type != 0 && params.user_type != 1) {
        return false;
    }
    if (params.user_type == 0 && (params.user == null || params.user == '')) {
        return false;
    }

    return true;
}

module.exports = register_apis;
