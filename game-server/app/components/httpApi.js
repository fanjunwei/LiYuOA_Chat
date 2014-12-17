// components/HttpApi.js
module.exports = function(app, opts) {
    return new HttpApi(app, opts);
};
var express = require('express');

var userDao = require('../dao/userDao');

//
//httpservice.configure(function(){
//    httpservice.use(express.methodOverride());
//    httpservice.use(express.bodyParser());
//    httpservice.use(httpservice.router);
//    httpservice.set('view engine', 'jade');
//    httpservice.set('views', __dirname + '/public');
//    httpservice.set('view options', {layout: false});
//    httpservice.set('basepath',__dirname + '/public');
//});

//httpservice.configure('development', function(){
//    httpservice.use(express.static(__dirname + '/public'));
//    httpservice.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
//});
//
//httpservice.configure('production', function(){
//    var oneYear = 31557600000;
//    httpservice.use(express.static(__dirname + '/public', { maxAge: oneYear }));
//    httpservice.use(express.errorHandler());
//});
//
//console.log("Web server has started.\nPlease log on http://127.0.0.1:3001/index.html");
//httpservice.listen(3001);
var PORT = 3001;
var HttpApi = function(app, opts) {
    this.app = app;
    this.port = opts.port | PORT;
};

HttpApi.name = '__HttpApi__';

HttpApi.prototype.start = function(cb) {
    console.log('HttpApi Start');
    var self = this;
    var httpapi = express.createServer();
    httpapi.use(express.bodyParser());

    // url路由
    httpapi.post('/:url', function(req, res){
        var url = req.params.url;

//        console.error("http api"+url+":"+JSON.stringify(req.body));
        var channelService = self.app.get('channelService');
        if(req.body.channel){
            var _id=parseInt(Date.now()/1000,10)+req.body.id;
            var msg={_id:_id, channel:req.body.channel,te:req.body.message,d:req.body.d,type:url,do:req.body.do};
            if(req.body.pid){
                var pids=req.body.pid.split(',');
                var pidarr=[];
                for(var o=0;o<pids.length;o++){
                    pidarr.push(parseInt(pids[o]));
                }
                msg['to']=pidarr;
            }

            var param = {
                route: 'sys',
                msg: msg
            };
            userDao.insertChat(msg,null);
            userDao.findOrCreateUsersByOrg(msg.channel,function(err,users){
                if(err){
                    res.send("false");
                    return;
                }
                if(msg.channel&&msg.to){
                    if(msg.do=='join'){
                        for(var k=0;k<msg.to.length;k++){
                            userDao.joinChanel(msg.channel,msg.to[k]);
                        }
                    }
                    if(msg.do=='remove'){
                        for(var k=0;k<msg.to.length;k++){
                            userDao.quiteChanel(msg.channel,msg.to[k],function(err0,num0){
                            });
                        }
                    }
//                userDao.printChannelUsers(msg.channel);
                }
                channelService.pushMessageByUids(param, users);
                if(msg.to){
                    userDao.findUsersByUsername(msg.to,function(err,users){
                        if(err){
                            res.send("false");
                            return;
                        }
                        channelService.pushMessageByUids(param, users);
                        res.send("true");
                    });
                }else{
                    res.send("true");
                }
            });
        }
        if(req.body.notifydict){
            // 对个人发出的 notify 无需保存的
            userDao.findOnlineByPids(req.body.notifydict.pids,function(err,users){
                if(err){
                    res.send("false");
                    return;
                }
                for (var i = 0; i < users.length; i++) {
                    channelService.pushMessageByUids({ route: 'sys', msg: req.body.notifydict.notifys[users[i].pid]}, [{uid: users[i]._id, sid: users[i].sid}]);
                }

                res.send("true");
            });
        }


//
//        self.app.rpc.chat.chatRemote.sendSys(oid,oid,{"o":oid,"t":person,"msg":message,"type":url},function(error){
//            if(error){
//                res.send("false");
//            }else{
//                res.send("true");
//            }
//        })

    });

    httpapi.listen(this.port);

    process.nextTick(cb);
}

HttpApi.prototype.afterStart = function (cb) {
    console.log('HttpApi afterStart');
    process.nextTick(cb);
}

HttpApi.prototype.stop = function(force, cb) {
    console.log('HttpApi stop');
    process.nextTick(cb);
}