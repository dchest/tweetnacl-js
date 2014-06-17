var nacl = require('../nacl.js');
var crypto = require('crypto');
var spawn = require('child_process').spawn;

function chash(msg, callback) {
  var p = spawn('./chash');
  var result = [];
  p.stdout.on('data', function(data) {
    result.push(data);
  });
  p.on('close', function(code) {
    return callback(Buffer.concat(result).toString('utf8'));
  });
  p.on('error', function(err) {
    throw err;
  });
  p.stdin.write(msg);
  p.stdin.end();
}

function check(i) {
  var msg = nacl.randomBytes(i);
  var h = [];
  //console.log("\nTest #" + i + " (Message length: " + msg.length + ")");
  nacl.lowlevel.crypto_hash(h, msg, msg.length);
  chash(new Buffer(msg), function(hexCH) {
    hexH = (new Buffer(h)).toString('hex');
    if (hexCH != hexH) {
      console.error("! hashes don't match\nJS: ", hexH, "\nC : ", hexCH);
      process.exit(1);
    } else {
      process.stdout.write('.');
    }
    if (i == 1000) { return; }
    check(i+1);
  });
}

check(0);
