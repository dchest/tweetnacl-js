import {checkArrayTypes} from './utils.js';
import {
    crypto_sign_BYTES,
    crypto_sign_PUBLICKEYBYTES,
    crypto_sign_SECRETKEYBYTES,
    crypto_sign_SEEDBYTES
} from './constants.js';
import {crypto_sign, crypto_sign_keypair, crypto_sign_open} from './crypto.js';

export function sign(msg, secretKey) {
    checkArrayTypes(msg, secretKey);
    if (secretKey.length !== crypto_sign_SECRETKEYBYTES)
        throw new Error('bad secret key size');
    const signedMsg = new Uint8Array(crypto_sign_BYTES + msg.length);
    crypto_sign(signedMsg, msg, msg.length, secretKey);
    return signedMsg;
}

sign.open = function(signedMsg, publicKey) {
    checkArrayTypes(signedMsg, publicKey);
    if (publicKey.length !== crypto_sign_PUBLICKEYBYTES)
        throw new Error('bad public key size');
    const tmp = new Uint8Array(signedMsg.length);
    const mlen = crypto_sign_open(tmp, signedMsg, signedMsg.length, publicKey);
    if (mlen < 0) return null;
    var m = new Uint8Array(mlen);
    for (let i = 0; i < m.length; i++) m[i] = tmp[i];
    return m;
};

sign.detached = function(msg, secretKey) {
    const signedMsg = sign(msg, secretKey);
    const sig = new Uint8Array(crypto_sign_BYTES);
    for (let i = 0; i < sig.length; i++) sig[i] = signedMsg[i];
    return sig;
};

sign.detached.verify = function(msg, sig, publicKey) {
    checkArrayTypes(msg, sig, publicKey);
    if (sig.length !== crypto_sign_BYTES)
        throw new Error('bad signature size');
    if (publicKey.length !== crypto_sign_PUBLICKEYBYTES)
        throw new Error('bad public key size');
    const sm = new Uint8Array(crypto_sign_BYTES + msg.length);
    const m = new Uint8Array(crypto_sign_BYTES + msg.length);
    let i;
    for (i = 0; i < crypto_sign_BYTES; i++) sm[i] = sig[i];
    for (i = 0; i < msg.length; i++) sm[i+crypto_sign_BYTES] = msg[i];
    return (crypto_sign_open(m, sm, sm.length, publicKey) >= 0);
};

sign.keyPair = function() {
    const pk = new Uint8Array(crypto_sign_PUBLICKEYBYTES);
    const sk = new Uint8Array(crypto_sign_SECRETKEYBYTES);
    crypto_sign_keypair(pk, sk);
    return {publicKey: pk, secretKey: sk};
};

sign.keyPair.fromSecretKey = function(secretKey) {
    checkArrayTypes(secretKey);
    if (secretKey.length !== crypto_sign_SECRETKEYBYTES)
        throw new Error('bad secret key size');
    const pk = new Uint8Array(crypto_sign_PUBLICKEYBYTES);
    for (let i = 0; i < pk.length; i++) pk[i] = secretKey[32+i];
    return {publicKey: pk, secretKey: new Uint8Array(secretKey)};
};

sign.keyPair.fromSeed = function(seed) {
    checkArrayTypes(seed);
    if (seed.length !== crypto_sign_SEEDBYTES)
        throw new Error('bad seed size');
    const pk = new Uint8Array(crypto_sign_PUBLICKEYBYTES);
    const sk = new Uint8Array(crypto_sign_SECRETKEYBYTES);
    for (let i = 0; i < 32; i++) sk[i] = seed[i];
    crypto_sign_keypair(pk, sk, true);
    return {publicKey: pk, secretKey: sk};
};

sign.publicKeyLength = crypto_sign_PUBLICKEYBYTES;
sign.secretKeyLength = crypto_sign_SECRETKEYBYTES;
sign.seedLength = crypto_sign_SEEDBYTES;
sign.signatureLength = crypto_sign_BYTES;
