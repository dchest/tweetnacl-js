var nacl = (typeof require !== 'undefined') ? require('./nacl.js') : window.nacl;

if (!nacl) throw new Error('nacl not loaded');

function bytes_equal(x, y) {
  if (x.length !== y.length) return false;
  for (var i = 0; i < x.length; i++) {
    if (x[i] !== y[i]) return false;
  }
  return true;
}

function benchmark(fn, MB) {
  var start = new Date(), MB = MB || 1;
  for (i = 0; i < MB*1024; i++) {
    fn();
  }
  var elapsed = (new Date()) - start;
  console.log('', (MB*1000)/elapsed, 'MB/s');
}

/*
 * Test and benchmark.
 */

function crypto_stream_xor_test() {
  console.log('Testing crypto_stream_xor');
  var golden = [
    {
      m:[72,101,108,108,111,32,119,111,114,108,100,33],
      n:[50,52,45,98,121,116,101,32,110,111,110,99,101,32,102,111,114,32,120,115,97,108,115,97],
      k:[116,104,105,115,32,105,115,32,51,50,45,98,121,116,101,32,107,101,121,32,102,111,114,32,120,115,97,108,115,97,50,48],
      out:[0,45,69,19,132,63,194,64,196,1,229,65]
    },
    {
      m:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      n:[50,52,45,98,121,116,101,32,110,111,110,99,101,32,102,111,114,32,120,115,97,108,115,97],
      k:[116,104,105,115,32,105,115,32,51,50,45,98,121,116,101,32,107,101,121,32,102,111,114,32,120,115,97,108,115,97,50,48],
      out:[72,72,41,127,235,31,181,47,182,109,129,96,155,213,71,250,188,190,112,38,237,200,181,229,228,73,208,136,191,166,156,8,143,93,141,161,215,145,38,124,44,25,90,127,140,174,156,75,64,80,208,140,230,211,161,81,236,38,95,58,88,228,118,72]
    }
  ];

  for (var i = 0; i < golden.length; i++) {
    var out = [];
    nacl.crypto_stream_xor(out, 0, golden[i].m, 0, golden[i].m.length, golden[i].n, golden[i].k);
    if (!bytes_equal(out, golden[i].out)) {
      console.log(i, 'differ');
      console.log('expected', golden[i].out, 'got', out);
    } else {
      console.log(i, 'OK');
    }
  }

}

function crypto_stream_xor_benchmark() {
  console.log('Benchmarking crypto_stream_xor');
  var m = [], n = [], k = [], out = [];
  for (i = 0; i < 1024; i++) m[i] = i & 255;
  for (i = 0; i < 24; i++) n[i] = i;
  for (i = 0; i < 32; i++) k[i] = i;
  benchmark(function(){
    nacl.crypto_stream_xor(out, 0, m, 0, m.length, n, k);
  });
}


function crypto_onetimeauth_test() {
  console.log('Testing crypto_onetimeauth');
  var golden = [
    {
      m:[72,101,108,108,111,32,119,111,114,108,100,33],
      k:[116,104,105,115,32,105,115,32,51,50,45,98,121,116,101,32,107,101,121,32,102,111,114,32,80,111,108,121,49,51,48,53],
      out:[166,247,69,0,143,129,201,22,162,13,204,116,238,242,178,240]
    },
    {
      m:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      k:[116,104,105,115,32,105,115,32,51,50,45,98,121,116,101,32,107,101,121,32,102,111,114,32,80,111,108,121,49,51,48,53],
      out:[73,236,120,9,14,72,30,198,194,107,51,185,28,204,3,7]
    },
    {
      m: [] /* 2007 zeros */,
      k:[116,104,105,115,32,105,115,32,51,50,45,98,121,116,101,32,107,101,121,32,102,111,114,32,80,111,108,121,49,51,48,53],
      out:[218,132,188,171,2,103,108,56,205,176,21,96,66,116,194,170]
    },
    {
      m: [] /* 2007 zeros */,
      k:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      out:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
    }
  ];
  for (var i = 0; i < 2007; i++) {
    golden[2].m.push(0);
    golden[3].m.push(0);
  }
  for (var i = 0; i < golden.length; i++) {
    var out = [];
    nacl.crypto_onetimeauth(out, 0, golden[i].m, 0, golden[i].m.length, golden[i].k);
    if (!bytes_equal(out, golden[i].out)) {
      console.log(i, 'differ');
      console.log('expected', golden[i].out, 'got', out);
    } else {
      console.log(i, 'OK');
    }
  }
}

