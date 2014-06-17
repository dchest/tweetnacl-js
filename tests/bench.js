var nacl = (typeof require !== 'undefined') ? require('../nacl.js') : window.nacl;

if (!nacl) throw new Error('nacl not loaded');

function benchmark(fn, MB) {
  var start = new Date();
  MB = MB || 1;
  for (i = 0; i < MB*1024; i++) {
    fn();
  }
  var elapsed = (new Date()) - start;
  console.log('', (MB*1000)/elapsed, 'MB/s');
}

function crypto_stream_xor_benchmark() {
  console.log('Benchmarking crypto_stream_xor');
  var m = [], n = [], k = [], out = [];
  for (i = 0; i < 1024; i++) m[i] = i & 255;
  for (i = 0; i < 24; i++) n[i] = i;
  for (i = 0; i < 32; i++) k[i] = i;
  benchmark(function(){
    nacl.lowlevel.crypto_stream_xor(out, 0, m, 0, m.length, n, k);
  });
}

function crypto_onetimeauth_benchmark() {
  console.log('Benchmarking crypto_onetimeauth');
  var m = [], out = [];
  var k = [0,1,2,3,4,5,6,7,8,9,0,1,2,3,4,5,6,7,8,9,0,1,2,3,4,5,6,7,8,9,0,1];
  for (i = 0; i < 1024; i++) {
    m[i] = i & 255;
  }
  benchmark(function(){
    nacl.lowlevel.crypto_onetimeauth(out, 0, m, 0, m.length, k);
  });
}

function crypto_secretbox_benchmark() {
  console.log('Benchmarking crypto_secretbox');
  var i, k = [], n = [], m = [], c = [];
  for (i = 0; i < 32; i++) k[i] = 1;
  for (i = 0; i < 24; i++) n[i] = 2;
  for (i = 0; i < 1024; i++) m[i] = 3;
  benchmark(function() {
    nacl.lowlevel.crypto_secretbox(c, m, m.length, n, k);
  });
}

function secretbox_seal_open_benchmark() {
  var key = nacl.util.decodeUTF8('12345678901234567890123456789012');
  var nonce = nacl.util.decodeUTF8('123456789012345678901234');
  var box = null;
  var msg = nacl.util.decodeUTF8((new Array(1024)).join('a'));
  console.log('Benchmarking secretbox');
  benchmark(function() {
    box = nacl.secretbox(msg, nonce, key);
  });
  console.log('Benchmarking secretbox.open (valid)');
  benchmark(function() {
    nacl.secretbox.open(box, nonce, key);
  });
  console.log('Benchmarking secretbox.open (invalid)');
  for (var i = 0; i < 10; i++) box[i] = 0;
  benchmark(function() {
    nacl.secretbox.open(box, nonce, key);
  });
}

function secretbox_seal_open_array_benchmark() {
  var key = new Uint8Array(32),
      nonce = new Uint8Array(24),
      msg = new Uint8Array(1024),
      box, i;
  for (i = 0; i < 32; i++) key[i] = 1;
  for (i = 0; i < 24; i++) nonce[i] = 2;
  for (i = 0; i < 1024; i++) msg[i] = 3;

  console.log('Benchmarking secretbox (array)');
  benchmark(function() {
    box = nacl.secretbox(msg, nonce, key);
  });
  console.log('Benchmarking secretbox.open (valid, array)');
  benchmark(function() {
    nacl.secretbox.open(box, nonce, key);
  });
}

function crypto_scalarmult_base_benchmark() {
  console.log('Benchmarking crypto_scalarmult_base');
  var n = [], q = [], i, start, elapsed, num = 70;
  for (i = 0; i < 32; i++) n[i] = i;
  start = new Date();
  for (i = 0; i < num; i++) {
    nacl.lowlevel.crypto_scalarmult_base(q, n);
  }
  elapsed = (new Date()) - start;
  console.log(' ' + (num*1000)/elapsed, 'ops/s');
}

function box_seal_open_benchmark() {
  var pk1 = [], sk1 = [], pk2 = [], sk2 = [];
  nacl.lowlevel.crypto_box_keypair(pk1, sk1);
  nacl.lowlevel.crypto_box_keypair(pk2, sk2);
  var nonce = nacl.util.decodeUTF8('123456789012345678901234');
  var msg = nacl.util.decodeUTF8((new Array(1024)).join('a'));
  var box = null;
  console.log('Benchmarking box');
  benchmark(function() {
    box = nacl.box(msg, nonce, pk1, sk2);
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

function sign_open_benchmark() {
  var pk = [], sk = [], pk1 = [], sig1 = [];
  for (var i = 0; i < 32;i ++) {
    pk1[i] = 0;
    sig1[i] = 0;
    sig1[i+32] = 0;
  }
  nacl.lowlevel.crypto_sign_keypair(pk, sk);
  var sig = null;
  var msg = nacl.util.decodeUTF8((new Array(128)).join('a'));
  var msg1 = new Uint8Array(0);
  for (i = 0; i < 128; i++) {
    sig1[i+64] = 97;
  }
  console.log('Benchmarking sign');
  benchmark(function() {
    sig = nacl.sign(msg, sk);
  }, 0.01);
  console.log('Benchmarking sign.open (valid)');
  benchmark(function() {
    nacl.sign.open(msg, sig, pk);
  }, 0.01);
  console.log('Benchmarking sign.open (invalid signature)');
  benchmark(function() {
    nacl.lowlevel.crypto_sign_open(msg1, sig1, sig1.length, pk);
  }, 0.01);
  console.log('Benchmarking sign.open (invalid publickey)');
  benchmark(function() {
    nacl.sign.open(msg, sig, pk1);
  }, 0.01);
}

function crypto_hash_benchmark() {
  console.log('Benchmarking crypto_hash');
  var m = [], out = [], start, elapsed, num = 255;
  for (i = 0; i < 1024; i++) m[i] = i & 255;
  start = new Date();
  for (i = 0; i < num; i++) {
    nacl.lowlevel.crypto_hash(out, m, m.length);
  }
  elapsed = (new Date()) - start;
  console.log(' ' + (num*1000)/elapsed, 'ops/s');

  benchmark(function(){
    nacl.lowlevel.crypto_hash(out, m, m.length);
  });
}

crypto_stream_xor_benchmark();
crypto_onetimeauth_benchmark();
crypto_secretbox_benchmark();
crypto_hash_benchmark();
secretbox_seal_open_benchmark();
secretbox_seal_open_array_benchmark();
crypto_scalarmult_base_benchmark();
box_seal_open_benchmark();
sign_open_benchmark();
