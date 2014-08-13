module.exports = function(app) {
	return new Handler(app);
};

var Handler = function(app) {
		this.app = app;
};

var handler = Handler.prototype;

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
	session.set('oid', oid);
	session.push('oid', function(err) {
		if(err) {
			console.error('set rid for session service failed! error is : %j', err.stack);
		}
	});
	session.on('closed', onUserLeave.bind(null, self.app));

	//put user into channel
	self.app.rpc.chat.chatRemote.add(oid, uid, self.app.get('serverId'), oid, true, function(users){
		next(null, {
			users:users
		});
	});
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
    var sessionService = self.app.get('sessionService');

    session.set('dids', dids);
    session.push('dids', function(err) {
        if(err) {
            console.error('set rid for session service failed! error is : %j', err.stack);
        }
    });
    for(var i=0;i<dids.length;i++) {
        //put user into channel
        self.app.rpc.chat.chatRemote.add(dids[i], session.uid, self.app.get('serverId'), dids[i], true, null);
    }
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
	app.rpc.chat.chatRemote.kick(session.get('oid'), session.uid, app.get('serverId'), session.get('oid'), null);
    var dids = session.get('dids');
    for(var i=0;i<dids.length;i++){
        //put user into channel
        app.rpc.chat.chatRemote.kick(dids[i], session.uid, app.get('serverId'), dids[i], null);
    }
};