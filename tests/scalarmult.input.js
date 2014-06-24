// Testing with data/scalarmult.input.gz.
// Generated randomly by this Go program:
// https://gist.github.com/dchest/226c207b62c6b9c144b6

var nacl = require('../nacl.min.js');
var zlib = require('zlib');
var fs = require('fs');

function bytesEqual(a, b) {
  if (a.length !== b.length) return false;
  for (var i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

var gzdata = fs.readFileSync('data/scalarmult.input.gz');
zlib.gunzip(gzdata, function(err, data) {
  if (err) throw err;
  var lines = data.toString().split('\n');
  for (var i = 0; i < lines.length; i++) {
    if (lines[i].length == 0) break;
    var vals = lines[i].split(':');
    var pk1 = new Uint8Array((new Buffer(vals[0], 'hex')).toJSON());
    var sk1 = new Uint8Array((new Buffer(vals[1], 'hex')).toJSON());
    var pk2 = new Uint8Array((new Buffer(vals[2], 'hex')).toJSON());
    var sk2 = new Uint8Array((new Buffer(vals[3], 'hex')).toJSON());
    var res = new Uint8Array((new Buffer(vals[4], 'hex')).toJSON());

    var jpk1 = new Uint8Array(32);
    nacl.lowlevel.crypto_scalarmult_base(jpk1, sk1);
    if (!bytesEqual(jpk1, pk1)) {
      console.log(i + ': pk1 differ: \nneed:', nacl.util.encodeBase64(pk1), '\ngot: ', nacl.util.encodeBase64(jpk1));
      process.exit(1);
    }

    var jpk2 = new Uint8Array(32);
    nacl.lowlevel.crypto_scalarmult_base(jpk2, sk2);
    if (!bytesEqual(jpk2, pk2)) {
      console.log(i + ': pk2 differ: \nneed:', nacl.util.encodeBase64(pk2), '\ngot: ', nacl.util.encodeBase64(jpk2));
      process.exit(1);
    }

    var jres1 = new Uint8Array(32);
    nacl.lowlevel.crypto_scalarmult(jres1, sk1, pk2);
    if (!bytesEqual(jres1, res)) {
      console.log(i + ': res1 differ: \nneed:', nacl.util.encodebase64(res), '\ngot: ', nacl.util.encodebase64(jres1));
      process.exit(1);
    }

    var jres2 = new Uint8Array(32);
    nacl.lowlevel.crypto_scalarmult(jres2, sk2, pk1);
    if (!bytesEqual(jres2, res)) {
      console.log(i + ': res2 differ: \nneed:', nacl.util.encodebase64(res), '\ngot: ', nacl.util.encodebase64(jres2));
      process.exit(1);
    }

    process.stdout.write('.');
  }
  console.log('OK (' + i + ' items)');
});
