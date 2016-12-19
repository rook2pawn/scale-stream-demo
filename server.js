var http = require('http');
var router = require('router-middleware');
var through2 = require('through2');
var path = require('path');
var shoe = require('shoe');
var MuxDemux = require('mux-demux');
var dnode = require('dnode');
var ecstatic = require('ecstatic')({root:path.join(__dirname,'web') });

// web server
var webapp = router();
var webclients = {};


var Swarm = require('./lib/swarm.js');
var swarm = new Swarm('http://localhost:5000/data/',1);
swarm.subscribe(webclients);
swarm.start();



var webserver = http.createServer(webapp);
webserver.listen(5555);
webapp.fileserver(ecstatic);
var sock = shoe(function (stream) {
  var id = stream.id;
  var mdm = MuxDemux();
  var ds = mdm.createStream('events');
  var dn = mdm.createStream('dnode');
  webclients[id] = {eventstream:ds,dnode:dn};
  var d = dnode({
    stop:function() {
      swarm.stop();
    },
    start:function(k) {
      swarm.start(k);
    }
  });
  d.pipe(dn).pipe(d);
  ds.pipe(through2(function(chunk,enc,cb) {
    var obj = JSON.parse(chunk.toString());
    incoming.emit(obj.action, obj.payload);
    cb();
  }));
  stream.pipe(mdm).pipe(stream);
  ds.on('end',function() {
  });
});
sock.install(webserver, '/stream');



// internal server
var app = router();
var server = http.createServer(app);
server.listen(5000);
console.log("internal server listening on 5000");

app.post('/data/:id',function(req,res,next) {
  var id = req.params.id;
  req.pipe(through2(function(chunk,enc,cb) {
    var obj= {length:chunk.length, timestamp:new Date().getTime()}
    swarm.update(id,obj);
//    console.log("\t CHUNK:", chunk.toString());
    cb();
  }))
});
