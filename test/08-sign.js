var nacl = (typeof window !== 'undefined') ? window.nacl : require('../' + (process.env.NACL_SRC || 'nacl.min.js'));
var test = require('tape');

var specVectors = require('./data/sign.spec');

var enc = nacl.util.encodeBase64,
    dec = nacl.util.decodeBase64;

test('nacl.sign.keyPair', function(t) {
  var keys = nacl.sign.keyPair();
  t.ok(keys.secretKey && keys.secretKey.length === nacl.sign.secretKeyLength, 'has secret key');
  t.ok(keys.publicKey && keys.publicKey.length === nacl.sign.publicKeyLength, 'has public key');
  t.notEqual(enc(keys.secretKey), enc(keys.publicKey));
  t.end();
});

test('nacl.sign.keyPair.fromSecretKey', function(t) {
  var k1 = nacl.sign.keyPair();
  var k2 = nacl.sign.keyPair.fromSecretKey(k1.secretKey);
  t.equal(enc(k2.secretKey), enc(k1.secretKey));
  t.equal(enc(k2.publicKey), enc(k1.publicKey));
  t.end();
});

test('nacl.sign and nacl.sign.open specified vectors', function(t) {
  specVectors.forEach(function(vec) {
    var keys = nacl.sign.keyPair.fromSecretKey(dec(vec[0]));
    var msg = dec(vec[1]);
    var goodSig = dec(vec[2]);

    var sig = nacl.sign(msg, keys.secretKey);
    t.equal(enc(sig), enc(goodSig), 'signatures must be equal');
    var openedMsg = nacl.sign.open(msg, sig, keys.publicKey);
    t.equal(enc(openedMsg), enc(msg), 'messages must be equal');
  });
  t.end();
});
