import * as nacl from '../nacl.js'
import test from 'tape'
import util from 'tweetnacl-util'

import specVectors from './data/onetimeauth.spec.js'

var enc = util.encodeBase64;

test('nacl.lowlevel.crypto_onetimeauth specified vectors', function(t) {
  var out = new Uint8Array(16);
  specVectors.forEach(function(v) {
    nacl.lowlevel.crypto_onetimeauth(out, 0, v.m, 0, v.m.length, v.k);
    t.equal(enc(out), enc(v.out));
  });
  t.end();
});
