/**
 * Created by WangJian on 2014/8/19.
 */
//var logger = require('pomelo-logger').getLogger('pomelo', __filename);
var pomelo = require('pomelo');
//var async = require('async');
var utils = require('../util/utils');
var mongodb = require("mongodb");
var userDao = module.exports;

userDao.onlineUser = function(pid,uid,sid,cb){
    pomelo.app.get("dbclient").do(function(db,cleanUp){
//        db.collection("Users").remove(function(err,res){
//            console.error(res);
//        });
//        db.collection("Channel").remove(function(){
//
//        });
        db.collection("Users").update({_id:uid}, {$set:{sid:sid,online:true}}, {safe:true},function(err,res){
            if(res==0){
                db.collection("Users").insert({pid:pid,_id:uid,sid:sid,online:true},{safe:true},function(err,res){
                    console.error(res);
                    cleanUp();
                    utils.invokeCallback(cb, err, null);
                });
            }else{
                cleanUp();
                utils.invokeCallback(cb, err, null);
            }
        });

    });
}

userDao.offlineUser = function(uid,cb){
    pomelo.app.get("dbclient").do(function(db,cleanUp){
        db.collection("Users").update({_id:uid}, {$set:{online:false}}, {safe:true},function(err,res){
            console.error(err);
            console.error(res);
            cleanUp();
        });

        utils.invokeCallback(cb, null, null);
    });
}

userDao.joinChanel = function(channel,pid){
    pomelo.app.get("dbclient").do(function(db,cleanUp){
        db.collection("Channel").update({_id:channel},{$push:{"users":{pid:pid,timeline:parseInt(Date.now()/1000,10)}}},{safe:true},function(err,num){
            if(num==0){
                db.collection("Channel").insert({_id:channel,users:[{pid:pid,timeline:parseInt(Date.now()/1000,10)}]},{safe:true},function(err,res){
                    if(err){
                        console.error(res);
                    }

                    cleanUp();
                })
            }else{
                cleanUp();
            }
        })
    });
}


userDao.quiteChanel = function(channel,pid,uinfo){
    pomelo.app.get("dbclient").do(function(db,cleanUp){
        if(uinfo){
            db.collection("Channel").update({_id:channel,"users.pid":pid},{$pop:{"users":uinfo}},{safe:true},function(err,num){
                if(num==0){
                    console.error("remove _id:"+num);
                }
                cleanUp();
            });
        }else{
            db.collection("Channel").findOne({_id:channel,"users.pid":pid},function(err,org){
                if(org){
                    for(var i=0;i<org.users.length;i++){
                        if(pid==org.users[i].pid){
                            db.collection("Channel").update({_id:channel,"users.pid":pid},{$pop:{"users":org.users[i]}},{safe:true},function(err,num){
                                if(num==0){
                                    console.error("remove _id:"+num);
                                }
                                cleanUp();
                            });
                            break;
                        }
                    }
                }else{
                    cleanUp();
                }
            });
        }

    });
}

userDao.addListenOrg = function(pid,channels,cb){
    pomelo.app.get("dbclient").do(function(db,cleanUp){
        db.collection("Channel").find({_id:{$regex:/^d.*/i},"users.pid":pid}).toArray(function(err,res){
            cleanUp();
            utils.invokeCallback(cb, err,null);
            if(!err&&channels.length!=res.length){
                var f=true;
                for(var i=0;i<channels.length;i++){
                    f=true;
                    for(var j=0;j<res.length;j++){
                        if(res[j]._id==channels[i]){
                            f=false;
                            break;
                        }
                    }
                    if(f){
                        userDao.joinChanel(channels[i],pid);
                    }
                }
                var fl=true;
                for(var k=0;k<res.length;k++) {
                    if(res[k]._id.substr(0,1)!="d"){
                        continue;
                    }
                    fl = true;
                    for (var l = 0; l < channels.length; l++) {
                        if (res[k]._id == channels[l]) {
                            fl = false;
                            break;
                        }
                    }
                    if(fl){
//                        console.error(res[k]._id);
                        for(var m=0;m<res[k].users.length;m++){
                            if(res[k].users[m].pid==pid){
                                userDao.quiteChanel(res[k]._id,pid,res[k].users[m]);
                            }

                        }

                    }
                }

            }


        })

//        db.collection("Channel").remove({username:username,_id:{$regex:/^d.*/i}}, {safe:true},function(err,res){
//            for(var i=0;i<channels.length;i++){
//                var channel=channels[i];
//                db.collection("Channel").insert({username:username,_id:channel}, {safe:true},function(err,res){
//                    console.error(err);
//                    console.error(res);
//                });
//            }
//            utils.invokeCallback(cb, err);
//        })
        cleanUp();
    });
}

