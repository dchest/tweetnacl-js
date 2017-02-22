var nacl = (typeof window !== 'undefined') ? window.nacl : require('../' + (process.env.NACL_SRC || 'nacl.min.js'));
nacl.util = require('tweetnacl-util');
var test = require('tape');

var enc = nacl.util.encodeBase64;

test('nacl.secretbox and nacl.secretbox.open', function(t) {
  var key = new Uint8Array(nacl.secretbox.keyLength);
  var nonce = new Uint8Array(nacl.secretbox.nonceLength);
  var i;
  for (i = 0; i < key.length; i++) key[i] = i & 0xff;
  for (i = 0; i < nonce.length; i++) nonce[i] = (32+i) & 0xff;
  var msg = nacl.util.decodeUTF8('message to encrypt');
  var box = nacl.secretbox(msg, nonce, key);
  var openedMsg = nacl.secretbox.open(box, nonce, key);
  t.equal(nacl.util.encodeUTF8(openedMsg), nacl.util.encodeUTF8(msg), 'opened messages should be equal');
  t.end();
});

test('nacl.secretbox.open with invalid box', function(t) {
  var key = new Uint8Array(nacl.secretbox.keyLength);
  var nonce = new Uint8Array(nacl.secretbox.nonceLength);
  t.equal(nacl.secretbox.open(new Uint8Array(0), nonce, key), null);
  t.equal(nacl.secretbox.open(new Uint8Array(10), nonce, key), null);
  t.equal(nacl.secretbox.open(new Uint8Array(100), nonce, key), null);
  t.end();
});

test('nacl.secretbox.open with invalid nonce', function(t) {
  var key = new Uint8Array(nacl.secretbox.keyLength);
  var nonce = new Uint8Array(nacl.secretbox.nonceLength);
  for (var i = 0; i < nonce.length; i++) nonce[i] = i & 0xff;
  var msg = nacl.util.decodeUTF8('message to encrypt');
  var box = nacl.secretbox(msg, nonce, key);
  t.equal(nacl.util.encodeUTF8(nacl.secretbox.open(box, nonce, key)),
          nacl.util.encodeUTF8(msg));
  nonce[0] = 255;
  t.equal(nacl.secretbox.open(box, nonce, key), null);
  t.end();
});

test('nacl.secretbox.open with invalid key', function(t) {
  var key = new Uint8Array(nacl.secretbox.keyLength);
  for (var i = 0; i < key.length; i++) key[i] = i & 0xff;
  var nonce = new Uint8Array(nacl.secretbox.nonceLength);
  var msg = nacl.util.decodeUTF8('message to encrypt');
  var box = nacl.secretbox(msg, nonce, key);
  t.equal(nacl.util.encodeUTF8(nacl.secretbox.open(box, nonce, key)),
          nacl.util.encodeUTF8(msg));
  key[0] = 255;
  t.equal(nacl.secretbox.open(box, nonce, key), null);
  t.end();
});

test('nacl.secretbox with message lengths of 0 to 1024', function(t) {
  var key = new Uint8Array(nacl.secretbox.keyLength);
  var i;
  for (i = 0; i < key.length; i++) key[i] = i & 0xff;
  var nonce = new Uint8Array(nacl.secretbox.nonceLength);
  var fullMsg = new Uint8Array(1024);
  for (i = 0; i < fullMsg; i++) fullMsg[i] = i & 0xff;
  for (i = 0; i < fullMsg.length; i++) {
    var msg = fullMsg.subarray(0, i);
    var box = nacl.secretbox(msg, nonce, key);
    var unbox = nacl.secretbox.open(box, nonce, key);
    t.equal(enc(msg), enc(unbox));
  }
  t.end();
});
