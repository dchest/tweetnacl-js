var NUMBER_OF_TESTS = 1000;

var nacl = await import('tweetnacl/' + (process.env.NACL_SRC || 'nacl.js'));
nacl = nacl.default;
import util from 'tweetnacl-util';
nacl.util = util;
import { execFile } from 'child_process';
import path from 'path';
import url from 'url';
import test from 'tap-esm';

var __dirname = path.dirname(url.fileURLToPath(import.meta.url));

function cscalarmult(n, p, callback) {
  var hexN = (Buffer.from(n)).toString('hex');
  var hexP = (Buffer.from(p)).toString('hex');

  execFile(path.resolve(__dirname, 'cscalarmult'), [hexN, hexP], function(err, stdout) {
    if (err) throw err;
    callback(stdout.toString('utf8'));
  });
}

test('nacl.scalarMult (C)', function(t) {
  var k1 = {
    publicKey: nacl.util.decodeBase64('JRAWWRKVfZS2U/QiV+X2+PaabPfAB4H9p+BZkBN8ji8='),
    secretKey: nacl.util.decodeBase64('5g1pBmI3HL5GAjtt3/2FZDQVfGSMNohngN7OVSizBVE=')
  };

  function check(num) {
    var k2 = nacl.box.keyPair();
    var q1 = nacl.scalarMult(k1.secretKey, k2.publicKey);
    var q2 = nacl.scalarMult(k2.secretKey, k1.publicKey);

    t.equal(nacl.util.encodeBase64(q1), nacl.util.encodeBase64(q2),
            'scalarMult results should be equal');

    var hexQ = (Buffer.from(q1)).toString('hex');
    cscalarmult(k1.secretKey, k2.publicKey, function(cQ) {
      t.equal(hexQ, cQ);
      if (num >= NUMBER_OF_TESTS) {
        t.end();
        return;
      }
      check(num+1);
    });
  }

  check(0);
});
