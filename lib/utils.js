
export function checkArrayTypes() {
    for (let i = 0; i < arguments.length; i++) {
        if (!(arguments[i] instanceof Uint8Array))
            throw new TypeError('unexpected type, use Uint8Array');
    }
}
