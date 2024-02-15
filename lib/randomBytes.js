export let randombytes = function(/* x, n */) { throw new Error('no PRNG'); };

export function setPRNG(fn) {
    randombytes = fn;
}

export function randomBytes(n) {
    const b = new Uint8Array(n);
    randombytes(b, n);
    return b;
}
function cleanup(arr) {
    for (let i = 0; i < arr.length; i++) arr[i] = 0;
}

(function() {
    // Initialize PRNG if environment provides CSPRNG.
    // If not, methods calling randombytes will throw.
    let crypto = typeof self !== 'undefined' ? (self.crypto || self.msCrypto) : null;
    if (crypto && crypto.getRandomValues) {
        // Browsers.
        var QUOTA = 65536;
        setPRNG(function(x, n) {
            let i, v = new Uint8Array(n);
            for (i = 0; i < n; i += QUOTA) {
                crypto.getRandomValues(v.subarray(i, i + Math.min(n - i, QUOTA)));
            }
            for (i = 0; i < n; i++) x[i] = v[i];
            cleanup(v);
        });
    } else if (typeof require !== 'undefined') {
        // Node.js commonJS.
        crypto = require('crypto');
        if (crypto && crypto.randomBytes) {
            setPRNG(function(x, n) {
                let i, v = crypto.randomBytes(n);
                for (i = 0; i < n; i++) x[i] = v[i];
                cleanup(v);
            });
        }
    } else if (typeof import.meta !== 'undefined' && typeof process !== 'undefined'){
        // Node.js ESM
        import('crypto').then((crypto) => {
            setPRNG(function(x, n) {
                const v = crypto.getRandomValues(new Uint8Array(n));
                for (let i = 0; i < n; i++) x[i] = v[i];
                cleanup(v);
            });
        })

    }
})();
