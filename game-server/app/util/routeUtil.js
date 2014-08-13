var exp = module.exports;
var dispatcher = require('./dispatcher');

exp.chat = function(session, msg, app, cb) {
	var chatServers = app.getServersByType('chat');

	if(!chatServers || chatServers.length === 0) {
		cb(new Error('can not find chat servers.'));
		return;
	}
    var res;
    if(typeof session == 'number' || typeof session == 'string' ){
        res = dispatcher.dispatch(session, chatServers);
    }else{
//        res = dispatcher.dispatch(session.get('rid'), chatServers);
//        var pamar=msg.args[0].body;
        res = dispatcher.dispatch(msg.args[0].body.o, chatServers);
    }


	cb(null, res.id);
};