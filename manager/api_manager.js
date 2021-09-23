const config = require("../common/config");
var database_manager = require("./database_manager");
const mv = require('mv');
const { database } = require("../common/database");

function register_apis(app) {
    app.post ("/stuff/all", async(req, res) => {
        var stuffs = await database_manager.get_stuff(null);
        
        for(var i = 0; i < stuffs.length; i ++) {
            var stuff = stuffs[i];
            var discussions = await database_manager.get_discussion(stuff.id, 0, 3);
            stuffs[i].discussions = discussions;
        }

        var ret = {
            result: true,
            data: stuffs
        };

        response(ret, res);
    });

    app.post("/stuff", async(req, res) => {
        var id = req.fields.id;

        var stuff = await database_manager.get_stuff(id);

        var ret = {
            result: true,
            data: stuff
        };

        response (ret, res);
    });

    app.post("/discussion/all/", async(req, res) => {
        var id = req.fields.id;
        var limit = req.fields.limit;
        var cnt = req.fields.cnt;

        var discussions = await database_manager.get_discussion(id, limit, cnt);

        var ret = {
            result: true,
            data: discussions
        };

        response (ret, res);
    });
    
    app.post("/discussion", async(req, res) => {
        var id = req.fields.id;

        var discussion = await database_manager.get_discussion_by_id(id);

        if (discussion != null) {
            var comments = await database_manager.get_comment(id);
            
            for (var i = comments.length - 1; i >= 0; i --) {
                var comment = comments[i];
                if (comment.parent_id == -1) {
                    continue;
                }
                for (var j = i - 1 ; j >= 0 ; j --) {
                    if (comments[j].id == comment.parent_id) {
                        if (!('reply' in comments[j])) {
                            comments[j].reply = new Array();
                        } 
                        comments[j].reply.unshift(comment);
                        break;
                    }
                }
                comments.pop();
            }

            discussion.comments = comments;
        }

        var ret = {
            result: true,
            data: discussion
        };

        response (ret, res);
    });

    app.post("/discussion/new", async(req, res) => {
        var stuff_id = req.fields.stuff_id;
        var content = req.fields.content;
        var user_type = req.fields.user_type;
        var user = req.fields.user;

        if (!isValidDiscussionParams({
            stuff_id: stuff_id,
            content: content,
            user_type: user_type,
            user: user
        })) {
            var ret = {
                result: false,
                msg: 'validation failed!'
            };
            response(ret, res);
            return;
        }

        var result = await database_manager.add_discussion(stuff_id, content, user_type, user);

        var ret = {
            result: true,
            data: result
        };

        response (ret, res);
    });

    app.post("/discussion/new", async(req, res) => {
        var stuff_id = req.fields.stuff_id;
        var content = req.fields.content;
        var user_type = req.fields.user_type;
        var user = req.fields.user;

        if (!isValidDiscussionParams({
            stuff_id: stuff_id,
            content: content,
            user_type: user_type,
            user: user
        })) {
            var ret = {
                result: false,
                msg: 'validation failed!'
            };
            response(ret, res);
            return;
        }

        var result = await database_manager.add_discussion(stuff_id, content, user_type, user);

        var ret = {
            result: true,
            data: result
        };

        response (ret, res);
    });

    app.post("/comment/new", async(req, res) => {
        var discussion_id = req.fields.discussion_id;
        var parent_id = req.fields.parent_id;
        var content = req.fields.content;
        var user_type = req.fields.user_type;
        var user = req.fields.user;

        if (!isValidCommentParams({
            discussion_id: discussion_id,
            parent_id: parent_id,
            content: content,
            user_type: user_type,
            user: user
        })) {
            var ret = {
                result: false,
                msg: 'validation failed!'
            };
            response(ret, res);
            return;
        }

        var result = await database_manager.add_comment(discussion_id, parent_id, content, user_type, user);

        var ret = {
            result: true,
            data: result
        };

        response (ret, res);
    });
}

function response(ret, res) {
    res.setHeader('content-type', 'text/plain');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200);
    res.json(ret);
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