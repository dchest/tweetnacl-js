// Type definitions for TweetNaCl.js

export as namespace nacl;

declare var nacl: nacl;
export = nacl;

declare namespace nacl {
    export interface secretbox {
        (msg: Uint8Array, nonce: Uint8Array, key: Uint8Array): Uint8Array;
        open(box: Uint8Array, nonce: Uint8Array, key: Uint8Array): Uint8Array;
        readonly keyLength: number;
        readonly nonceLength: number;
        readonly overheadLength: number;
    }

    export interface scalarMult {
        (n: Uint8Array, p: Uint8Array): Uint8Array;
        base(n: Uint8Array): Uint8Array;
        readonly scalarLength: number;
        readonly groupElementLength: number;
    }

    namespace box {
        export interface open {
            (msg: Uint8Array, nonce: Uint8Array, publicKey: Uint8Array, secretKey: Uint8Array): Uint8Array;
            after(box: Uint8Array, nonce: Uint8Array, key: Uint8Array): Uint8Array;
        }

        interface key {
            publicKey: Uint8Array;
            secretKey: Uint8Array;
        }

        export interface keyPair {
            (): key;
            fromSecretKey(secretKey: Uint8Array): key;
        }
    }

    export interface box {
        (msg: Uint8Array, nonce: Uint8Array, publicKey: Uint8Array, secretKey: Uint8Array): Uint8Array;
        before(publicKey: Uint8Array, secretKey: Uint8Array): Uint8Array;
        after(msg: Uint8Array, nonce: Uint8Array, key: Uint8Array): Uint8Array;
        open: box.open;
        keyPair: box.keyPair;
        readonly publicKeyLength: number;
        readonly secretKeyLength: number;
        readonly sharedKeyLength: number;
        readonly nonceLength: number;
        readonly overheadLength: number;
    }

    namespace sign {
        export interface detached {
            (msg: Uint8Array, secretKey: Uint8Array): Uint8Array;
            verify(msg: Uint8Array, sig: Uint8Array, publicKey: Uint8Array): boolean;
        }

        interface key {
            publicKey: Uint8Array;
            secretKey: Uint8Array;
        }

        export interface keyPair {
            (): key;
            fromSecretKey(secretKey: Uint8Array): key;
            fromSeed(secretKey: Uint8Array): key;
        }
    }

    export interface sign {
        (msg: Uint8Array, secretKey: Uint8Array): Uint8Array;
        open(signedMsg: Uint8Array, publicKey: Uint8Array): Uint8Array;
        detached: sign.detached;
        keyPair: sign.keyPair;
        readonly publicKeyLength: number;
        readonly secretKeyLength: number;
        readonly seedLength: number;
        readonly signatureLength: number;
    }

    export interface Hash {
        (msg: Uint8Array): Uint8Array;
        readonly hashLength: number;
    }


}

declare interface nacl {
    randomBytes(n: number): Uint8Array;
    secretbox: nacl.secretbox;
    scalarMult: nacl.scalarMult;
    box: nacl.box;
    sign: nacl.sign;
    hash: nacl.Hash;
    verify(x: Uint8Array, y: Uint8Array): boolean;
    setPRNG(fn: (x: Uint8Array, n: number) => Uint8Array): void;
}
