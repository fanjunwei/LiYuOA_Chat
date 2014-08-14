// components/HttpApi.js
module.exports = function(app, opts) {
    return new HttpApi(app, opts);
};
var express = require('express');

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
        var oid,did;
        if (req.body.did){
            oid=req.body.did;
        }else{
            oid=req.body.oid;
        }
        var person = req.body.pid;
        var message = req.body.message;
        console.error("http api"+url+":"+JSON.stringify(req.body));
        self.app.rpc.chat.chatRemote.sendSys(oid,oid,{"o":oid,"t":person,"msg":message,"type":url},function(error){
            if(error){
                res.send("false");
            }else{
                res.send("true");
            }
        })

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