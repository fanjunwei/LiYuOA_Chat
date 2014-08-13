// components/HelloWorld.js
module.exports = function(app, opts) {
    return new Crossdomain(app, opts);
};
var net = require("net");

var domains = ["*:*"]; // domain:port list
/*
 <site-control permitted-cross-domain-policies="all" />
 <allow-access-from domain="*.zxxsbook.com" to-ports="3000,8800"  />
 <allow-http-request-headers-from domain="*.zxxsbook.com" headers="*"/>
 <allow-access-from domain="192.168.101.16"  to-ports="3000,8800"  />
 <allow-http-request-headers-from domain="192.168.101.18" headers="*"/>
 */
/*
 var xml = '<?xml version="1.0"?>\n<!DOCTYPE cross-domain-policy SYSTEM \n"http://www.adobe.com/xml/dtds/cross-domain-policy.dtd">\n<cross-domain-policy>\n';
 xml += '<site-control permitted-cross-domain-policies="master-only"/>\n';
 xml += '<allow-access-from domain="*" to-ports="*"/>\n';
 xml += '</cross-domain-policy>\n';
 */
var xml = '<?xml version="1.0"?>\n<!DOCTYPE cross-domain-policy SYSTEM \n"http://www.adobe.com/xml/dtds/cross-domain-policy.dtd">\n<cross-domain-policy>\n';
xml += '<site-control permitted-cross-domain-policies="master-only" />\n';
xml += '<allow-access-from domain="*" to-ports="3000-8800"  />\n';
xml += '<allow-access-from domain="192.168.101.16"  to-ports="3000-8800"  />\n';
xml += '</cross-domain-policy>\n';



var DEFAULT_INTERVAL = 3000;

var Crossdomain = function(app, opts) {
    this.app = app;
    this.interval = opts.interval | DEFAULT_INTERVAL;
    this.netserver = null;
};

Crossdomain.name = '__Crossdomain__';

Crossdomain.prototype.start = function(cb) {
    console.log('Hello World Start');
//    var self = this;
//    this.timerId = setInterval(function() {
//        console.log(self.app.getServerId() + ": Hello World!");
//    }, this.interval);
    this.netserver = net.createServer(function(socket){
        socket.addListener("error",function(err){
            socket.end && socket.end() || socket.destroy && socket.destroy();
        });

        if(socket && socket.readyState == 'open'){
            socket.write(xml);
            socket.end();
        }
    });
    this.netserver.addListener("error",function(err){console.log(err)});

    this.netserver.listen(3843);

    console.log("Flash policy server has started.\nPlease see on http://127.0.0.1:3843/");

    process.nextTick(cb);
}

Crossdomain.prototype.afterStart = function (cb) {
    console.log('Hello World afterStart');
    process.nextTick(cb);
}

Crossdomain.prototype.stop = function(force, cb) {
    console.log('Hello World stop');
    process.nextTick(cb);
}