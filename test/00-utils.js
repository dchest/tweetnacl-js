var nacl = (typeof window !== 'undefined') ? window.nacl : require('../' + (process.env.NACL_SRC || 'nacl.min.js'));
var test = require('tape');

var b64Vectors = require('./data/base64.random');

function arraysEqual(t, a, b) {
  if (a.length != b.length) {
    t.fail('different lengths: ' + a.length + ' and ' + b.length);
    return;
  }
  for (var i = 0; i < a.length; i++) {
    if (a[i] != b[i]) {
      t.fail('differ:\nexpected: [' + Array.prototype.join.call(b, ',') +
             ']\nactual: [' + Array.prototype.join.call(a, ',') + ']');
      return;
    }
  }
  t.pass('arrays should be equal');
}


test('nacl.util.encodeBase64 random test vectors', function(t) {
  b64Vectors.forEach(function(vec) {
    var b = new Uint8Array(vec[0]);
    var s = vec[1];
    t.equal(nacl.util.encodeBase64(b), s);
    arraysEqual(t, nacl.util.decodeBase64(s), b);
  });
  t.end();
});

