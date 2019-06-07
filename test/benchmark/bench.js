var nacl = (typeof window !== 'undefined') ? window.nacl : require('../../' + (process.env.NACL_SRC || 'nacl.min.js'));
var helpers = (typeof require !== 'undefined') ? require('./helpers') : window.helpers;
var log = helpers.log;

if (!nacl) throw new Error('nacl not loaded');

function decodeUTF8(s) {
  var i, d = unescape(encodeURIComponent(s)), b = new Uint8Array(d.length);
  for (i = 0; i < d.length; i++) b[i] = d.charCodeAt(i);
  return b;
}

var getTime = (function() {
  if (typeof performance !== 'undefined') {
    return performance.now.bind(performance);
  }
  if (typeof process !== 'undefined' && process.hrtime) {
    return function() {
      var _a = process.hrtime(), sec = _a[0], nanosec = _a[1];
      return (sec * 1e9 + nanosec) / 1e6;
    };
  }
  return Date.now.bind(Date);
})();

function benchmark(fn, bytes) {
  var elapsed = 0;
  var iterations = 1;
  var runsPerIteration = 1;
  // Run once without measuring anything to possibly kick-off JIT.
  fn();
  while (true) { // eslint-disable-line
    var startTime = void 0;
    var diff = void 0;
    if (runsPerIteration === 1) {
      // Measure one iteration.
      startTime = getTime();
      fn();
      diff = getTime() - startTime;
    } else {
      // Measure many iterations.
      startTime = getTime();
      for (var i = 0; i < runsPerIteration; i++) {
        fn();
      }
      diff = getTime() - startTime;
    }
    // If diff is too small, double the number of iterations
    // and start over without recording results.
    if (diff < 1) {
      runsPerIteration *= 2;
      continue;
    }
    // Otherwise, record the result.
    elapsed += diff;
    if (elapsed > 500 && iterations > 2) {
      break;
    }
    iterations += runsPerIteration;
  }
  // Calculate average time per iteration.
  var avg = elapsed / iterations;
  return {
    iterations: iterations,
    msPerOp: avg,
    opsPerSecond: 1000 / avg,
    bytesPerSecond: bytes ? 1000 * (bytes * iterations) / (avg * iterations) : undefined
  };
}

function pad(s, upto, end) {
  if (end === void 0) { end = false; }
  var padlen = upto - s.length;
  if (padlen <= 0) {
    return s;
  }
  // XXX: in ES2015 we can use ' '.repeat(padlen)
  var padding = new Array(padlen + 1).join(' ');
  if (end) {
    return s + padding;
  }
  return padding + s;
}

function report(name, results) {
  var ops = results.iterations + ' ops';
  var msPerOp = results.msPerOp.toFixed(2) + ' ms/op';
  var opsPerSecond = results.opsPerSecond.toFixed(2) + ' ops/sec';
  var mibPerSecond = results.bytesPerSecond
      ? (results.bytesPerSecond / 1024 / 1024).toFixed(2) + ' MiB/s'
      : '';
  log.print(
    pad(name, 25, true) + ' ' +
    pad(ops, 20) + ' ' +
    pad(msPerOp, 20) + ' ' +
    pad(opsPerSecond, 20) + ' ' +
    pad(mibPerSecond, 15)
  );
}

function crypto_stream_xor_benchmark() {
  var m = new Uint8Array(1024),
      n = new Uint8Array(24),
      k = new Uint8Array(32),
      out = new Uint8Array(1024),
      i;
  for (i = 0; i < 1024; i++) m[i] = i & 255;
  for (i = 0; i < 24; i++) n[i] = i;
  for (i = 0; i < 32; i++) k[i] = i;
  report('crypto_stream_xor 1K', benchmark(function() {
    nacl.lowlevel.crypto_stream_xor(out, 0, m, 0, m.length, n, k);
  }, m.length));
}

