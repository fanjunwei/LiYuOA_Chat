var pomelo = require('pomelo');
var routeUtil = require('./app/util/routeUtil');
/**
 * Init app for client.
 */
var app = pomelo.createApp();
app.set('clientType', ['flex','air','andro','iphon']);

// app.js
var crossdomain = require('./app/components/crossdomain');
var httpapi = require('./app/components/httpApi');


app.loadConfig('mongoDBConfig', app.getBase() + '/config/mongoDB.json');

// app configure
app.configure('production|development','connector', function() {
    // route configures
//    app.route('chat', routeUtil.chat);

    var dbclient = require('./app/dao/mongoDB/mongoDB').init(app);
    app.set('dbclient', dbclient);

    // filter configures
    app.filter(pomelo.timeout());
    app.set('connectorConfig', {
        connector : pomelo.connectors.hybridconnector,
        useDict : true,
        useProtobuf : true
    });

    app.set('errorHandler', function (err, msg, resp, session, next) {
        console.log(err, msg, resp, session);
        next();
    });
});



// app configure
app.configure('production|development','gate', function() {
    // route configures
//    app.route('chat', routeUtil.chat);
    var dbclient = require('./app/dao/mongoDB/mongoDB').init(app);
    app.set('dbclient', dbclient);
    // filter configures
    app.filter(pomelo.timeout());
    app.set('connectorConfig', {
        connector : pomelo.connectors.hybridconnector,
        useDict : true,
        useProtobuf : true
    });

    app.load(crossdomain, {interval: 5000});
    app.load(httpapi, {port: 3001});

    app.set('errorHandler', function (err, msg, resp, session, next) {
        console.log(err, msg, resp, session);
        next();
    });
});

// start app
app.start();

process.on('uncaughtException', function(err) {
    console.error(' Caught exception: ' + err.stack);
});