userDao.createOrg = function(pids,channel,name,cb){
    pomelo.app.get("dbclient").do(function(db,cleanUp){
        db.collection("Channel").findOne({_id:channel},function(err,org){

            if(!org){
                var users=[];
                var d=parseInt(Date.now()/1000,10);
                for(var i=0;i<pids.length;i++){
                    users.push({pid:pids[i],timeline:d})
                }
                db.collection("Channel").insert({users:users,name:name,_id:channel},{safe:true},function(err,res){
                    cleanUp();
                })
            }else{
                cleanUp();
            }
            utils.invokeCallback(cb, err);

        })


    });
}


userDao.addPidToOrg = function(pid,channel,name,cb){
    pomelo.app.get("dbclient").do(function(db,cleanUp){
        db.collection("Channel").findOne({_id:channel,"users.pid":pid},function(err,org){
            if(!org){
                db.collection("Channel").update({_id:channel},{$push:{"users":{pid:pid,timeline:parseInt(Date.now()/1000,10)}}},{safe:true},function(err,res){
                    cleanUp();
                })
            }else{
                cleanUp();
            }
            utils.invokeCallback(cb, err);

        })


    });
}

//userDao.removeListenOrg = function(username,channels,cb){
//    pomelo.app.get("dbclient").do(function(db,cleanUp){
//        db.collection("Channel").remove({username:username,_id:{$in:channels}}, {safe:true},function(err,res){
//            console.error(err);
//            console.error(res);
//        })
//        cleanUp();
//        utils.invokeCallback(cb, null);
//    });
//}

//{
//    _id:"d3",
//    users:[
//    {username:1,timeline:timeline},
//    {username:2,timeline:timeline},
//            ]
//}

userDao.findChannelByUser = function(pid,cb){
    pomelo.app.get("dbclient").do(function(db,cleanUp){
        db.collection("Channel").find({"users.pid":pid}).toArray(function(err,channels){
            if(channels){
                var usernames = [];
                for(var i=0;i<channels.length;i++){
                    for(var j=0;j<channels[i].users.length;j++){
                        if(channels[i].users[j].pid==pid){
                            usernames.push({channel:channels[i]._id,timeline:channels[i].users[j].timeline,name:channels[i].name,members:channels});
                            break;
                        }
                    }
                }
            }
            cleanUp();
            utils.invokeCallback(cb, err,usernames);
        })
    });
}

userDao.findOnlineByUsername = function(users,cb){
    pomelo.app.get("dbclient").do(function(db,cleanUp) {
        var usernames=[];
        for(var i=0;i<users.length;i++){
            usernames.push(users[i].pid);
        }
        db.collection("Users").find({pid: {$in: usernames}, online: true}, {_id: 1, sid: 1}).toArray(function (err, users) {
            var onlines = [];
            if (users) {
                for (var i = 0; i < users.length; i++) {
                    onlines.push({uid: users[i]._id, sid: users[i].sid});
                }
            }

            utils.invokeCallback(cb, err, onlines);
            cleanUp();
        });
    });
}

