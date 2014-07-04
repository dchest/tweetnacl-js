TweetNaCl.js
============

Port of [TweetNaCl](http://tweetnacl.cr.yp.to) / [NaCl](http://nacl.cr.yp.to/)
to JavaScript. The goal of this project is to produce a translation of
TweetNaCl to JavaScript which is as close as possible to the original C
implementation, plus a thin layer of idiomatic high-level API on top of it.

Public domain. Works in Node.js and browsers.

[Demo](https://dchest.github.io/tweetnacl-js/)

**!!! Do not use yet. In development. Alpha. Will break things. !!!**

[![Build Status](https://travis-ci.org/dchest/tweetnacl-js.svg?branch=master)
](https://travis-ci.org/dchest/tweetnacl-js)


Documentation
=============

* [API](#api)
  * [Public-key authenticated encryption (box)](#public-key-authenticated-encryption-box)
  * [Secret-key authenticated encryption (secretbox)](#secret-key-authenticated-encryption-secretbox)
  * [Scalar multiplication](#scalar-multiplication)
  * [Signatures](#signatures)
  * [Hashing](#hashing)
  * [Random bytes generation](#random-bytes-generation)
  * [Constant-time comparison](#constant-time-comparison)
  * [Utilities](#utilities)
* [Examples](#examples)
* [System requirements](#system-requirements)
* [Development and testing](#development-and-testing)
* [Contributors](#contributors)


API
---

All API functions accept and return bytes as `Uint8Array`s.  If you need to
encode or decode strings, use functions from `nacl.util` namespace.

### Public-key authenticated encryption (box)

Implements *curve25519-xsalsa20-poly1305*.

#### nacl.box.keyPair()

Generates a new random key pair for box and returns it as an object with
`publicKey` and `secretKey` members:

    {
       publicKey: ...,  // Uint8Array with 32-byte public key
       secretKey: ...   // Uint8Array with 32-byte secret key
    }


#### nacl.box.keyPair.fromSecretKey(secretKey)

Returns a key pair for box with public key corresponding to the given secret
key.

#### nacl.box(message, nonce, theirPublicKey, mySecretKey)

Encrypt and authenticates message using peer's public key, our secret key, and
the given nonce, which must be unique for each distinct message for a key pair.

Returns an encrypted and authenticated message, which is
`nacl.box.overheadLength` longer than the original message.

#### nacl.box.open(box, nonce, theirPublicKey, mySecretKey)

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


### Scalar multiplication

Implements *curve25519*.

#### nacl.scalarMult(n, p)

Multiplies an integer `n` by a group element `p` and returns the resulting
group element.

#### nacl.scalarMult.base(n)

Multiplies an integer `n` by a standard group element and returns the resulting
group element.

#### nacl.scalarMult.scalarLength = 32

Length of scalar in bytes.

#### nacl.scalarMult.groupElementLength = 32

Length of group element in bytes.


### Signatures

Implements [ed25519](http://ed25519.cr.yp.to).

#### nacl.sign.keyPair()

Generates new random key pair for signing and returns it as an object with
`publicKey` and `secretKey` members:

    {
       publicKey: ...,  // Uint8Array with 32-byte public key
       secretKey: ...   // Uint8Array with 64-byte secret key
    }

#### nacl.sign.keyPair.fromSecretKey(secretKey)

Returns a signing key pair with public key corresponding to the given secret key.

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

#### nacl.randomBytes(length)

Returns a `Uint8Array` of the given length containing random bytes of
cryptographic quality.

**Implementation note**

TweetNaCl-js uses the following methods to generate random bytes,
depending on environment it runs in:

* `window.crypto.getRandomValues` (WebCrypto standard)
* `window.msCrypto.getRandomValues` (Internet Explorer 11)
* `crypto.randomBytes` (Node.js)

Note that browsers are required to throw `QuotaExceededError`exception if
requested `length` is more than 65536, so do not ask for more than 65536 bytes
in *one call* (multiple calls to get as many bytes as you like are okay:
browsers can generate infinite amount of random bytes without any bad
consequences).

If environment doesn't provide a suitable PRNG, the following functions,
which require random numbers, will throw exception:

* `nacl.randomBytes`
* `nacl.box.keyPair`
* `nacl.sign.keyPair`

Other functions are deterministic and will continue working.

If you have a cryptographically-strong source of entropy (not `Math.random`!),
and you know what you are doing, you can plug it into TweetNaCl-js like this:

    nacl.setPRNG(function(x, n) {
      // ... copy n random bytes into x ...
    });


### Constant-time comparison

#### nacl.verify(x, y)

Compares `x` and `y` in constant time and returns `true` if their lengths are
non-zero and equal, and their contents are equal.

Returns `false` if either of the arguments has zero length, or arguments have
different lengths, or their contents differ.


### Utilities

#### nacl.util.decodeUTF8(string)

Decodes string and returns `Uint8Array` of bytes.

#### nacl.util.encodeUTF8(array)

Encodes `Uint8Array` or `Array` of bytes into string.

#### nacl.util.decodeBase64(string)

Decodes Base-64 encoded string and returns `Uint8Array` of bytes.

#### nacl.util.encodeBase64(array)

Encodes `Uint8Array` or `Array` of bytes into string using Base-64 encoding.


Examples
--------

*TODO*


System requirements
-------------------

TweetNaCl-js supports modern browsers that have a cryptographically secure
pseudorandom number generator and typed arrays, including the latest versions
of:

* Chrome
* Firefox
* Safari (Mac, iOS)
* Internet Explorer 11

[![Testling results](https://ci.testling.com/dchest/tweetnacl-js.png)
](https://ci.testling.com/dchest/tweetnacl-js)


Other systems:

* Node.js (we test on 0.10 and later)


Development and testing
------------------------

Install NPM modules needed for development:

    $ npm install

To build minified version:

    $ npm run build

Tests use minified version, so make sure to rebuild it every time you change
`nacl.js`.

### Testing

To run tests in Node.js:

    $ npm test

To run full suite of tests in Node.hs, including comparing outputs of
JavaScript port to outputs of the original C version:

    $ npm run testall

To prepare tests for browsers:

    $ npm run browser

and then open `tests/browser/test.html` to run them.

To run headless browser tests with `testling`:

    $ npm run testling

(If you get `Error: spawn ENOENT`, install *xvfb*: `sudo apt-get install xvfb`.)

### Benchmarking

To run benchmarks in Node.js:

    $ npm run bench

To run benchmarks in a browser, open `test/benchmark/bench.html`.


Contributors
------------

JavaScript port:

 * [Dmitry Chestnykh](http://github.com/dchest) (ported xsalsa20, poly1305, curve25519)
 * [Devi Mandiri](https://github.com/devi) (ported curve25519, ed25519, sha512)

Original authors of [NaCl](http://nacl.cr.yp.to) and [TweetNaCl](http://tweetnacl.cr.yp.to)
(who are *not* responsible for any errors in this implementation):

  * [Daniel J. Bernstein](http://cr.yp.to/djb.html)
  * Wesley Janssen
  * [Tanja Lange](http://hyperelliptic.org/tanja)
  * [Peter Schwabe](http://www.cryptojedi.org/users/peter/)
  * [Matthew Dempsky](https://github.com/mdempsky)

Contributors have dedicated their work to the public domain.
