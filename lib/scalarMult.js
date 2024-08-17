import {checkArrayTypes} from './utils.js';
import {crypto_scalarmult_BYTES, crypto_scalarmult_SCALARBYTES} from './constants.js';
import {crypto_scalarmult, crypto_scalarmult_base} from './crypto.js';

export function scalarMult(n, p) {
    checkArrayTypes(n, p);
    if (n.length !== crypto_scalarmult_SCALARBYTES) throw new Error('bad n size');
    if (p.length !== crypto_scalarmult_BYTES) throw new Error('bad p size');
    const q = new Uint8Array(crypto_scalarmult_BYTES);
    crypto_scalarmult(q, n, p);
    return q;
}

scalarMult.base = function(n) {
    checkArrayTypes(n);
    if (n.length !== crypto_scalarmult_SCALARBYTES) throw new Error('bad n size');
    const q = new Uint8Array(crypto_scalarmult_BYTES);
    crypto_scalarmult_base(q, n);
    return q;
};

scalarMult.scalarLength = crypto_scalarmult_SCALARBYTES;
scalarMult.groupElementLength = crypto_scalarmult_BYTES;
