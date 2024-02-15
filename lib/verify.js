import {checkArrayTypes} from './utils.js';
import {vn} from './crypto.js';


export function verify(x, y) {
    checkArrayTypes(x, y);
    // Zero length arguments are considered not equal.
    if (x.length === 0 || y.length === 0) return false;
    if (x.length !== y.length) return false;
    return (vn(x, 0, y, 0, x.length) === 0) ? true : false;
}
