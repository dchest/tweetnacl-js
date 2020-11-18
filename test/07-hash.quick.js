var nacl = await import('tweetnacl/' + (process.env.NACL_SRC || 'nacl.js'));
nacl = nacl.default;
import test from 'tap-esm';
import util from 'tweetnacl-util';
nacl.util = util;

import specVectors from './data/hash.spec.js';

var enc = nacl.util.encodeBase64;

test('nacl.hash length', function(t) {
  t.equal(nacl.hash(new Uint8Array(0)).length, 64);
  t.equal(nacl.hash(new Uint8Array(100)).length, 64);
  t.end();
});

test('nacl.hash exceptions for bad types', function(t) {
  t.throws(function() { nacl.hash('string'); }, TypeError, 'should throw TypeError for string type');
  t.throws(function() { nacl.hash([1,2,3]); }, TypeError, 'should throw TypeError for array type');
  t.end();
});

test('nacl.hash specified test vectors', function(t) {
  specVectors.forEach(function(vec) {
    var goodHash = new Uint8Array(vec[0]);
    var msg = new Uint8Array(vec[1]);
    var hash = nacl.hash(msg);
    t.equal(enc(hash), enc(goodHash));
  });
  t.end();
});
