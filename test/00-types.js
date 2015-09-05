var nacl = (typeof window !== 'undefined') ? window.nacl : require('../' + (process.env.NACL_SRC || 'nacl.min.js'));
var test = require('tape');

test('nacl.setReturnType', function(t) {
  t.equal(nacl.hash(new Buffer("hello")).constructor, Uint8Array, 'default return type is Uint8Array');
  nacl.setReturnType(Buffer);
  t.ok(Buffer.isBuffer(nacl.hash(new Buffer("hello"))), 'returns a node-like Buffer');
  nacl.setReturnType(Uint8Array);
  t.equal(nacl.hash(new Buffer("hello")).constructor, Uint8Array, 'set back to Uint8Array');

  t.deepEqual(nacl.hash(new Buffer("moshi")), nacl.hash(new Uint8Array(new Buffer("moshi"))))
  t.end();
});
