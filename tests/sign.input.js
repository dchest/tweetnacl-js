// Testing with data/sign.input.gz taken from
// http://ed25519.cr.yp.to/python/sign.input

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

var gzdata = fs.readFileSync('data/sign.input.gz');
zlib.gunzip(gzdata, function(err, data) {
  if (err) throw err;
  var lines = data.toString().split('\n');
  for (var i = 0; i < lines.length; i++) {
    if (lines[i].length == 0) break;
    var vals = lines[i].split(':');
    var sk = new Uint8Array((new Buffer(vals[0], 'hex')).toJSON());
    var pk = new Uint8Array((new Buffer(vals[1], 'hex')).toJSON());
    var msg = new Uint8Array((new Buffer(vals[2], 'hex')).toJSON());
    var sig = new Uint8Array((new Buffer(vals[3], 'hex')).toJSON()).subarray(0, nacl.sign.signatureLength);

    var gotsig = nacl.sign(msg, sk);
    if (!bytesEqual(gotsig, sig)) {
      console.error(i + ': signatures differ:', '\nNeed:', nacl.util.encodeBase64(sig), '\nGot :', nacl.util.encodeBase64(gotsig));
      process.exit(1);
    }

    if (nacl.sign.open(msg, gotsig, pk) === false) {
      console.error(i + ': failed to open signed message');
      process.exit(1);
    }
    process.stdout.write('.');
  }
  console.log('OK (' + i + ' items)');
});
