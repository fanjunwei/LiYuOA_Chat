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
var netserver = net.createServer(function(socket){
    socket.addListener("error",function(err){
      socket.end && socket.end() || socket.destroy && socket.destroy();
    });

    if(socket && socket.readyState == 'open'){
      socket.write(xml);
      socket.end(); 
    }
});
netserver.addListener("error",function(err){console.log(err)}); 
netserver.listen(3843);

console.log("Flash policy server has started.\nPlease see on http://127.0.0.1:3843/");