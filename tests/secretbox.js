var nacl = require('../nacl.js');
var crypto = require('crypto');
var spawn = require('child_process').spawn;

function csecretbox(msg, n, k, callback) {
  var hexk = (new Buffer(k)).toString('hex');
  var hexn = (new Buffer(n)).toString('hex');
  var p = spawn('./csecretbox', [hexk, hexn]);
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

function check(i, maxi, n, k, next) {
  var msg = crypto.randomBytes(i).toString('hex').substr(0,i);
  console.log("\nTest #" + i + " (Message length: " + msg.length + ")");
  var box = nacl.secretbox.seal(msg, n, k);
  csecretbox(msg, n, k, function(boxFromC) {
    if (boxFromC != box) {
      bc = (new Buffer(boxFromC, 'base64')).toString('hex');
      bj = (new Buffer(box, 'base64')).toString('hex');
      console.error("! secretboxes don't match\nJS: ", bj, "\nC : ", bc);
      process.exit(1);
    } else {
      console.log("OK");
    }
    if (nacl.secretbox.open(boxFromC, n, k) === false) {
      console.log("! opening secretbox failed: ", boxFromC);
      process.exit(1);
    }
    if (i >= maxi) {
      if (next) next();
      return;
    }
    check(i+1, maxi, n, k, next);
  });
}

var k = [], n = [], i;
for (i = 0; i < 32; i++) k[i] = i;
for (i = 0; i < 24; i++) n[i] = i;
check(0, 1024, n, k, function() {  // I'm sorry...
  check(16418, 16500, n, k, function() {
    check(1000000, 0, n, k);
  });
});