function crypto_onetimeauth_benchmark() {
  var m = new Uint8Array(1024),
      out = new Uint8Array(1024),
      k = new Uint8Array([0,1,2,3,4,5,6,7,8,9,0,1,2,3,4,5,6,7,8,9,0,1,2,3,4,5,6,7,8,9,0,1]);
  for (var i = 0; i < 1024; i++) {
    m[i] = i & 255;
  }
  report('crypto_onetimeauth 1K', benchmark(function() {
    nacl.lowlevel.crypto_onetimeauth(out, 0, m, 0, m.length, k);
  }, m.length));
}

function crypto_secretbox_benchmark() {
  var i, k = new Uint8Array(32), n = new Uint8Array(24),
      m = new Uint8Array(1024), c = new Uint8Array(1024);
  for (i = 0; i < 32; i++) k[i] = 1;
  for (i = 0; i < 24; i++) n[i] = 2;
  for (i = 0; i < 1024; i++) m[i] = 3;
  report('crypto_secretbox 1K', benchmark(function() {
    nacl.lowlevel.crypto_secretbox(c, m, m.length, n, k);
  }, m.length));
}

function secretbox_seal_open_benchmark() {
  var key = new Uint8Array(32),
      nonce = new Uint8Array(24),
      msg = new Uint8Array(1024),
      box, i;
  for (i = 0; i < 32; i++) key[i] = 1;
  for (i = 0; i < 24; i++) nonce[i] = 2;
  for (i = 0; i < 1024; i++) msg[i] = 3;

  report('secretbox 1K', benchmark(function() {
    box = nacl.secretbox(msg, nonce, key);
  }, msg.length));

  report('secretbox.open 1K', benchmark(function() {
    nacl.secretbox.open(box, nonce, key);
  }, msg.length));
}

function crypto_scalarmult_base_benchmark() {
  var n = new Uint8Array(32), q = new Uint8Array(32);
  for (var i = 0; i < 32; i++) n[i] = i;
  report('crypto_scalarmult_base', benchmark(function() {
    nacl.lowlevel.crypto_scalarmult_base(q, n);
  }));
}

function box_seal_open_benchmark() {
  var pk1 = new Uint8Array(32), sk1 = new Uint8Array(32),
      pk2 = new Uint8Array(32), sk2 = new Uint8Array(32);
  nacl.lowlevel.crypto_box_keypair(pk1, sk1);
  nacl.lowlevel.crypto_box_keypair(pk2, sk2);
  var nonce = decodeUTF8('123456789012345678901234');
  var msg = decodeUTF8((new Array(1024)).join('a'));
  var box = null;

  report('box 1K', benchmark(function() {
    box = nacl.box(msg, nonce, pk1, sk2);
  }, msg.length));

  report('box.open 1K', benchmark(function() {
    nacl.box.open(box, nonce, pk2, sk1);
  }, msg.length));
}

function sign_open_benchmark() {
  var k = nacl.sign.keyPair();
  var sk = k.secretKey;
  var pk = k.publicKey;
  var msg = decodeUTF8((new Array(128)).join('a'));
  var sm;

  report('sign', benchmark(function() {
    sm = nacl.sign(msg, sk);
  }));

  report('sign.open', benchmark(function() {
    nacl.sign.open(sm, pk);
  }));
}

function crypto_hash_benchmark() {
  var m = new Uint8Array(1024), out = new Uint8Array(64);
  var i;
  for (i = 0; i < m.length; i++) m[i] = i & 255;
  report('crypto_hash 1K', benchmark(function() {
    nacl.lowlevel.crypto_hash(out, m, m.length);
  }, m.length));

  m = new Uint8Array(16*1024);
  for (i = 0; i < m.length; i++) m[i] = i & 255;
  report('crypto_hash 16K', benchmark(function() {
    nacl.lowlevel.crypto_hash(out, m, m.length);
  }, m.length));
}

crypto_stream_xor_benchmark();
crypto_onetimeauth_benchmark();
crypto_secretbox_benchmark();
crypto_hash_benchmark();
secretbox_seal_open_benchmark();
crypto_scalarmult_base_benchmark();
box_seal_open_benchmark();
sign_open_benchmark();
