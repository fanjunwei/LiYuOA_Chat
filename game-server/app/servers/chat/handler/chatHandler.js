var chatRemote = require('../remote/chatRemote');

module.exports = function(app) {
	return new Handler(app);
};

var Handler = function(app) {
	this.app = app;
};

var handler = Handler.prototype;

/**
 * Send messages to users
 *
 * @param {Object} msg message from client
 * @param {Object} session
 * @param  {Function} next next stemp callback
 *
 */
handler.send = function(msg, session, next) {
    var oid = msg.o;
    var type = msg.c;
    var fid = msg.f;
    var to = msg.t;


    var channelService = this.app.get('channelService');
    var param = {
        route: 'onChat',
        msg: msg
    };
    channel = channelService.getChannel(oid, false);

    //the target is all users
    if(!!channel) {
        if(to){
            tuid = [];
            for(var i=0;i<app.get('clientType');i++){
                var r = channel.getMember(to+'*'+app.get('clientType')[i]);
                if(r){
                    tuid.push(r);
                }
            }
            channelService.pushMessageByUids(param, tuid);
        }else{
            channel.pushMessage(param);
        }

    }

    next(null, {
        code:200
    });
};