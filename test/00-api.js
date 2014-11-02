var nacl = (typeof window !== 'undefined') ? window.nacl : require('../' + (process.env.NACL_SRC || 'nacl.min.js'));
var test = require('tape');

var nonce = new Uint8Array(nacl.secretbox.nonceLength);
var key = new Uint8Array(nacl.secretbox.keyLength);
var msg = new Uint8Array(10);

var arr = [1,2,3];

test('input type check', function(t) {
  t.throws(function() { nacl.secretbox(arr, nonce, key); }, TypeError);
  t.throws(function() { nacl.secretbox(msg, arr, key); }, TypeError);
  t.throws(function() { nacl.secretbox(msg, nonce, arr); }, TypeError);

  t.throws(function() { nacl.secretbox.open(arr, nonce, key); }, TypeError);
  t.throws(function() { nacl.secretbox.open(msg, arr, key); }, TypeError);
  t.throws(function() { nacl.secretbox.open(msg, nonce, arr); }, TypeError);

  t.throws(function() { nacl.scalarMult(arr, key); }, TypeError);
  t.throws(function() { nacl.scalarMult(key, arr); }, TypeError);

  t.throws(function() { nacl.scalarMult.base(arr); }, TypeError);

  t.throws(function() { nacl.box(arr, nonce, key, key); }, TypeError);
  t.throws(function() { nacl.box(msg, arr, key, key); }, TypeError);
  t.throws(function() { nacl.box(msg, nonce, arr, key); }, TypeError);
  t.throws(function() { nacl.box(msg, nonce, key, arr); }, TypeError);

  t.throws(function() { nacl.box.open(arr, nonce, key, key); }, TypeError);
  t.throws(function() { nacl.box.open(msg, arr, key, key); }, TypeError);
  t.throws(function() { nacl.box.open(msg, nonce, arr, key); }, TypeError);
  t.throws(function() { nacl.box.open(msg, nonce, key, arr); }, TypeError);

  t.throws(function() { nacl.box.before(arr, key); }, TypeError);
  t.throws(function() { nacl.box.before(key, arr); }, TypeError);

  t.throws(function() { nacl.box.after(arr, nonce, key); }, TypeError);
  t.throws(function() { nacl.box.after(msg, arr, key); }, TypeError);
  t.throws(function() { nacl.box.after(msg, nonce, arr); }, TypeError);

  t.throws(function() { nacl.box.open.after(arr, nonce, key); }, TypeError);
  t.throws(function() { nacl.box.open.after(msg, arr, key); }, TypeError);
  t.throws(function() { nacl.box.open.after(msg, nonce, arr); }, TypeError);

  t.throws(function() { nacl.box.keyPair.fromSecretKey(arr); }, TypeError);

  t.throws(function() { nacl.sign(arr, key); }, TypeError);
  t.throws(function() { nacl.sign(msg, arr); }, TypeError);

  t.throws(function() { nacl.sign.open(arr, key); }, TypeError);
  t.throws(function() { nacl.sign.open(msg, arr); }, TypeError);

  t.throws(function() { nacl.sign.detached(arr, key); }, TypeError);
  t.throws(function() { nacl.sign.detached(msg, arr); }, TypeError);

  t.throws(function() { nacl.sign.detached.verify(arr, key, key); }, TypeError);
  t.throws(function() { nacl.sign.detached.verify(msg, arr, key); }, TypeError);
  t.throws(function() { nacl.sign.detached.verify(msg, key, arr); }, TypeError);

  t.throws(function() { nacl.sign.keyPair.fromSecretKey(arr); }, TypeError);
  t.throws(function() { nacl.sign.keyPair.fromSeed(arr); }, TypeError);

  t.throws(function() { nacl.hash(arr); }, TypeError);

  t.throws(function() { nacl.verify(arr, msg); }, TypeError);
  t.throws(function() { nacl.verify(msg, arr); }, TypeError);

  t.end();
});

