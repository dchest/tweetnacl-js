var nacl = await import('tweetnacl/' + (process.env.NACL_SRC || 'nacl.js'));
nacl = nacl.default;
import test from 'tap-esm';
import util from 'tweetnacl-util';
nacl.util = util;

import randomVectors from './data/hash.random.js';

var enc = nacl.util.encodeBase64,
    dec = nacl.util.decodeBase64;

test('nacl.hash random test vectors', function(t) {
  randomVectors.forEach(function(vec) {
    var msg = dec(vec[0]);
    var goodHash = dec(vec[1]);
    var hash = nacl.hash(msg);
    t.equal(enc(hash), enc(goodHash));
  });
  t.end();
});
