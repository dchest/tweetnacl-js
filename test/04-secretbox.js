var nacl = await import('tweetnacl/' + (process.env.NACL_SRC || 'nacl.js'));
nacl = nacl.default;
import test from 'tap-esm';
import util from 'tweetnacl-util';
nacl.util = util;

import randomVectors from './data/secretbox.random.js';

var enc = nacl.util.encodeBase64,
    dec = nacl.util.decodeBase64;

test('nacl.secretbox random test vectors', function(t) {
  randomVectors.forEach(function(vec) {
    var key = dec(vec[0]);
    var nonce = dec(vec[1]);
    var msg = dec(vec[2]);
    var goodBox = dec(vec[3]);
    var box = nacl.secretbox(msg, nonce, key);
    t.ok(box, 'box should be created');
    t.equal(enc(box), enc(goodBox));
    var openedBox = nacl.secretbox.open(goodBox, nonce, key);
    t.ok(openedBox, 'box should open');
    t.equal(enc(openedBox), enc(msg));
  });
  t.end();
});
