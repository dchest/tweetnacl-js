var nacl = (typeof window !== 'undefined') ? window.nacl : require('../' + (process.env.NACL_SRC || 'nacl.min.js'));
nacl.util = require('tweetnacl-util');
var test = require('tape');

var enc = nacl.util.encodeBase64;

test('nacl.box.keyPair', async function(t) {
  var keys = await nacl.box.keyPair();
  t.ok(keys.secretKey && keys.secretKey.length === nacl.box.secretKeyLength, 'has secret key');
  t.ok(keys.publicKey && keys.publicKey.length === nacl.box.publicKeyLength, 'has public key');
  t.notEqual(enc(keys.secretKey), enc(keys.publicKey));
  t.end();
});

test('nacl.box.keyPair.fromSecretKey', async function(t) {
  var k1 = await nacl.box.keyPair();
  var k2 = nacl.box.keyPair.fromSecretKey(k1.secretKey);
  t.equal(enc(k2.secretKey), enc(k1.secretKey));
  t.equal(enc(k2.publicKey), enc(k1.publicKey));
  t.end();
});

test('nacl.box and nacl.box.open', async function(t) {
  var clientKeys = await nacl.box.keyPair();
  var serverKeys = await nacl.box.keyPair();
  var nonce = new Uint8Array(nacl.box.nonceLength);
  for (var i = 0; i < nonce.length; i++) nonce[i] = (32+i) & 0xff;
  var msg = nacl.util.decodeUTF8('message to encrypt');
  var clientBox = nacl.box(msg, nonce, serverKeys.publicKey, clientKeys.secretKey);
  var clientMsg = nacl.box.open(clientBox, nonce, clientKeys.publicKey, serverKeys.secretKey);
  t.equal(nacl.util.encodeUTF8(clientMsg), nacl.util.encodeUTF8(msg));
  var serverBox = nacl.box(msg, nonce, clientKeys.publicKey, serverKeys.secretKey);
  t.equal(enc(clientBox), enc(serverBox));
  var serverMsg = nacl.box.open(serverBox, nonce, serverKeys.publicKey, clientKeys.secretKey);
  t.equal(nacl.util.encodeUTF8(serverMsg), nacl.util.encodeUTF8(msg));
  t.end();
});

test('nacl.box.open with invalid box', async function(t) {
  var clientKeys = await nacl.box.keyPair();
  var serverKeys = await nacl.box.keyPair();
  var nonce = new Uint8Array(nacl.box.nonceLength);
  t.equal(nacl.box.open(new Uint8Array(0), nonce, serverKeys.publicKey, clientKeys.secretKey), null);
  t.equal(nacl.box.open(new Uint8Array(10), nonce, serverKeys.publicKey, clientKeys.secretKey), null);
  t.equal(nacl.box.open(new Uint8Array(100), nonce, serverKeys.publicKey, clientKeys.secretKey), null);
  t.end();
});

test('nacl.box.open with invalid nonce', async function(t) {
  var clientKeys = await nacl.box.keyPair();
  var serverKeys = await nacl.box.keyPair();
  var nonce = new Uint8Array(nacl.box.nonceLength);
  for (var i = 0; i < nonce.length; i++) nonce[i] = i & 0xff;
  var msg = nacl.util.decodeUTF8('message to encrypt');
  var box = nacl.box(msg, nonce, clientKeys.publicKey, serverKeys.secretKey);
  t.equal(nacl.util.encodeUTF8(nacl.box.open(box, nonce, serverKeys.publicKey, clientKeys.secretKey)),
          nacl.util.encodeUTF8(msg));
  nonce[0] = 255;
  t.equal(nacl.box.open(box, nonce, serverKeys.publicKey, clientKeys.secretKey), null);
  t.end();
});

test('nacl.box.open with invalid keys', async function(t) {
  var clientKeys = await nacl.box.keyPair();
  var serverKeys = await nacl.box.keyPair();
  var nonce = new Uint8Array(nacl.box.nonceLength);
  var msg = nacl.util.decodeUTF8('message to encrypt');
  var box = nacl.box(msg, nonce, clientKeys.publicKey, serverKeys.secretKey);
  t.equal(nacl.util.encodeUTF8(nacl.box.open(box, nonce, serverKeys.publicKey, clientKeys.secretKey)),
          nacl.util.encodeUTF8(msg));
  t.equal(nacl.util.encodeUTF8(nacl.box.open(box, nonce, clientKeys.publicKey, serverKeys.secretKey)),
          nacl.util.encodeUTF8(msg));
  var badPublicKey = new Uint8Array(nacl.box.publicKeyLength);
  t.equal(nacl.box.open(box, nonce, badPublicKey, clientKeys.secretKey), null);
  var badSecretKey = new Uint8Array(nacl.box.secretKeyLength);
  t.equal(nacl.box.open(box, nonce, serverKeys.publicKey, badSecretKey), null);
  t.end();
});
