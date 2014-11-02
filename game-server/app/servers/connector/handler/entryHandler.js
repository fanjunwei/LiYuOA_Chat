module.exports = function(app) {
	return new Handler(app);
};

var Handler = function(app) {
		this.app = app;
};

var handler = Handler.prototype;
var userDao = require('../../../dao/userDao');
var mongodb = require("mongodb");
//
//var Db = require('mongodb').Db;
//var Server = require('mongodb').Server;
///*数据库连接信息host,port,user,pwd*/
//var db_name = 'DaPCQtSLxVnyKsocjgkm';                  // 数据库名，从云平台获取
//var db_host =  '192.168.101.4';      // 数据库地址
//var db_port =  '27017';   // 数据库端口
//var username = '';                 // 用户名（API KEY）
//var password = '';                 // 密码(Secret KEY)

//var db = new Db(db_name, new Server(db_host, db_port, {}), {w: 1});

/**
 * New client entry chat server.
 *
 * @param  {Object}   msg     request message
 * @param  {Object}   session current session object
 * @param  {Function} next    next stemp callback
 * @return {Void}
 */
handler.enter = function(msg, session, next) {
	var self = this;
	var type = msg.type;
	var oid = msg.oid;
	var uid = msg.pid + '*' + type
	var sessionService = self.app.get('sessionService');

    if(!session.uid&&sessionService.getByUid(uid)){
        userDao.findUsersByUid(uid,function(err,users){
            var channelService = self.app.get('channelService');
            var param = {
                route: 'loginOther',
                msg: {message:'你的账号已经在别处登录。如果不是本人的操作，请重新登录，修改密码。'}
            };
            channelService.pushMessageByUids(param, users);
            sessionService.kick(uid);
            //
            session.bind(uid);
            session.on('closed', onUserLeave.bind(null, self.app));
            userDao.findChannelByUser(msg.pid,function(err1,users){
                next(null,{
                    channels:users
                });
            })
            userDao.joinChanel(oid,msg.pid);
            userDao.onlineUser(msg.pid,uid,self.app.get("serverId"),function(err2,res){

            });

        })
    }else{
        session.bind(uid);
        session.on('closed', onUserLeave.bind(null, self.app));
        userDao.findChannelByUser(msg.pid,function(err,users){
            next(null,{
                channels:users
            });
        })
        userDao.joinChanel(oid,msg.pid);
        userDao.onlineUser(msg.pid,uid,self.app.get("serverId"),function(err,res){

        });

    }
};


/**
 * New client entry chat server.
 *
 * @param  {Object}   msg     request message
 * @param  {Object}   session current session object
 * @param  {Function} next    next stemp callback
 * @return {Void}
 */
handler.listenOrg = function(msg, session, next) {

//    var self = this;
    var dids = msg.dids;
//    var sessionService = self.app.get('sessionService');

//    session.set('dids', dids);
//    session.push('dids', function(err) {
//        if(err) {
//            console.error('set rid for session service failed! error is : %j', err.stack);
//        }
//    });
    userDao.addListenOrg(parseInt(session.uid.split("*")[0]),dids,function(err,res){
        if(err){
            next(null,{
                code:500
            })
            return;
        }
        next(null,{
            code:200
        });
    });
//    for(var i=0;i<dids.length;i++) {
//        //put user into channel
//        self.app.rpc.chat.chatRemote.add(dids[i], session.uid, self.app.get('serverId'), dids[i], true, null);
//    }

};


/**
 * New client entry chat server.
 *
 * @param  {Object}   msg     request message
 * @param  {Object}   session current session object
 * @param  {Function} next    next stemp callback
 * @return {Void}
 */
handler.createChannel = function(msg, session, next) {
    var channelService = this.app.get('channelService');
    userDao.createOrg(msg.users,msg.channel,msg.name,msg.author,msg,function(err, route, org, users){
        if(err){
            next(null,{
                code:500
            })
            return;
        }
        if(!err&&org){
            if(msg['v']==undefined){
                userDao.findOnlineByUsername(users,function(err2,onlines){
                    var param = {
                        route: route,
                        group:org
                    };
                    channelService.pushMessageByUids(param, onlines);
                });
            }

            next(null,{
                code:200,
                needupdate:false
            });
        }else{
            next(null,{
                code:200,
                needupdate:true
            });
        }

    });
};


