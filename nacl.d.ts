// Type definitions for TweetNaCl.js

export as namespace nacl;

declare var nacl: nacl;
export = nacl;

declare const tag: unique symbol;
type EightBitNumber = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30 | 31 | 32 | 33 | 34 | 35 | 36 | 37 | 38 | 39 | 40 | 41 | 42 | 43 | 44 | 45 | 46 | 47 | 48 | 49 | 50 | 51 | 52 | 53 | 54 | 55 | 56 | 57 | 58 | 59 | 60 | 61 | 62 | 63 | 64 | 65 | 66 | 67 | 68 | 69 | 70 | 71 | 72 | 73 | 74 | 75 | 76 | 77 | 78 | 79 | 80 | 81 | 82 | 83 | 84 | 85 | 86 | 87 | 88 | 89 | 90 | 91 | 92 | 93 | 94 | 95 | 96 | 97 | 98 | 99 | 100 | 101 | 102 | 103 | 104 | 105 | 106 | 107 | 108 | 109 | 110 | 111 | 112 | 113 | 114 | 115 | 116 | 117 | 118 | 119 | 120 | 121 | 122 | 123 | 124 | 125 | 126 | 127 | 128 | 129 | 130 | 131 | 132 | 133 | 134 | 135 | 136 | 137 | 138 | 139 | 140 | 141 | 142 | 143 | 144 | 145 | 146 | 147 | 148 | 149 | 150 | 151 | 152 | 153 | 154 | 155 | 156 | 157 | 158 | 159 | 160 | 161 | 162 | 163 | 164 | 165 | 166 | 167 | 168 | 169 | 170 | 171 | 172 | 173 | 174 | 175 | 176 | 177 | 178 | 179 | 180 | 181 | 182 | 183 | 184 | 185 | 186 | 187 | 188 | 189 | 190 | 191 | 192 | 193 | 194 | 195 | 196 | 197 | 198 | 199 | 200 | 201 | 202 | 203 | 204 | 205 | 206 | 207 | 208 | 209 | 210 | 211 | 212 | 213 | 214 | 215 | 216 | 217 | 218 | 219 | 220 | 221 | 222 | 223 | 224 | 225 | 226 | 227 | 228 | 229 | 230 | 231 | 232 | 233 | 234 | 235 | 236 | 237 | 238 | 239 | 240 | 241 | 242 | 243 | 244 | 245 | 246 | 247 | 248 | 249 | 250 | 251 | 252 | 253 | 254 | 255;
type Key = ReadonlyArray<EightBitNumber>;
type PublicKey = ReadonlyArray<EightBitNumber> & { readonly [tag]: 'PublicKey' }
type SecretKey = ReadonlyArray<EightBitNumber> & { readonly [tag]: 'SecretKey' }

declare namespace nacl {
    export interface BoxKeyPair {
        publicKey: PublicKey;
        secretKey: SecretKey;
    }

    export interface SignKeyPair {
        publicKey: PublicKey;
        secretKey: SecretKey;
    }

    export interface secretbox {
        (msg: Uint8Array, nonce: Uint8Array, key: Key): Uint8Array;
        open(box: Uint8Array, nonce: Uint8Array, key: Key): Uint8Array | null;
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

    namespace boxProps {
        export interface open {
            (msg: Uint8Array, nonce: Uint8Array, publicKey: PublicKey, secretKey: SecretKey): Uint8Array | null;
            after(box: Uint8Array, nonce: Uint8Array, key: Key): Uint8Array | null;
        }

        export interface keyPair {
            (): BoxKeyPair;
            fromSecretKey(secretKey: Uint8Array): BoxKeyPair;
        }
    }

    export interface box {
        (msg: Uint8Array, nonce: Uint8Array, publicKey: PublicKey, secretKey: SecretKey): Uint8Array;
        before(publicKey: PublicKey, secretKey: SecretKey): Uint8Array;
        after(msg: Uint8Array, nonce: Uint8Array, key: Key): Uint8Array;
        open: boxProps.open;
        keyPair: boxProps.keyPair;
        readonly publicKeyLength: number;
        readonly secretKeyLength: number;
        readonly sharedKeyLength: number;
        readonly nonceLength: number;
        readonly overheadLength: number;
    }

    namespace signProps {
        export interface detached {
            (msg: Uint8Array, secretKey: SecretKey): Uint8Array;
            verify(msg: Uint8Array, sig: Uint8Array, publicKey: PublicKey): boolean;
        }

        export interface keyPair {
            (): SignKeyPair;
            fromSecretKey(secretKey: Uint8Array): SignKeyPair;
            fromSeed(secretKey: Uint8Array): SignKeyPair;
        }
    }

    export interface sign {
        (msg: Uint8Array, secretKey: SecretKey): Uint8Array;
        open(signedMsg: Uint8Array, publicKey: PublicKey): Uint8Array | null;
        detached: signProps.detached;
        keyPair: signProps.keyPair;
        readonly publicKeyLength: number;
        readonly secretKeyLength: number;
        readonly seedLength: number;
        readonly signatureLength: number;
    }

    export interface hash {
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
    hash: nacl.hash;
    verify(x: Uint8Array, y: Uint8Array): boolean;
    setPRNG(fn: (x: Uint8Array, n: number) => void): void;
}
