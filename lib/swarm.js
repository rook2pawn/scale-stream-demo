var async = require('async');
var request = require('request');

var Readable = require('stream').Readable;

// data is a hash so as data updates we are essentially passing by reference
var swarm = function(url,K) {
  this.url = url;
  this.clientstreams = {};

  // K = number of connected clients
  this.K = K;
  this.data = {};
  this.update = function(id,val) {
    var key = 'client_'+id;
    if (this.data[key] === undefined) {
      this.data[key] = [];
    }
    this.data[key].push(val);
    if (this.data[key].length > 10000) {
      this.data[key] = this.data[key].slice(5000);
    }
  }

  this.start = function(k) {
    var i = 0;
    var numclients = k || this.K;
    var that = this;
    async.until(function() {
      i++;
      return (i > numclients);
    }, function(cb) {
      var rs = Readable();
      rs._read = function() {
        //var num = ~~(Math.random()*10000)
        var str = (Math.random()*1e64).toString(36);
        rs.push(str);
      }
      console.log("setting clientstream " + i);
      that.clientstreams['stream_'+i] = rs;
      cb();
    }, function() {

      console.log("All done" + i);
      i = 0;
      async.until(function() {
        i++;
        return (i > numclients) 
      }, function(cb) {
        console.log("piping on " + i);
        that.clientstreams['stream_'+i].pipe(request.post(url+i))
        cb();
      }, function() {
        console.log("Finished setting ", i, " request streams");
      })
    });
  }
  this.stop = function(){
    Object.keys(this.clientstreams).forEach(function(key) {
      this.clientstreams[key].push(null);
    },this)
  }

  this.subscribe = function(hash) {    
    var that = this;
    setInterval(function() {
      Object.keys(hash).forEach(function(id) {
        var c = hash[id];
        c.eventstream.write(JSON.stringify({action:'update',payload:that.data}));
      }); 
    },2000)    
  }
}

module.exports = exports = swarm;