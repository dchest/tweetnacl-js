var nacl = (typeof require !== 'undefined') ? require('./nacl.js') : window.nacl;

if (!nacl) throw new Error('nacl not loaded');

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
    nacl.crypto_stream_xor(out, golden[i].m, golden[i].m.length, golden[i].n, golden[i].k);
    var ndiff = 0;
    for (var j = 0; j < golden[i].out.length; j++) {
      if (out[j] != golden[i].out[j]) {
        ndiff++;
      }
    }
    if (ndiff != 0) {
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
  var start = new Date();
  var MB = 2;
  for (i = 0; i < MB*1024; i++) {
    nacl.crypto_stream_xor(out, m, m.length, n, k);
  }
  var elapsed = (new Date()) - start;
  console.log('', (MB*1000)/elapsed, 'MB/s');
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
    nacl.crypto_onetimeauth(out, golden[i].m, golden[i].m.length, golden[i].k);
    var ndiff = 0;
    for (var j = 0; j < golden[i].out.length; j++) {
      if (out[j] != golden[i].out[j]) {
        ndiff++;
      }
    }
    if (ndiff != 0) {
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
  var start = new Date();
  var MB = 2;
  for (i = 0; i < MB*1024; i++) {
    nacl.crypto_onetimeauth(out, m, m.length, k);
  }
  var elapsed = (new Date()) - start;
  console.log('', (MB*1000)/elapsed, 'MB/s');
}


crypto_stream_xor_test();
crypto_onetimeauth_test();

crypto_stream_xor_benchmark();
crypto_onetimeauth_benchmark();
