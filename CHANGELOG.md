TweetNaCl.js Changelog
======================

v0.9.2
------

* Improved documentation.
* Fast version: increased theoretical message size limit from 2^32-1 to 2^52
  bytes in Poly1305 (and thus, secretbox and box). However this has no impact
  in practice since JavaScript arrays or ArrayBuffers are limited to 32-bit
  indexes, and most implementations won't allocate more than a gigabyte or so.
  (Obviously, there are no tests for the correctness of implementation.) Also,
  it's not recommended to use messages that large without splitting them into
  smaller packets anyway.

v0.9.1
------

* Initial release
