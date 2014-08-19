module.exports = function(app) {
	return new Handler(app);
};

var Handler = function(app) {
		this.app = app;
};

var handler = Handler.prototype;
var userDao = require('../../../dao/userDao');
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
        sessionService.kick(uid);
    }

	//duplicate log in
	if( !! sessionService.getByUid(uid)) {
		next(null, {
			code: 500,
			error: true,
            message:'用户已登陆'
		});
		return;
	}

	session.bind(uid);
//	session.set('oid', oid);
//	session.push('oid', function(err) {
//		if(err) {
//			console.error('set rid for session service failed! error is : %j', err.stack);
//		}
//	});
	session.on('closed', onUserLeave.bind(null, self.app));

    userDao.onlineUser(msg.pid,uid,self.app.get("serverId"),function(err,res){
        userDao.findUsersByOrg(oid,function(err,users){
            u=[];
            if(users){
                for(var i=0;i<users.length;i++){
                    u.push(users[i].uid);
                }
            }
            next(null, {
                users:u
            });
        })
    })
	//put user into channel
//	self.app.rpc.chat.chatRemote.add(oid, uid, self.app.get('serverId'), oid, true, function(users){
//		next(null, {
//			users:users
//		});
//	});
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

    var self = this;
    var dids = msg.dids;
//    var sessionService = self.app.get('sessionService');

//    session.set('dids', dids);
//    session.push('dids', function(err) {
//        if(err) {
//            console.error('set rid for session service failed! error is : %j', err.stack);
//        }
//    });
    userDao.addListenOrg(session.uid.split("*")[0],dids,null);
//    for(var i=0;i<dids.length;i++) {
//        //put user into channel
//        self.app.rpc.chat.chatRemote.add(dids[i], session.uid, self.app.get('serverId'), dids[i], true, null);
//    }
    next(null,{
        code:200
    })
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


handler.send = function(msg, session, next) {
    var channel = msg.channel;
    var type = msg.c;
    var fid = msg.f;
    var to = msg.t;


    var channelService = this.app.get('channelService');
    var param = {
        route: 'onChat',
        msg: msg
    };
//    channel = channelService.getChannel(oid, false);
    userDao.insertChat(msg,null);
    if(to){
        userDao.findUsersByUsername(to,function(err,users){
            channelService.pushMessageByUids(param, users);
        })
    }else{
        userDao.findUsersByOrg(channel,function(err,users){
            channelService.pushMessageByUids(param, users);
        })
    }
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

    next(null, {
        code:200
    });
};