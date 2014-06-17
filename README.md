TweetNaCl.js
============

Port of [TweetNaCl](http://tweetnacl.cr.yp.to) / [NaCl](http://nacl.cr.yp.to/)
to JavaScript.

Public domain. Works in Node.js and browsers.

**!!! Do not use yet. In development. Alpha. Will break things. !!!**

Documentation
=============

* [High-level API](#high-level-api)
  * [Public-key authenticated encryption (box)](#public-key-authenticated-encryption-box)
  * [Secret-key authenticated encryption (secretbox)](#secret-key-authenticated-encryption-secretbox)
  * [Signatures](#signatures)
  * [Hashing](#hashing)
  * [Random bytes generation](#random-bytes-generation)
  * [Utilities](#utilities)
* [Low-level API](#low-level-api)
* [Examples](#examples)
* [Contributors](#contributors)


High-level API
--------------

All high-level API functions accept and return bytes as `Uint8Array`s.  If you
need to encode or decode strings, use functions from `nacl.util` namespace.

### Public-key authenticated encryption (box)

Implements *curve25519-xsalsa20-poly1305*.

#### nacl.box.keyPair()

Generates a new random key pair for box and returns it as an object with
`publicKey` and `secretKey` members:

    {
       publicKey: ...,  // Uint8Array with 32-byte public key
       secretKey: ...   // Uint8Array with 32-byte secret key
    }

#### nacl.box (message, nonce, theirPublicKey, mySecretKey)

Encrypt and authenticates message using peer's public key, our secret key, and
the given nonce, which must be unique for each distinct message for a key pair.

Returns an encrypted and authenticated message, which is
`nacl.box.overheadLength` longer than the original message.

#### nacl.box.open (box, nonce, theirPublicKey, mySecretKey)

Authenticates and decrypts the given box with peer's public key, our secret
key, and the given nonce.

Returns the original message, or `false` if authentication fails.

#### nacl.box.before(theirPublicKey, mySecretKey)

Returns a precomputed shared key which can be used in `nacl.box.after` and
`nacl.box.open.after`.

#### nacl.box.after(message, nonce, sharedKey)

Same as `nacl.box`, but uses a shared key precomputed with `nacl.box.before`.

#### nacl.box.open.after(box, nonce, sharedKey)

Same as `nacl.box.open`, but uses a shared key precomputed with `nacl.box.before`.

#### nacl.box.publicKeyLength = 32

Length of public key in bytes.

#### nacl.box.secretKeyLength = 32

Length of secret key in bytes.

#### nacl.box.sharedKeyLength = 32

Length of precomputed shared key in bytes.

#### nacl.box.nonceLength = 24

Length of nonce in bytes.

#### nacl.box.overheadLength = 16

Length of overhead added to box compared to original message.


### Secret-key authenticated encryption (secretbox)

Implements *xsalsa20-poly1305*.

#### nacl.secretbox(message, nonce, key)

Encrypt and authenticates message using the key and the nonce. The nonce must
be unique for each distinct message for this key.

Returns an encrypted and authenticated message, which is
`nacl.secretbox.overheadLength` longer than the original message.

#### nacl.secretbox.open(box, nonce, key)

Authenticates and decrypts the given secret box using the key and the nonce.

Returns the original message, or `false` if authentication fails.

#### nacl.secretbox.keyLength = 32

Length of key in bytes.

#### nacl.secretbox.nonceLength = 24

Length of nonce in bytes.

#### nacl.secretbox.overheadLength = 16

Length of overhead added to secret box compared to original message.


### Signatures

Implements [ed25519](http://ed25519.cr.yp.to).

#### nacl.sign.keyPair()

Generates new random key pair for signing and returns it as an object with
`publicKey` and `secretKey` members:

    {
       publicKey: ...,  // Uint8Array with 32-byte public key
       secretKey: ...   // Uint8Array with 64-byte secret key
    }

#### nacl.sign(message, secretKey)

Signs a message using secret key and returns a signature.
(Note that unlike NaCl C API, it returns only a signature, not a signature
concatenated with the message).

#### nacl.sign.open(message, signature, publicKey)

Verifies signature for the message using public key and returns the message.
(Note that unlike NaCl C API, it accepts the original message and signature
separetely instead of a signed message.)

Returns `false` if verification failed.

#### nacl.sign.publicKeyLength = 32

Length of signing public key in bytes.

#### nacl.sign.secretKeyLength = 64

Length of signing secret key in bytes.

#### nacl.sign.signatureLength = 64

Length of signature in bytes.


### Hashing

Implements *SHA-512*.

#### nacl.hash(message)

Returns SHA-512 hash of the message.

#### nacl.hash.hashLength = 64

Length of hash in bytes.


### Random bytes generation

Random number generation directly uses `window.crypto.getRandomValues` in
browsers, and `crypto.randomBytes` in Node.js. It will throw exception if there
is no way to generate random bytes.

#### nacl.randomBytes(length)

Returns a `Uint8Array` of the given length containing random bytes of
cryptographic quality.


### Utilities

#### nacl.util.decodeUTF8(string)

Decodes string and returns `Uint8Array` of bytes.

#### nacl.util.encodeUTF8(array)

Encodes `Uint8Array` or `Array` of bytes into string.

#### nacl.util.decodeBase64(string)

Decodes Base-64 encoded string and returns `Uint8Array` of bytes.

#### nacl.util.encodeBase64(array)

Encodes `Uint8Array` or `Array` of bytes into string using Base-64 encoding.


Low-level API
-------------

Low-level NaCl functions and constants are provided with original names under
`nacl.lowlevel` namespace.

**It is not recommended to use these low-level functions unless you know what you
are doing, and even if you know, be careful as function arguments sometimes
differ from the C version due to JavaScript limitations: read the source.**

    nacl.lowlevel.crypto_stream_xor
    nacl.lowlevel.crypto_stream
    nacl.lowlevel.crypto_stream_salsa20_xor
    nacl.lowlevel.crypto_stream_salsa20
    nacl.lowlevel.crypto_onetimeauth
    nacl.lowlevel.crypto_onetimeauth_verify
    nacl.lowlevel.crypto_verify_16
    nacl.lowlevel.crypto_verify_32
    nacl.lowlevel.crypto_secretbox
    nacl.lowlevel.crypto_secretbox_open
    nacl.lowlevel.crypto_scalarmult
    nacl.lowlevel.crypto_scalarmult_base
    nacl.lowlevel.crypto_box_beforenm
    nacl.lowlevel.crypto_box_afternm
    nacl.lowlevel.crypto_box
    nacl.lowlevel.crypto_box_open
    nacl.lowlevel.crypto_box_keypair
    nacl.lowlevel.crypto_hash
    nacl.lowlevel.crypto_sign
    nacl.lowlevel.crypto_sign_keypair
    nacl.lowlevel.crypto_sign_open
    nacl.lowlevel.crypto_randombytes

    nacl.lowlevel.crypto_secretbox_KEYBYTES
    nacl.lowlevel.crypto_secretbox_NONCEBYTES
    nacl.lowlevel.crypto_secretbox_ZEROBYTES
    nacl.lowlevel.crypto_secretbox_BOXZEROBYTES
    nacl.lowlevel.crypto_scalarmult_BYTES
    nacl.lowlevel.crypto_scalarmult_SCALARBYTES
    nacl.lowlevel.crypto_box_PUBLICKEYBYTES
    nacl.lowlevel.crypto_box_SECRETKEYBYTES
    nacl.lowlevel.crypto_box_BEFORENMBYTES
    nacl.lowlevel.crypto_box_NONCEBYTES
    nacl.lowlevel.crypto_box_ZEROBYTES
    nacl.lowlevel.crypto_box_BOXZEROBYTES
    nacl.lowlevel.crypto_sign_BYTES
    nacl.lowlevel.crypto_sign_PUBLICKEYBYTES
    nacl.lowlevel.crypto_sign_SECRETKEYBYTES
    nacl.lowlevel.crypto_hash_BYTES

Examples
--------

*TODO*

Contributors
------------

JavaScript port:

 * [Dmitry Chestnykh](http://github.com/dchest) (ported xsalsa20, poly1305, curve25519)
 * [Devi Mandiri](https://github.com/devi) (ported ed25519, sha512)

Original authors of [NaCl](http://nacl.cr.yp.to) and [TweetNaCl](http://tweetnacl.cr.yp.to)
(who are *not* responsible for any errors in this implementation):

  * [Daniel J. Bernstein](http://cr.yp.to/djb.html)
  * [Tanja Lange](http://hyperelliptic.org/tanja)
  * [Peter Schwabe](http://www.cryptojedi.org/users/peter/)
  * [Matthew Dempsky](https://github.com/mdempsky)

Contributors have dedicated their work to the public domain.
