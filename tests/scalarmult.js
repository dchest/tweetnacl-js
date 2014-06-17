var NUMBER_OF_TESTS = 1000;

var nacl = require('../nacl.js');
var execFile = require('child_process').execFile;

function cscalarmult(n, p, callback) {
  var hexN = (new Buffer(n)).toString('hex');
  var hexP = (new Buffer(p)).toString('hex');

  execFile('./cscalarmult', [hexN, hexP], function(err, stdout) {
    if (err) throw err;
    callback(stdout.toString('utf8'));
  });
}

function check(i) {
  var sk1 = [], pk1 = [], sk2 = [], pk2 = [], q = [];
  nacl.lowlevel.crypto_box_keypair(pk1, sk1);
  nacl.lowlevel.crypto_box_keypair(pk2, sk2);

  //console.log("\nTest #" + i);
  nacl.lowlevel.crypto_scalarmult(q, sk1, pk2);
  hexQ = (new Buffer(q)).toString('hex');
  cscalarmult(sk1, pk2, function(cQ) {
    if (hexQ != cQ) {
      console.error("! bad result\nJS: ", hexQ, "\nC : ", cQ);
      process.exit(1);
    } else {
      //console.log("OK");
      process.stdout.write('.');
    }
    if (i == NUMBER_OF_TESTS) { return; }
    check(i+1);
  });
}

console.log("scalarmult test");
check(0);
