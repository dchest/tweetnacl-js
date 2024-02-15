import * as nacl from '../nacl.js'
import test from 'tape'
import util from 'tweetnacl-util'

import randomVectors from './data/hash.random.js';

var enc = util.encodeBase64,
    dec = util.decodeBase64;

test('nacl.hash random test vectors', function(t) {
  randomVectors.forEach(function(vec) {
    var msg = dec(vec[0]);
    var goodHash = dec(vec[1]);
    var hash = nacl.hash(msg);
    t.equal(enc(hash), enc(goodHash));
  });
  t.end();
});