userDao.findOrCreateUsersByOrg = function(channel,cb){
    pomelo.app.get("dbclient").do(function(db,cleanUp){
        db.collection("Channel").findOne({_id:channel},function(err,org) {
            if (!org) {
                db.collection("Channel").insert({_id: channel, users: []}, {safe: true},function(err,res){
                    cleanUp();
                    utils.invokeCallback(cb, err, []);
                    return;
                });

            }else{
                cleanUp();
                if(org&&org.users.length==0){
                    utils.invokeCallback(cb, err,[]);
                    return;
                }
                userDao.findOnlineByUsername(org.users,function(err,onlines){
                    utils.invokeCallback(cb, err, onlines);
                })
            }
        })
    });
}

userDao.findUsersByOrg = function(channel,cb){
    pomelo.app.get("dbclient").do(function(db,cleanUp){
        db.collection("Channel").findOne({_id:channel},function(err,org){
            cleanUp();
            if(org&&org.users.length==0){
                utils.invokeCallback(cb, err,[]);
                return;
            }
            userDao.findOnlineByUsername(org.users,function(err,onlines){
                utils.invokeCallback(cb, err, onlines);
            })
        })
    });
}

userDao.findUsersByUid = function(uid,cb){
    pomelo.app.get("dbclient").do(function(db,cleanUp){
        db.collection("Users").findOne({_id:uid,online:true},{_id:1,sid:1},function(err,user){
            var onlines = [];
            if(user){
                onlines.push({uid:user._id,sid:user.sid});
            }
            cleanUp();
            utils.invokeCallback(cb, err,onlines);
        });
    });
}

userDao.findUsersByUsername = function(pids,cb){
    pomelo.app.get("dbclient").do(function(db,cleanUp){
        db.collection("Users").find({pid:{$in:pids},online:true},{_id:1,sid:1}).toArray(function(err,users){
            var onlines = [];
            for(var i=0;i<users.length;i++){
                onlines.push({uid:users[i]._id,sid:users[i].sid});
            }
            cleanUp();
            utils.invokeCallback(cb, err,onlines);
        });
    });
}

userDao.insertChat = function(chat,cb){
    pomelo.app.get("dbclient").do(function(db,cleanUp){
        db.collection("Chat").insert(chat,function(err,res){
            console.error(err);
            console.error(res);
            cleanUp();
        });

        utils.invokeCallback(cb, null);
    });
}