function crypto_onetimeauth_benchmark() {
  console.log('Benchmarking crypto_onetimeauth');
  var m = [], out = [];
  var k = [0,1,2,3,4,5,6,7,8,9,0,1,2,3,4,5,6,7,8,9,0,1,2,3,4,5,6,7,8,9,0,1];
  for (i = 0; i < 1024; i++) {
    m[i] = i & 255;
  }
  benchmark(function(){
    nacl.crypto_onetimeauth(out, 0, m, 0, m.length, k);
  });
}


function crypto_secretbox_test() {
  console.log('Testing crypto_secretbox');
  var i, k = [], n = [], m = [], c = [];
  for (i = 0; i < 32; i++) k[i] = 1;
  for (i = 0; i < 24; i++) n[i] = 2;
  for (i = 0; i < 64; i++) m[i] = 3;
  // Pad m.
  for (i = 0; i < nacl.crypto_secretbox_ZEROBYTES; i++) m.unshift(0);

  nacl.crypto_secretbox(c, m, m.length, n, k);

  var golden = [132,66,188,49,63,70,38,241,53,158,59,80,18,43,108,230,254,102,221,254,125,57,209,78,99,126,180,253,91,69,190,173,171,85,25,141,246,171,83,104,67,151,146,162,60,135,219,112,172,182,21,109,197,239,149,122,192,79,98,118,207,96,147,184,75,231,127,240,132,156,195,62,52,183,37,77,90,143,101,173];

  // Unpad c.
  out = c.slice(nacl.crypto_secretbox_BOXZEROBYTES);

  if (!bytes_equal(out, golden)) {
    console.log(0, 'differ');
    console.log('expected', golden, 'got', out);
  } else {
    console.log(0, 'OK');
  }

  // Try opening.
  var opened = [];
  if (!nacl.crypto_secretbox_open(opened, c, c.length, n, k)) {
    console.log('open failed');
  } else {
    console.log('opened - OK');
  }
  if (!bytes_equal(opened, m)) {
    console.log(1, 'differ');
    console.log('expected', m, 'got', opened);
  } else {
    console.log(1, 'OK');
  }
}

function crypto_secretbox_benchmark() {
  console.log('Benchmarking crypto_secretbox');
  var i, k = [], n = [], m = [], c = [];
  for (i = 0; i < 32; i++) k[i] = 1;
  for (i = 0; i < 24; i++) n[i] = 2;
  for (i = 0; i < 1024; i++) m[i] = 3;
  benchmark(function() {
    nacl.crypto_secretbox(c, m, m.length, n, k);
  });
}

function secretbox_seal_open_test() {
  console.log('Testing secretbox.seal and secrebox.open');
  var key = '12345678901234567890123456789012';
  var nonce = '123456789012345678901234';
  var msg = 'привет!'
  var box = nacl.secretbox.seal(msg, nonce, key);
  var dec = nacl.secretbox.open(box, nonce, key);
  if (msg === dec)
    console.log('OK');
  else
    console.log('expected ', msg, 'got', dec);
}

function secretbox_seal_open_benchmark() {
  var key = '12345678901234567890123456789012';
  var nonce = '123456789012345678901234';
  var box = null;
  var msg = '';
  for (var i = 0; i < 1024; i++) msg += 'a';
  console.log('Benchmarking secretbox.seal');
  benchmark(function() {
    box = nacl.secretbox.seal(msg, nonce, key);
  });
  console.log('Benchmarking secretbox.open (valid)');
  benchmark(function() {
    nacl.secretbox.open(box, nonce, key);
  });
  console.log('Benchmarking secretbox.open (invalid)');
  box = 'A' + box.substr(1);
  benchmark(function() {
    nacl.secretbox.open(box, nonce, key);
  });
}

