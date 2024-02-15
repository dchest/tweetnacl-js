import {checkArrayTypes} from './utils.js';
import {crypto_hash_BYTES} from './constants.js';
import {crypto_hash} from './crypto.js';


export function hash(msg) {
    checkArrayTypes(msg);
    const h = new Uint8Array(crypto_hash_BYTES);
    crypto_hash(h, msg, msg.length);
    return h;
}

hash.hashLength = crypto_hash_BYTES;
