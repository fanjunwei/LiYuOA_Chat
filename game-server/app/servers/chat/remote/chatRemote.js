module.exports = function(app) {
	return new ChatRemote(app);
};

var ChatRemote = function(app) {
	this.app = app;
	this.channelService = app.get('channelService');
};

/**
 * Add user into chat channel.
 *
 * @param {String} uid unique id for user
 * @param {String} sid server id
 * @param {String} name channel name
 * @param {boolean} flag channel parameter
 *
 */
ChatRemote.prototype.add = function(uid, sid, name, flag, cb) {
	var channel = this.channelService.getChannel(name, flag);
    if( !! channel) {
        var param = {
            route: 'pStatus',
            s:'on',
            p: uid
        };

        channel.add(uid, sid);
        if(typeof name == 'string'){
            channel.pushMessage(param);
            cb(this.get(name, flag));
        }
    }
    cb(null);


    console.error(typeof name);



};

/**
 * Get user from chat channel.
 *
 * @param {Object} opts parameters for request
 * @param {String} name channel name
 * @param {boolean} flag channel parameter
 * @return {Array} users uids in channel
 *
 */
ChatRemote.prototype.get = function(name, flag) {
	var users = [];
	var channel = this.channelService.getChannel(name, flag);
	if( !! channel) {
		users = channel.getMembers();
	}
//	for(var i = 0; i < users.length; i++) {
//		users[i] = users[i].split('*')[0];
//	}
	return users;
};

/**
 * Kick user out chat channel.
 *
 * @param {String} uid unique id for user
 * @param {String} sid server id
 * @param {String} name channel name
 *
 */
ChatRemote.prototype.kick = function(uid, sid, name,cb) {
	var channel = this.channelService.getChannel(name, false);

	// leave channel
	if( !! channel && channel.getMember(uid)) {
        channel.leave(uid, sid);
        if(typeof name == 'string'){
            var param = {
                route: 'pStatus',
                s:'off',
                p: uid
            };
            channel.pushMessage(param);
        }
	}
    cb(null);
};