function crypto_scalarmult_base_test_long() {
  // This takes takes a bit of time.
  // Similar to https://code.google.com/p/go/source/browse/curve25519/curve25519_test.go?repo=crypto
  console.log('Testing crypto_scalarmult (long test)');
  var golden = [0x89, 0x16, 0x1f, 0xde, 0x88, 0x7b, 0x2b, 0x53, 0xde, 0x54,
    0x9a, 0xf4, 0x83, 0x94, 0x01, 0x06, 0xec, 0xc1, 0x14, 0xd6, 0x98, 0x2d,
    0xaa, 0x98, 0x25, 0x6d, 0xe2, 0x3b, 0xdf, 0x77, 0x66, 0x1a];
  var input = [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  var output = [];
  for (var j = 0; j < 200; j++) {
    nacl.crypto_scalarmult_base(output, input);
    var tmp = input; input = output; output = tmp;
  }
  if (!bytes_equal(input, golden)) {
    console.log('differ');
    console.log('expected', golden, 'got', out);
  } else {
    console.log('OK');
  }
}

function crypto_scalarmult_base_test() {
  console.log('Testing crypto_scalarmult');
  var golden = [
    {
      q: [143, 64, 197, 173, 182, 143, 37, 98, 74, 229, 178, 20, 234, 118, 122, 110,
          201, 77, 130, 157, 61, 123, 94, 26, 209, 186, 111, 62, 33, 56, 40, 95],
      n: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31]
    }
  ];
  for (var i = 0; i < golden.length; i++) {
    var out = [];
    nacl.crypto_scalarmult_base(out, golden[i].n);
    if (!bytes_equal(out, golden[i].q)) {
      console.log(i, 'differ');
      console.log('expected', golden[i].q, 'got', out);
    } else {
      console.log(i, 'OK');
    }
  }
}

function crypto_scalarmult_base_benchmark() {
  console.log('Benchmarking nacl.crypto_scalarmult_base');
  var n = [], q = [], i, start, elapsed, num = 70;
  for (i = 0; i < 32; i++) n[i] = i;
  start = new Date();
  for (i = 0; i < num; i++) {
    nacl.crypto_scalarmult_base(q, n);
  }
  elapsed = (new Date()) - start;
  console.log(' ' + (num*1000)/elapsed, 'ops/s');
}

function crypto_randombytes_test() {
  console.log('Testing crypto_randombytes');
  var t = {}, tmp, s, i;
  for (var i = 0; i < 10000; i++) {
    tmp = [];
    nacl.crypto_randombytes(tmp, 0, 32);
    s = tmp.join(',');
    if (t[s]) {
      console.log("duplicate random sequence! ", s);
      return;
    }
    t[s] = true;
  }
  console.log('OK');
}

function box_seal_open_test() {
  console.log('Testing box.seal and box.open');
  var golden = 'eOowsZ0jQeu9ulQYD4Ie7CZc+GMSVJvqijdlKou5Twe3inPtFwgIXm' +
               '3dDpQ7veuHVQeaN+sx2GFjziQRZKR2KcBTnzMLSRTNE1s4VbwqLfw=';
  var sk1 = [], sk2 = [], i;
  for (i = 0; i < 32; i++) {
    sk1[i] = 1;
    sk2[i] = 2;
  }
  var pk1 = [];
  nacl.crypto_scalarmult_base(pk1, sk1);
  var msg = [];
  for (i = 0; i < 64; i++) msg[i] = 3;
  var nonce = [];
  for (i = 0; i < 24; i++) nonce[i] = 4;
  var box = nacl.box.seal(msg, nonce, pk1, sk2);
  if (box != golden) {
    console.log('differ');
    console.log('expected', golden, 'got', box);
  } else {
    console.log('OK');
  }
}

function box_seal_open_benchmark() {
  var pk1 = [], sk1 = [], pk2 = [], sk2 = [];
  nacl.crypto_box_keypair(pk1, sk1);
  nacl.crypto_box_keypair(pk2, sk2);
  var nonce = '123456789012345678901234';
  var box = null;
  var msg = '';
  for (var i = 0; i < 1024; i++) msg += 'a';
  console.log('Benchmarking box.seal');
  benchmark(function() {
    box = nacl.box.seal(msg, nonce, pk1, sk2);
  }, 0.1);
  console.log('Benchmarking box.open (valid)');
  benchmark(function() {
    nacl.box.open(box, nonce, pk2, sk1);
  }, 0.1);
  console.log('Benchmarking box.open (invalid key)');
  benchmark(function() {
    nacl.box.open(box, nonce, pk2, sk2);
  }, 0.1);
}

crypto_stream_xor_test();
crypto_onetimeauth_test();
crypto_secretbox_test();
crypto_scalarmult_base_test();
crypto_scalarmult_base_test_long();
secretbox_seal_open_test();
crypto_randombytes_test();
box_seal_open_test();

crypto_stream_xor_benchmark();
crypto_onetimeauth_benchmark();
crypto_secretbox_benchmark();
secretbox_seal_open_benchmark();
crypto_scalarmult_base_benchmark();
box_seal_open_benchmark();
