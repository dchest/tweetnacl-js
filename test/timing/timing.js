// Measures timing variations and displays them
var nacl = (typeof window !== 'undefined') ? window.nacl : require('../../' + (process.env.NACL_SRC || 'nacl.min.js'));
nacl.util = require('tweetnacl-util');
var test = require('tape');

var hex = function(x) { return Buffer.from(x).toString('hex'); }

test('nacl.scalarMult timings', function(t) {
  function measure(x, prev) {
    var avgdiff = 0;
    for (var k = 0; k < 10; k++) {
      var t0 = Date.now();
      for (var j = 0; j < 100; j++) {
        z = nacl.scalarMult.base(x);
        nacl.scalarMult(x, prev);
      }
      var t1 = Date.now();
      avgdiff += t1 - t0;
    }
    avgdiff /= 10;
    return avgdiff;
  }

  var diffs = [];
  var z, prev = nacl.scalarMult.base(nacl.randomBytes(32));
  for (var i = 0; i < 10; i++) {
    var x = nacl.randomBytes(32);
    if (i % 2 === 0) {
      for (var k = 0; k < 16; k++) x[k] = 0;
    } else if (i % 2 === 3) {
      for (var k = 16; k < 32; k++) x[k] = 0;
    }
    var diff = measure(x, prev);
    console.log(i + ': ' + diff + 'ms');
    prev = z;
    diffs.push({
      diff: diff,
      x: x,
      prev: prev
    });
  }
  diffs.sort(function (a, b) { return a.diff - b.diff; })
  var lo = diffs[0], hi = diffs[diffs.length-1];
  console.log('Lowest : ' + lo.diff + 'ms');
  console.log(hex(lo.x), hex(lo.prev));
  console.log('Highest: ' + hi.diff + 'ms');
  console.log(hex(hi.x), hex(hi.prev));
  console.log('Difference: ' + (hi.diff - lo.diff) + 'ms');

  /* Retest low and high */
  console.log('* Retesting low and high');
  var rlo = measure(lo.x, lo.prev);
  var rhi = measure(hi.x, hi.prev);
  console.log('Re-test low: ' + rlo + 'ms');
  console.log('Re-test high: ' + rhi + 'ms');
  console.log('New difference: ' + (rhi - rlo) + 'ms');

  t.end();
});