userDao.queryChatByOrg = function(channel,timeline,cb){
    pomelo.app.get("dbclient").do(function(db,cleanUp){
        if(timeline==null){
//            timeline = parseInt(Date.now()/1000,10);
            timeline = String(parseInt(Date.now()/1000,10));
        }
        timeline = timeline.substr(0,10);
//        timeline = parseInt(timeline);

        db.collection("Chat").find({_id:{$lt:timeline},channel:channel},{sort:{"_id":-1},limit:30}).toArray(function(err,chats){
            cleanUp();
            if(chats){
                chats.reverse();
            }
            utils.invokeCallback(cb, err,chats);
        })
    });
}
//
//userDao.getUserInfo = function (username, cb) {
//    pomelo.app.get('dbclient').do(function(db, cleanUp){
//        db.collection('Users').findOne({userName:username}, function(err, res){
//            utils.invokeCallback(cb, err, res);
//            cleanUp();
//        });
//    });
//};
//userDao.getAllCardsInfo = function (cb) {
//    pomelo.app.get('dbclient').do(function (db, cleanUp) {
//        db.collection('Cards').find({}, {_id: 0}).toArray(function (err, res) {
//            if (!!err) {
//                utils.invokeCallback(cb, err);
//            }
//            else {
//                utils.invokeCallback(cb, null, res);
//            }
//            cleanUp();
//        });
//    });
//}
//userDao.getCardGrowthInfo = function (cb) {
//    pomelo.app.get('dbclient').do(function (db, cleanUp) {
//        db.collection('CardGrowth').find({}, {_id: 0}).toArray(function (err, res) {
//            if (!!err) {
//                utils.invokeCallback(cb, err);
//            }
//            else {
//                utils.invokeCallback(cb, null, res);
//            }
//            cleanUp();
//        });
//    });
//}
//userDao.Login = function (un, pwd, callback) {
//    var dbc = pomelo.app.get('dbclient');
//    var uid, auth;
//    dbc.do(function(db, cleanUp){
//        var oluCol = db.collection('OnlineUsers');
//        async.waterfall([
//            function(cb) {
//                db.collection('Users').findOne({userName:un, password:pwd}, {_id:0, uid:1, authority:1}, cb);
//            },
//            function(res, cb) {
//                if (null != res) {
//                    uid = res._id;
//                    auth = res.authority;
//                    oluCol.insert({uid: uid, state: 0}, cb);
//                }
//                else {
//                    cb(new Error('Wrong username or password!'));
//                }
//            }
//        ], function(err) {
//            if (!!err) {
//                utils.invokeCallback(callback, null, Code.FAIL);
//            }
//            else{
//                utils.invokeCallback(callback, null, Code.OK, uid, auth);
//            }
//            cleanUp();
//        });
//    });
//};
//userDao.logout = function (uid, callback) {
//    var dbc = pomelo.app.get('dbclient');
//    var uid, auth;
//    dbc.do(function(db, cleanUp){
//        db.collection('OnlineUsers').remove({uid: uid}, function(err){
//            utils.invokeCallback(callback, err);
//            cleanUp();
//        });
//    });
//};
//userDao.getPlayerInfo = function (uid, callback) {
//    var dbc = pomelo.app.get('dbclient');
//    dbc.do(function(db, cleanUp){
//        var pcol = db.collection('Players');
//        pcol.insert({uid:uid, nickName:"", level:1, money:0, formationId:0, maxCardId:0}, function(err, res){
//            pcol.findOne({uid:uid}, {_id:0}, function(err, player){
//                if (!!err){
//                    utils.invokeCallback(callback, err);
//                }
//                else {
//                    utils.invokeCallback(callback, null, Code.OK, player);
//                }
//                cleanUp();
//            });
//        });
//    });
//}
//userDao.kickAllUser = function (cb) {
//    pomelo.app.get('dbclient').do(function(db, cleanUp){
//        db.collection('OnlineUsers').remove({}, function(err){
//            utils.invokeCallback(cb, err);
//            cleanUp();
//        });
//    });
//};
////获取上场球员属性
//userDao.getCardsOnDuty = function(uid, callback) {
//    var dbc = pomelo.app.get('dbclient');
//    dbc.do(function(db, cleanUp){
//        db.collection('Players').aggregate([
//            {$unwind: "$cards"},
//            {$match:{uid:uid}},
//            {$project:{_id:0, cards:1}},
//            {$sort:{'cards.formationPos':1}},
//            {$limit:11}
//        ], function(err,result){
//            if (!!err) {
//                console.error(err);
//                utils.invokeCallback(callback, err);
//            }
//            else {
//                var cards = [];
//                var idx = 0;
//                for (var card in result) {
//                    var c = result[card].cards;
//                    if (c.formationPos == idx) {
//                        cards.push(c);
//                    }
//                    else {
//                        break;
//                    }
//                    idx++;
//                }
//                if (cards.length != 11)
//                {
//                    utils.invokeCallback(callback, new Error('The number of cards on duty mast be 11'));
//                    cleanUp();
//                    return;
//                }
//                var calcCards = [];
//                for (idx = 0; idx < 11; ++idx) {
//                    var c = cards[idx];
//                    var data = SD.calcCards(c.pcId, c.cid, c.level, c.formationPos);
//                    if (null == data) {
//                        utils.invokeCallback(callback, new Error('Fail to calc card properties!'));
//                        cleanUp();
//                        return;
//                    }
//                    calcCards.push(data);
//                }
//                utils.invokeCallback(callback, null, calcCards);
//            }
//            cleanUp();
//        });
//    });
//}