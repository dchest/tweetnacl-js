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
  var pk1 = nacl.util.decodeBase64('JRAWWRKVfZS2U/QiV+X2+PaabPfAB4H9p+BZkBN8ji8=');
  var sk1 = nacl.util.decodeBase64('5g1pBmI3HL5GAjtt3/2FZDQVfGSMNohngN7OVSizBVE=');
  var sk2 = new Uint8Array(nacl.box.secretKeyLength);
  var pk2 = new Uint8Array(nacl.box.publicKeyLength);
  var q1 = new Uint8Array(nacl.box.sharedKeyLength);
  var q2 = new Uint8Array(nacl.box.sharedKeyLength);
  nacl.lowlevel.crypto_box_keypair(pk2, sk2);

  //console.log('\nTest #' + i);
  nacl.lowlevel.crypto_scalarmult(q1, sk1, pk2);
  nacl.lowlevel.crypto_scalarmult(q2, sk2, pk1);
  for (var j = 0; j < q1.length; j++) {
    if (q1[j] != q2[j]) {
      console.error('shared keys differ:\n', (new Buffer(q1)).toString('hex'), '\n', (new Buffer(q2).toString('hex')));
      process.exit(1);
    }
  }
  hexQ = (new Buffer(q1)).toString('hex');
  cscalarmult(sk1, pk2, function(cQ) {
    if (hexQ != cQ) {
      console.error('! bad result\nJS: ', hexQ, '\nC : ', cQ);
      process.exit(1);
    } else {
      process.stdout.write('.');
    }
    if (i >= NUMBER_OF_TESTS) { return; }
    check(i+1);
  });
}

console.log('scalarmult test');
check(0);
