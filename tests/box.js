var nacl = require('../nacl.js');
var crypto = require('crypto');
var spawn = require('child_process').spawn;

function cbox(msg, sk, pk, n, callback) {
  var hexsk = (new Buffer(sk)).toString('hex');
  var hexpk = (new Buffer(pk)).toString('hex');
  var hexn = (new Buffer(n)).toString('hex');
  var p = spawn('./cbox', [hexsk, hexpk, hexn]);
  var result = [];
  p.stdout.on('data', function(data) {
    result.push(data);
  });
  p.on('close', function(code) {
    return callback(Buffer.concat(result).toString('base64'));
  });
  p.on('error', function(err) {
    throw err;
  });
  p.stdin.write(msg);
  p.stdin.end();
}

function check(i, maxi, pk, sk, next) {
  var msg = crypto.randomBytes(i).toString('base64').substr(0,i);
  var nonce = crypto.randomBytes(24);
  console.log("\nTest #" + i + " (Message length: " + msg.length + ")");
  var box = nacl.box.seal(msg, nonce, pk, sk);
  cbox(msg, sk, pk, nonce, function(boxFromC) {
    if (boxFromC != box) {
      console.error("! boxes don't match\nJS: ", box, "\nC : ", boxFromC);
      process.exit(1);
    } else {
      console.log("OK");
    }
    if (nacl.box.open(boxFromC, nonce, pk, sk) === false) {
      console.log("! opening box failed: ", boxFromC);
      process.exit(1);
    }
    if (i >= maxi) {
      if (next) next();
      return;
    }
    check(i+1, maxi, pk, sk, next);
  });
}

var sk1 = [], pk1 = [], sk2 = [], pk2 = [], q = [];
nacl.crypto_box_keypair(pk1, sk1);
nacl.crypto_box_keypair(pk2, sk2);
check(0, 1024, pk1, sk2, function() {
  check(16417, 16500, pk1, sk2);
});
