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
      n:[50, 52, 45, 98, 121, 116, 101, 32, 110, 111, 110, 99, 101, 32, 102,
        111, 114, 32, 120, 115, 97, 108, 115, 97],
      k:[116, 104, 105, 115, 32, 105, 115, 32, 51, 50, 45, 98, 121, 116, 101,
        32, 107, 101, 121, 32, 102, 111, 114, 32, 120, 115, 97, 108, 115, 97,
        50, 48],
      out:[0,45,69,19,132,63,194,64,196,1,229,65]
    },
    {
      m:[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      n:[50, 52, 45, 98, 121, 116, 101, 32, 110, 111, 110, 99, 101, 32, 102,
        111, 114, 32, 120, 115, 97, 108, 115, 97],
      k:[116, 104, 105, 115, 32, 105, 115, 32, 51, 50, 45, 98, 121, 116, 101,
        32, 107, 101, 121, 32, 102, 111, 114, 32, 120, 115, 97, 108, 115, 97,
        50, 48],
      out:[72, 72, 41, 127, 235, 31, 181, 47, 182, 109, 129, 96, 155, 213, 71,
        250, 188, 190, 112, 38, 237, 200, 181, 229, 228, 73, 208, 136, 191,
        166, 156, 8, 143, 93, 141, 161, 215, 145, 38, 124, 44, 25, 90, 127,
        140, 174, 156, 75, 64, 80, 208, 140, 230, 211, 161, 81, 236, 38, 95,
        58, 88, 228, 118, 72]
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
      k:[116, 104, 105, 115, 32, 105, 115, 32, 51, 50, 45, 98, 121, 116, 101,
        32, 107, 101, 121, 32, 102, 111, 114, 32, 80, 111, 108, 121, 49, 51,
        48, 53],
      out:[166,247,69,0,143,129,201,22,162,13,204,116,238,242,178,240]
    },
    {
      m:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      k:[116, 104, 105, 115, 32, 105, 115, 32, 51, 50, 45, 98, 121, 116, 101,
        32, 107, 101, 121, 32, 102, 111, 114, 32, 80, 111, 108, 121, 49, 51,
        48, 53],
      out:[73,236,120,9,14,72,30,198,194,107,51,185,28,204,3,7]
    },
    {
      m: [] /* 2007 zeros */,
      k:[116, 104, 105, 115, 32, 105, 115, 32, 51, 50, 45, 98, 121, 116, 101,
        32, 107, 101, 121, 32, 102, 111, 114, 32, 80, 111, 108, 121, 49, 51,
        48, 53],
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

  var golden = [132, 66, 188, 49, 63, 70, 38, 241, 53, 158, 59, 80, 18, 43,
    108, 230, 254, 102, 221, 254, 125, 57, 209, 78, 99, 126, 180, 253, 91, 69,
    190, 173, 171, 85, 25, 141, 246, 171, 83, 104, 67, 151, 146, 162, 60, 135,
    219, 112, 172, 182, 21, 109, 197, 239, 149, 122, 192, 79, 98, 118, 207, 96,
    147, 184, 75, 231, 127, 240, 132, 156, 195, 62, 52, 183, 37, 77, 90, 143,
    101, 173];

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

function secretbox_seal_open_array_benchmark() {
  var key = [], nonce = [], msg = [], box, i;
  for (i = 0; i < 32; i++) key[i] = 1;
  for (i = 0; i < 24; i++) nonce[i] = 2;
  for (i = 0; i < 1024; i++) msg[i] = 3;

  console.log('Benchmarking secretbox.seal (array)');
  benchmark(function() {
    box = nacl.secretbox.seal(msg, nonce, key);
  });
  console.log('Benchmarking secretbox.open (valid, array)');
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
  var input = [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
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
      n: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
        20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31]
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
  console.log('Benchmarking crypto_scalarmult_base');
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

function sign_open_test() {
  console.log('Testing sign and sign.open');
  var sk = [], pk = [];
  nacl.crypto_sign_keypair(pk, sk);
  var msg = "test message";
  var sig = nacl.sign(msg, sk);
  var result = nacl.sign.open(msg, sig, pk);
  if (!result) {
    console.log("verification failed")
  } else {
    console.log("OK");
  }
}

function sign_open_benchmark() {
  var pk = [], sk = [], pk1 = [], sig1 = [];
  for (var i = 0; i < 32;i ++) {
    pk1[i] = 0;  
    sig1[i] = 0;
    sig1[i+32] = 0;
  }
  nacl.crypto_sign_keypair(pk, sk);
  var sig = null;
  var msg = '', msg1 = [];
  for (var i = 0; i < 128; i++) {
    msg += 'a';
    sig1[i+64] = 97;
  }
  console.log('Benchmarking sign');
  benchmark(function() {
    sig = nacl.sign(msg, sk);
  }, 0.1);
  console.log('Benchmarking sign.open (valid)');
  benchmark(function() {
    nacl.sign.open(msg, sig, pk);
  }, 0.1);
  console.log('Benchmarking sign.open (invalid signature)');
  benchmark(function() {
    nacl.crypto_sign_open(msg1, sig1, sig1.length, pk);
  }, 0.1);
  console.log('Benchmarking sign.open (invalid publickey)');
  benchmark(function() {
    nacl.sign.open(msg, sig, pk1);
  }, 0.1);
}

function crypto_hash_test() {
  console.log('Testing crypto_hash');
  var golden = [
    {
      data: [],
      out : [207,131,225,53,126,239,184,189,241,84,40,80,214,109,128,7,214,32,228,5,11,87,21,220,131,244,169,33,211,108,233,206,71,208,209,60,93,133,242,176,255,131,24,210,135,126,236,47,99,185,49,189,71,65,122,129,165,56,50,122,249,39,218,62],
    },
    {
      data: [97],
      out : [31,64,252,146,218,36,22,148,117,9,121,238,108,245,130,242,213,215,210,142,24,51,93,224,90,188,84,208,86,14,15,83,2,134,12,101,43,240,141,86,2,82,170,94,116,33,5,70,243,105,251,187,206,140,18,207,199,149,123,38,82,254,154,117],
    },
    {
      data: [97,98],
      out:  [45,64,138,7,23,236,24,129,88,39,138,121,108,104,144,68,54,29,198,253,222,40,214,240,73,115,184,8,150,225,130,57,117,205,191,18,235,99,249,224,89,19,40,238,35,93,128,233,181,191,26,166,164,79,70,23,255,60,175,100,0,235,23,45],
    },
    {
      data: [97,98,99],
      out : [221,175,53,161,147,97,122,186,204,65,115,73,174,32,65,49,18,230,250,78,137,169,126,162,10,158,238,230,75,85,211,154,33,146,153,42,39,79,193,168,54,186,60,35,163,254,235,189,69,77,68,35,100,60,232,14,42,154,201,79,165,76,164,159],
    },
    {
      data: [97,98,99,100],
      out : [216,2,47,32,96,173,110,253,41,122,183,61,204,83,85,201,178,20,5,75,13,23,118,161,54,166,105,210,106,125,59,20,247,58,160,208,235,255,25,238,51,51,104,240,22,75,100,25,169,109,164,158,62,72,23,83,231,233,107,113,107,220,203,111],
    },
    {
      data: [97,98,99,100,101],
      out : [135,138,230,90,146,232,108,172,1,26,87,13,76,48,167,234,236,68,43,133,206,142,202,12,41,82,181,227,204,6,40,194,231,157,136,154,212,213,199,198,38,152,109,69,45,216,99,116,182,255,170,124,216,182,118,101,190,242,40,154,92,112,176,161],
    }
  ];

  var out = [];
  for (var i = 0; i < golden.length; i++) {
    nacl.crypto_hash(out, golden[i].data, golden[i].data.length);
    if (!bytes_equal(out, golden[i].out)) {
      console.log(i, 'differ');
      console.log('expected', golden[i].out, 'got', out);
    } else {
      console.log(i, 'OK');
    }
  }

}

function crypto_hash_benchmark() {
  console.log('Benchmarking crypto_hash');
  var m = [], out = [], start, elapsed, num = 255;
  for (i = 0; i < 1024; i++) m[i] = i & 255;
  start = new Date();
  for (i = 0; i < num; i++) {
    nacl.crypto_hash(out, m, m.length);
  }
  elapsed = (new Date()) - start;
  console.log(' ' + (num*1000)/elapsed, 'ops/s');

  benchmark(function(){
    nacl.crypto_hash(out, m, m.length);
  });

}

crypto_stream_xor_test();
crypto_onetimeauth_test();
crypto_secretbox_test();
crypto_scalarmult_base_test();
crypto_scalarmult_base_test_long();
crypto_hash_test();
secretbox_seal_open_test();
crypto_randombytes_test();
box_seal_open_test();
sign_open_test();

crypto_stream_xor_benchmark();
crypto_onetimeauth_benchmark();
crypto_secretbox_benchmark();
crypto_hash_benchmark();
secretbox_seal_open_benchmark();
secretbox_seal_open_array_benchmark();
crypto_scalarmult_base_benchmark();
box_seal_open_benchmark();
sign_open_benchmark();
