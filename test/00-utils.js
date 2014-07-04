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

var testBytes = new Uint8Array([208,159,209,128,208,184,208,178,208,181,209,130,44,32,78,97,67,108]);
var utf8String = "Привет, NaCl";
var b64String = "0J/RgNC40LLQtdGCLCBOYUNs";

test('nacl.util.decodeUTF8', function(t) {
  t.plan(1);
  arraysEqual(t, nacl.util.decodeUTF8(utf8String), testBytes);
});

test('nacl.util.encodeUTF8', function(t) {
  t.plan(1);
  t.equal(nacl.util.encodeUTF8(testBytes), utf8String);
});

test('nacl.util.decodeBase64', function(t) {
  t.plan(1);
  arraysEqual(t, nacl.util.decodeBase64(b64String), testBytes);
});

test('nacl.util.encodeBase64', function(t) {
  t.plan(1);
  t.equal(nacl.util.encodeBase64(testBytes), b64String);
});

test('nacl.util.encodeBase64 random test vectors', function(t) {
  b64Vectors.forEach(function(vec) {
    var b = new Uint8Array(vec[0]);
    var s = vec[1];
    t.equal(nacl.util.encodeBase64(b), s);
    arraysEqual(t, nacl.util.decodeBase64(s), b);
  });
  t.end();
});
