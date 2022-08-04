var nacl = (typeof window !== 'undefined') ? window.nacl : require('../' + (process.env.NACL_SRC || 'nacl.min.js'));
var test = require('tape');

var nonce = new Uint8Array(nacl.secretbox.nonceLength);
var key = new Uint8Array(nacl.secretbox.keyLength);
var msg = new Uint8Array(10);

var str = '12345';

test('input type check', function(t) {
  t.throws(function() { nacl.secretbox(str, nonce, key); }, TypeError);
  t.throws(function() { nacl.secretbox(msg, str, key); }, TypeError);
  t.throws(function() { nacl.secretbox(msg, nonce, str); }, TypeError);

  t.throws(function() { nacl.secretbox.open(str, nonce, key); }, TypeError);
  t.throws(function() { nacl.secretbox.open(msg, str, key); }, TypeError);
  t.throws(function() { nacl.secretbox.open(msg, nonce, str); }, TypeError);

  t.throws(function() { nacl.scalarMult(str, key); }, TypeError);
  t.throws(function() { nacl.scalarMult(key, str); }, TypeError);

  t.throws(function() { nacl.scalarMult.base(str); }, TypeError);

  t.throws(function() { nacl.box(str, nonce, key, key); }, TypeError);
  t.throws(function() { nacl.box(msg, str, key, key); }, TypeError);
  t.throws(function() { nacl.box(msg, nonce, str, key); }, TypeError);
  t.throws(function() { nacl.box(msg, nonce, key, str); }, TypeError);

  t.throws(function() { nacl.box.open(str, nonce, key, key); }, TypeError);
  t.throws(function() { nacl.box.open(msg, str, key, key); }, TypeError);
  t.throws(function() { nacl.box.open(msg, nonce, str, key); }, TypeError);
  t.throws(function() { nacl.box.open(msg, nonce, key, str); }, TypeError);

  t.throws(function() { nacl.box.before(str, key); }, TypeError);
  t.throws(function() { nacl.box.before(key, str); }, TypeError);

  t.throws(function() { nacl.box.after(str, nonce, key); }, TypeError);
  t.throws(function() { nacl.box.after(msg, str, key); }, TypeError);
  t.throws(function() { nacl.box.after(msg, nonce, str); }, TypeError);

  t.throws(function() { nacl.box.open.after(str, nonce, key); }, TypeError);
  t.throws(function() { nacl.box.open.after(msg, str, key); }, TypeError);
  t.throws(function() { nacl.box.open.after(msg, nonce, str); }, TypeError);

  t.throws(function() { nacl.box.keyPair.fromSecretKey(str); }, TypeError);

  t.throws(function() { nacl.sign(str, key); }, TypeError);
  t.throws(function() { nacl.sign(msg, str); }, TypeError);

  t.throws(function() { nacl.sign.open(str, key); }, TypeError);
  t.throws(function() { nacl.sign.open(msg, str); }, TypeError);

  t.throws(function() { nacl.sign.detached(str, key); }, TypeError);
  t.throws(function() { nacl.sign.detached(msg, str); }, TypeError);

  t.throws(function() { nacl.sign.detached.verify(str, key, key); }, TypeError);
  t.throws(function() { nacl.sign.detached.verify(msg, str, key); }, TypeError);
  t.throws(function() { nacl.sign.detached.verify(msg, key, str); }, TypeError);

  t.throws(function() { nacl.sign.keyPair.fromSecretKey(str); }, TypeError);
  t.throws(function() { nacl.sign.keyPair.fromSeed(str); }, TypeError);

  t.throws(function() { nacl.hash(str); }, TypeError);

  t.throws(function() { nacl.verify(str, msg); }, TypeError);
  t.throws(function() { nacl.verify(msg, str); }, TypeError);

  t.end();
});