handler.quiteChannel = function(msg, session, next) {
    var channelService = this.app.get('channelService');
    userDao.quiteChanel(msg.channel,msg.pid,function(err, num){
        if(err){
            next(null,{
                code:500
            })
            return;
        }
        if(!err&&num>0){
            var users=[];
            users.push({pid:msg.pid})
            userDao.findOnlineByUsername(users,function(err2,onlines){
                var param = {
                    route: 'removeChannel',
                    channel:msg.channel
                };
                channelService.pushMessageByUids(param, onlines);
            })
            userDao.findUsersByOrg(msg.channel,function(err3,onlines){
                var param2 = {
                    route: 'quiteChannel',
                    pid:msg.pid,
                    channel:msg.channel
                };
                channelService.pushMessageByUids(param2, onlines);
            })
        }
        next(null,{
            code:200
        });
    });
};


handler.joinChannel = function(msg, session, next) {
    var channelService = this.app.get('channelService');
    userDao.joinChanel(msg.channel,msg.pid,function(err, res){
        if(err){
            next(null,{
                code:500
            })
            return;
        }
        if(!err&&res){
            userDao.findUsersByOrg(msg.channel,function(err3,onlines){
                var param2 = {
                    route: 'joinChannel',
                    pid:msg.pid,
                    channel:msg.channel
                };
                channelService.pushMessageByUids(param2, onlines);
            })
        }
        next(null,{
            code:200
        });
    });
};

/**
 * User log out handler
 *
 * @param {Object} app current application
 * @param {Object} session current session object
 *
 */
var onUserLeave = function(app, session) {
	if(!session || !session.uid) {
		return;
	}
    userDao.offlineUser(session.uid,null);



//	app.rpc.chat.chatRemote.kick(session.get('oid'), session.uid, app.get('serverId'), session.get('oid'), null);
//    var dids = session.get('dids');
//    for(var i=0;i<dids.length;i++){
//        //put user into channel
//        app.rpc.chat.chatRemote.kick(dids[i], session.uid, app.get('serverId'), dids[i], null);
//    }
};

handler.unreadcount = function(msg, session, next){
    var channelService = this.app.get('channelService');
    var self=this;
    var num=msg.channels.length;
    for(var i=0;i<msg.channels.length;i++){
        userDao.countByTimeline(msg.channels[i].channel,msg.channels[i].timeline,function(err,channel,count){
            num-=1;
            var param = {
                route: 'channelCount',
                channel: channel,
                num:num,
                count:count
            };
            channelService.pushMessageByUids(param, [{uid:session.uid,sid:self.app.get("serverId")}]);
        });
    }
    next(null,{
        code:200
    });
}


handler.updatetimeline = function(msg, session, next){

    userDao.updateTimeline(msg.channel,msg.pid);
    next(null,{
        code:200
    });
}

handler.send = function(msg, session, next) {
    var channel = msg.channel;
//    var type = msg.c;
//    var fid = msg.f;
//    var to = msg.t;
    msg._id=parseInt(Date.now()/1000,10)+msg.id;
    delete msg.id;
    delete msg.__route__;


    var channelService = this.app.get('channelService');
    var param = {
        route: 'onChat',
        msg: msg
    };
//    console.error(msg);
//    channel = channelService.getChannel(oid, false);
    userDao.insertChat(msg,null);
//    if(to){
//        userDao.findUsersByUsername([to],function(err,users){
//            if(err){
//                next(null,{
//                    code:500
//                })
//                return;
//            }
//            channelService.pushMessageByUids(param, users);
//            next(null, {
//                code:200
//            });
//        })
//    }else{
        userDao.findUsersByOrg(channel,function(err,users){
            if(err){
                next(null,{
                    code:500
                })
                return;
            }
            channelService.pushMessageByUids(param, users);
            next(null, {
                code:200
            });
        })
//    }
//    //the target is all users
//    if(!!channel) {
//        if(to){
//            tuid = [];
//            for(var i=0;i<app.get('clientType');i++){
//                var r = channel.getMember(to+'*'+app.get('clientType')[i]);
//                if(r){
//                    tuid.push(r);
//                }
//            }
//            channelService.pushMessageByUids(param, tuid);
//        }else{
//            channel.pushMessage(param);
//        }
//
//    }


};


handler.history = function(msg, session, next) {
    var channel = msg.channel;
    var id = msg.id;

//    console.error(msg);
    userDao.queryChatByOrg(channel,id,function(err,chats){
        if(err){
            next(null,{
                code:500
            })
            return;
        }
        next(null, {
            code:200,
            chats:chats
        });
    })
};