var nacl = (typeof require !== 'undefined') ? require('./nacl.js') : window.nacl;

if (!nacl) throw new Error('nacl not loaded');

function bytes_equal(x, y) {
  if (x.length !== y.length) return false;
  for (var i = 0; i < x.length; i++) {
    if (x[i] !== y[i]) return false;
  }
  return true;
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
  var start = new Date();
  var MB = 2;
  for (i = 0; i < MB*1024; i++) {
    nacl.crypto_stream_xor(out, 0, m, 0, m.length, n, k);
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
  var start = new Date();
  var MB = 2;
  for (i = 0; i < MB*1024; i++) {
    nacl.crypto_onetimeauth(out, 0, m, 0, m.length, k);
  }
  var elapsed = (new Date()) - start;
  console.log('', (MB*1000)/elapsed, 'MB/s');
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
    console.log("open failed");
  } else {
    console.log("opened - OK");
  }
  if (!bytes_equal(opened, m)) {
    console.log(1, 'differ');
    console.log('expected', m, 'got', opened);
  } else {
    console.log(1, 'OK');
  }
}


crypto_stream_xor_test();
crypto_onetimeauth_test();
crypto_secretbox_test();

//crypto_stream_xor_benchmark();
//crypto_onetimeauth_benchmark();
