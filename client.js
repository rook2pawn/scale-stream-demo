var shoe = require('shoe');
var through2 = require('through2');
var dnode = require('dnode')
var MuxDemux = require('mux-demux');
var ee = require('events').EventEmitter;
var mdm = MuxDemux()

var incoming = new ee;

incoming.on('update',function(obj) {
  //console.log("Got update:", obj);
  var throughput = {};
  Object.keys(obj).forEach(function(key) {
    var list = obj[key];
    var last = list[list.length-1];
    var first = list[0];
    var delta = last.timestamp - first.timestamp;
    var bytes = list.reduce(function(acc,val) {
      return acc + val.length;
    },0)

    var megabits = bytes / 125000;
    //console.log("Megabits:", megabits, " delta:", delta, " first:", first.timestamp, " last:", last.timestamp, " length:", list.length);
    var rate = megabits / (delta/1000);
    throughput[key] = rate;
  })
  var os = '';
  Object.keys(throughput).forEach(function(key) {
    os += "<div>".concat(key).concat(":").concat(throughput[key].toFixed(3)).concat(" Mbit/s").concat("</div>")
  })
  $('div#throughput').html(os);
})

var remote;

var d = dnode();
d.on('remote', function (_remote) {
  remote = _remote;
});

d.on('end',function() {
})

$(window).ready(function() {  
  var stream = shoe('/stream');
  mdm.on('connection',function(_stream) {
    switch (_stream.meta) {
      case 'dnode' :
        d.pipe(_stream).pipe(d);
      break;
      case 'events' :
        _stream.pipe(through2(function(chunk,enc,cb) {
          var obj = JSON.parse(chunk.toString())
          incoming.emit(obj.action, obj.payload)
          cb()
        })) 
      break;
      default:
      break;
    }
  })
  stream.pipe(mdm).pipe(stream)
})

$(window).ready(function() {
  $('input#stop').click(function(e) {
    $('input#start').prop('disabled', false);
    $('input#stop').prop('disabled',true);
    remote.stop();
  })
  $('input#start').click(function(e) {
    $('input#start').prop('disabled', true);
    $('input#stop').prop('disabled',false);
    var k = parseInt($('input#numclients').val());
    remote.start(k);
  })
})
