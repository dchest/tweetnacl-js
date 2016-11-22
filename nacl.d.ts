// Type definitions for TweetNaCl.js

export as namespace nacl;

declare var nacl: nacl;
export = nacl;

declare namespace nacl {
    export interface lowlevel {
        crypto_core_hsalsa20: number;
        crypto_stream_xor: number;
        crypto_stream: number;
        crypto_stream_salsa20_xor: number;
        crypto_stream_salsa20: number;
        crypto_onetimeauth: number;
        crypto_onetimeauth_verify: number;
        crypto_verify_16: number;
        crypto_verify_32: number;
        crypto_secretbox: number;
        crypto_secretbox_open: number;
        crypto_scalarmult: number;
        crypto_scalarmult_base: number;
        crypto_box_beforenm: number;
        crypto_box_afternm: number;
        crypto_box: number;
        crypto_box_open: number;
        crypto_box_keypair: number;
        crypto_hash: number;
        crypto_sign: number;
        crypto_sign_keypair: number;
        crypto_sign_open: number;

        crypto_secretbox_KEYBYTES: number;
        crypto_secretbox_NONCEBYTES: number;
        crypto_secretbox_ZEROBYTES: number;
        crypto_secretbox_BOXZEROBYTES: number;
        crypto_scalarmult_BYTES: number;
        crypto_scalarmult_SCALARBYTES: number;
        crypto_box_PUBLICKEYBYTES: number;
        crypto_box_SECRETKEYBYTES: number;
        crypto_box_BEFORENMBYTES: number;
        crypto_box_NONCEBYTES: number;
        crypto_box_ZEROBYTES: number;
        crypto_box_BOXZEROBYTES: number;
        crypto_sign_BYTES: number;
        crypto_sign_PUBLICKEYBYTES: number;
        crypto_sign_SECRETKEYBYTES: number;
        crypto_sign_SEEDBYTES: number;
        crypto_hash_BYTES: number;
    }

    export interface util {
        decodeUTF8(s: string): Uint8Array;
        encodeUTF8(arr: Uint8Array): string;
        encodeBase64(arr: Uint8Array): string;
        decodeBase64(s: string): Uint8Array;
    }

    export interface secretbox {
        (msg: Uint8Array, nonce: Uint8Array, key: Uint8Array): Uint8Array;
        open(box: Uint8Array, nonce: Uint8Array, key: Uint8Array): Uint8Array;
        keyLength: number;
        nonceLength: number;
        overheadLength: number;
    }

    export interface scalarMult {
        (n: Uint8Array, p: Uint8Array): Uint8Array;
        base(n: Uint8Array): Uint8Array;
        scalarLength: number;
        groupElementLength: number;
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
        publicKeyLength: number;
        secretKeyLength: number;
        sharedKeyLength: number;
        nonceLength: number;
        overheadLength: number;
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
        publicKeyLength: number;
        secretKeyLength: number;
        seedLength: number;
        signatureLength: number;
    }

    export interface Hash {
        (msg: Uint8Array): Uint8Array;
        hashLength: number;
    }


}

declare interface nacl {
    lowlevel: nacl.lowlevel;
    util: nacl.util;
    randomBytes(n: number): Uint8Array;
    secretbox: nacl.secretbox;
    scalarMult: nacl.scalarMult;
    box: nacl.box;
    sign: nacl.sign;
    hash: nacl.Hash;
    verify(x: Uint8Array, y: Uint8Array): boolean;
    setPRNG(fn: (x: Uint8Array, n: number) => Uint8Array): void;
}