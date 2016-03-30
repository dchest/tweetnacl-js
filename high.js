'use strict'
module.exports = function (_) {
var nacl = {lowlevel: _}
var randombytes
/* High-level API */

function checkLengths(k, n) {
  if (k.length !== _.crypto_secretbox_KEYBYTES) throw new Error('bad key size');
  if (n.length !== _.crypto_secretbox_NONCEBYTES) throw new Error('bad nonce size');
}

function checkBoxLengths(pk, sk) {
  if (pk.length !== _.crypto_box_PUBLICKEYBYTES) throw new Error('bad public key size');
  if (sk.length !== _.crypto_box_SECRETKEYBYTES) throw new Error('bad secret key size');
}

function checkArrayTypes() {
  var t, i;
  for (i = 0; i < arguments.length; i++) {
     if ((t = Object.prototype.toString.call(arguments[i])) !== '[object Uint8Array]')
       throw new TypeError('unexpected type ' + t + ', use Uint8Array');
  }
}

function cleanup(arr) {
  for (var i = 0; i < arr.length; i++) arr[i] = 0;
}

// TODO: Completely remove this in v0.15.
if (!nacl.util) {
  nacl.util = {};
  nacl.util.decodeUTF8 = nacl.util.encodeUTF8 = nacl.util.encodeBase64 = nacl.util.decodeBase64 = function() {
    throw new Error('nacl.util moved into separate package: https://github.com/dchest/tweetnacl-util-js');
  };
}

nacl.randomBytes = function(n) {
  var b = new Uint8Array(n);
  randombytes(b, n);
  return b;
};

nacl.secretbox = function(msg, nonce, key) {
  checkArrayTypes(msg, nonce, key);
  checkLengths(key, nonce);
  var m = new Uint8Array(_.crypto_secretbox_ZEROBYTES + msg.length);
  var c = new Uint8Array(m.length);
  for (var i = 0; i < msg.length; i++) m[i+_.crypto_secretbox_ZEROBYTES] = msg[i];
  _.crypto_secretbox(c, m, m.length, nonce, key);
  return c.subarray(_.crypto_secretbox_BOXZEROBYTES);
};

nacl.secretbox.open = function(box, nonce, key) {
  checkArrayTypes(box, nonce, key);
  checkLengths(key, nonce);
  var c = new Uint8Array(_.crypto_secretbox_BOXZEROBYTES + box.length);
  var m = new Uint8Array(c.length);
  for (var i = 0; i < box.length; i++) c[i+_.crypto_secretbox_BOXZEROBYTES] = box[i];
  if (c.length < 32) return false;
  if (_.crypto_secretbox_open(m, c, c.length, nonce, key) !== 0) return false;
  return m.subarray(_.crypto_secretbox_ZEROBYTES);
};

nacl.secretbox.keyLength = _.crypto_secretbox_KEYBYTES;
nacl.secretbox.nonceLength = _.crypto_secretbox_NONCEBYTES;
nacl.secretbox.overheadLength = _.crypto_secretbox_BOXZEROBYTES;

nacl.scalarMult = function(n, p) {
  checkArrayTypes(n, p);
  if (n.length !== _.crypto_scalarmult_SCALARBYTES) throw new Error('bad n size');
  if (p.length !== _.crypto_scalarmult_BYTES) throw new Error('bad p size');
  var q = new Uint8Array(_.crypto_scalarmult_BYTES);
  _.crypto_scalarmult(q, n, p);
  return q;
};

nacl.scalarMult.base = function(n) {
  checkArrayTypes(n);
  if (n.length !== _.crypto_scalarmult_SCALARBYTES) throw new Error('bad n size');
  var q = new Uint8Array(_.crypto_scalarmult_BYTES);
  _.crypto_scalarmult_base(q, n);
  return q;
};

nacl.scalarMult.scalarLength = _.crypto_scalarmult_SCALARBYTES;
nacl.scalarMult.groupElementLength = _.crypto_scalarmult_BYTES;

nacl.box = function(msg, nonce, publicKey, secretKey) {
  var k = nacl.box.before(publicKey, secretKey);
  return nacl.secretbox(msg, nonce, k);
};

nacl.box.before = function(publicKey, secretKey) {
  checkArrayTypes(publicKey, secretKey);
  checkBoxLengths(publicKey, secretKey);
  var k = new Uint8Array(_.crypto_box_BEFORENMBYTES);
  _.crypto_box_beforenm(k, publicKey, secretKey);
  return k;
};

nacl.box.after = nacl.secretbox;

nacl.box.open = function(msg, nonce, publicKey, secretKey) {
  var k = nacl.box.before(publicKey, secretKey);
  return nacl.secretbox.open(msg, nonce, k);
};

nacl.box.open.after = nacl.secretbox.open;

nacl.box.keyPair = function() {
  var sk = nacl.randomBytes(_.crypto_box_SECRETKEYBYTES)
  return nacl.box.keyPair.fromSecretKey(sk);
};

nacl.box.keyPair.fromSeed =
nacl.box.keyPair.fromSecretKey = function(secretKey) {
  checkArrayTypes(secretKey);
  if (secretKey.length !== _.crypto_box_SECRETKEYBYTES)
    throw new Error('bad secret key size');
  var pk = new Uint8Array(_.crypto_box_PUBLICKEYBYTES);
  _.crypto_box_keypair(pk, secretKey, true);
  return {publicKey: pk, secretKey: new Uint8Array(secretKey)};
};

nacl.box.publicKeyLength = _.crypto_box_PUBLICKEYBYTES;
nacl.box.secretKeyLength = _.crypto_box_SECRETKEYBYTES;
nacl.box.sharedKeyLength = _.crypto_box_BEFORENMBYTES;
nacl.box.nonceLength = _.crypto_box_NONCEBYTES;
nacl.box.overheadLength = nacl.secretbox.overheadLength;

nacl.sign = function(msg, secretKey) {
  checkArrayTypes(msg, secretKey);
  if (secretKey.length !== _.crypto_sign_SECRETKEYBYTES)
    throw new Error('bad secret key size');
  var signedMsg = new Uint8Array(_.crypto_sign_BYTES+msg.length);
  _.crypto_sign(signedMsg, msg, msg.length, secretKey);
  return signedMsg;
};

nacl.sign.open = function(signedMsg, publicKey) {
  if (arguments.length !== 2)
    throw new Error('nacl.sign.open accepts 2 arguments; did you mean to use nacl.sign.detached.verify?');
  checkArrayTypes(signedMsg, publicKey);
  if (publicKey.length !== _.crypto_sign_PUBLICKEYBYTES)
    throw new Error('bad public key size');
  var tmp = new Uint8Array(signedMsg.length);
  var mlen = _.crypto_sign_open(tmp, signedMsg, signedMsg.length, publicKey);
  if (mlen < 0) return null;
  var m = new Uint8Array(mlen);
  for (var i = 0; i < m.length; i++) m[i] = tmp[i];
  return m;
};

nacl.sign.detached = function(msg, secretKey) {
  var signedMsg = nacl.sign(msg, secretKey);
  var sig = new Uint8Array(_.crypto_sign_BYTES);
  for (var i = 0; i < sig.length; i++) sig[i] = signedMsg[i];
  return sig;
};

nacl.sign.detached.verify = function(msg, sig, publicKey) {
  checkArrayTypes(msg, sig, publicKey);
  if (sig.length !== _.crypto_sign_BYTES)
    throw new Error('bad signature size');
  if (publicKey.length !== _.crypto_sign_PUBLICKEYBYTES)
    throw new Error('bad public key size');
  var sm = new Uint8Array(_.crypto_sign_BYTES + msg.length);
  var m = new Uint8Array(_.crypto_sign_BYTES + msg.length);
  var i;
  for (i = 0; i < _.crypto_sign_BYTES; i++) sm[i] = sig[i];
  for (i = 0; i < msg.length; i++) sm[i+_.crypto_sign_BYTES] = msg[i];
  return (_.crypto_sign_open(m, sm, sm.length, publicKey) >= 0);
};

nacl.sign.keyPair = function() {
  return nacl.sign.keyPair.fromSeed(nacl.randomBytes(_.crypto_sign_SEEDBYTES))
};

nacl.sign.keyPair.fromSecretKey = function(secretKey) {
  checkArrayTypes(secretKey);
  if (secretKey.length !== _.crypto_sign_SECRETKEYBYTES)
    throw new Error('bad secret key size');
  var pk = new Uint8Array(_.crypto_sign_PUBLICKEYBYTES);
  for (var i = 0; i < pk.length; i++) pk[i] = secretKey[32+i];
  return {publicKey: pk, secretKey: new Uint8Array(secretKey)};
};

nacl.sign.keyPair.fromSeed = function(seed) {
  checkArrayTypes(seed);
  if (seed.length !== _.crypto_sign_SEEDBYTES)
    throw new Error('bad seed size');
  var pk = new Uint8Array(_.crypto_sign_PUBLICKEYBYTES);
  var sk = new Uint8Array(_.crypto_sign_SECRETKEYBYTES);
  for (var i = 0; i < 32; i++) sk[i] = seed[i];
  _.crypto_sign_keypair(pk, sk, true);
  return {publicKey: pk, secretKey: sk};
};

nacl.sign.publicKeyLength = _.crypto_sign_PUBLICKEYBYTES;
nacl.sign.secretKeyLength = _.crypto_sign_SECRETKEYBYTES;
nacl.sign.seedLength = _.crypto_sign_SEEDBYTES;
nacl.sign.signatureLength = _.crypto_sign_BYTES;

nacl.hash = function(msg) {
  checkArrayTypes(msg);
  var h = new Uint8Array(_.crypto_hash_BYTES);
  _.crypto_hash(h, msg, msg.length);
  return h;
};

nacl.hash.hashLength = _.crypto_hash_BYTES;

function vn(x, xi, y, yi, n) {
  var i,d = 0;
  for (i = 0; i < n; i++) d |= x[xi+i]^y[yi+i];
  return (1 & ((d - 1) >>> 8)) - 1;
}

nacl.verify = function(x, y) {
  checkArrayTypes(x, y);
  // Zero length arguments are considered not equal.
  if (x.length === 0 || y.length === 0) return false;
  if (x.length !== y.length) return false;
  return (vn(x, 0, y, 0, x.length) === 0) ? true : false;
};

nacl.setPRNG = function(fn) {
  randombytes = fn;
};

(function() {
  // Initialize PRNG if environment provides CSPRNG.
  // If not, methods calling randombytes will throw.
  var crypto = typeof self !== 'undefined' ? (self.crypto || self.msCrypto) : null;
  if (crypto && crypto.getRandomValues) {
    // Browsers.
    var QUOTA = 65536;
    nacl.setPRNG(function(x, n) {
      var i, v = new Uint8Array(n);
      for (i = 0; i < n; i += QUOTA) {
        crypto.getRandomValues(v.subarray(i, i + Math.min(n - i, QUOTA)));
      }
      for (i = 0; i < n; i++) x[i] = v[i];
      cleanup(v);
    });
  } else if (typeof require !== 'undefined') {
    // Node.js.
    crypto = require('crypto');
    if (crypto && crypto.randomBytes) {
      nacl.setPRNG(function(x, n) {
        var i, v = crypto.randomBytes(n);
        for (i = 0; i < n; i++) x[i] = v[i];
        cleanup(v);
      });
    }
  }
})();

return nacl;
}









