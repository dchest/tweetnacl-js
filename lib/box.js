import {checkArrayTypes} from './utils.js';
import {
    crypto_box_BEFORENMBYTES,
    crypto_box_NONCEBYTES,
    crypto_box_PUBLICKEYBYTES,
    crypto_box_SECRETKEYBYTES
} from './constants.js';
import {crypto_box_beforenm, crypto_box_keypair, crypto_scalarmult_base} from './crypto.js';
import {secretbox} from './secretbox.js';
function checkBoxLengths(pk, sk) {
    if (pk.length !== crypto_box_PUBLICKEYBYTES) throw new Error('bad public key size');
    if (sk.length !== crypto_box_SECRETKEYBYTES) throw new Error('bad secret key size');
}
export function box(msg, nonce, publicKey, secretKey) {
    const k = box.before(publicKey, secretKey);
    return secretbox(msg, nonce, k);
}

box.before = function(publicKey, secretKey) {
    checkArrayTypes(publicKey, secretKey);
    checkBoxLengths(publicKey, secretKey);
    const k = new Uint8Array(crypto_box_BEFORENMBYTES);
    crypto_box_beforenm(k, publicKey, secretKey);
    return k;
};

box.after = secretbox;

box.open = function(msg, nonce, publicKey, secretKey) {
    const k = box.before(publicKey, secretKey);
    return secretbox.open(msg, nonce, k);
};

box.open.after = secretbox.open;

box.keyPair = function() {
    const pk = new Uint8Array(crypto_box_PUBLICKEYBYTES);
    const sk = new Uint8Array(crypto_box_SECRETKEYBYTES);
    crypto_box_keypair(pk, sk);
    return {publicKey: pk, secretKey: sk};
};

box.keyPair.fromSecretKey = function(secretKey) {
    checkArrayTypes(secretKey);
    if (secretKey.length !== crypto_box_SECRETKEYBYTES)
        throw new Error('bad secret key size');
    const pk = new Uint8Array(crypto_box_PUBLICKEYBYTES);
    crypto_scalarmult_base(pk, secretKey);
    return {publicKey: pk, secretKey: new Uint8Array(secretKey)};
};

box.publicKeyLength = crypto_box_PUBLICKEYBYTES;
box.secretKeyLength = crypto_box_SECRETKEYBYTES;
box.sharedKeyLength = crypto_box_BEFORENMBYTES;
box.nonceLength = crypto_box_NONCEBYTES;
box.overheadLength = secretbox.overheadLength;
