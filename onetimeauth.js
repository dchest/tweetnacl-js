function crypto_onetimeauth(out, m, n, k) {
  var add1305 = function(h, c) {
    var j, u = 0;
    for(j = 0; j < 17; j++) {
      u = (u + ((h[j] + c[j]) | 0)) | 0;
      h[j] = u & 255;
      u >>>= 8;
    }
  }

  var minusp = [5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 252];

  var s, i, j, u ;
  var x = [], r = [], h = [], c = [], g = [];
  var mpos = 0;
  for(j = 0; j < 17; j++) r[j]=h[j]=0;
  for(j = 0; j < 16; j++) r[j]=k[j];
  r[3]&=15;
  r[4]&=252;
  r[7]&=15;
  r[8]&=252;
  r[11]&=15;
  r[12]&=252;
  r[15]&=15;

  while (n > 0) {
    for(j = 0; j < 17; j++) c[j] = 0;
    for (j = 0;(j < 16) && (j < n);++j) c[j] = m[mpos+j];
    c[j] = 1;
    mpos += j; n -= j;
    add1305(h,c);
    for(i = 0; i < 17; i++) {
      x[i] = 0;
      for(j = 0; j < 17; j++) x[i] += (h[j] * ((j <= i) ? r[i - j] : ((320 * r[i + 17 - j])|0))) | 0;
    }
    for(i = 0; i < 17; i++) h[i] = x[i];
    u = 0;
    for(j = 0; j < 16; j++) {
      u = (u + h[j]) | 0;
      h[j] = u & 255;
      u >>>= 8;
    }
    u = (u + h[16]) | 0; h[16] = u & 3;
    u = (5 * (u >>> 2)) | 0;
    for(j = 0; j < 16; j++) {
      u = (u + h[j]) | 0;
      h[j] = u & 255;
      u >>>= 8;
    }
    u = (u + h[16]) | 0; h[16] = u;
  }

  for(j = 0; j < 17; j++) g[j] = h[j];
  add1305(h,minusp);
  s = (-(h[16] >>> 7) | 0);
  for(j = 0; j < 17; j++) h[j] ^= s & (g[j] ^ h[j]);

  for(j = 0; j < 16; j++) c[j] = k[j + 16];
  c[16] = 0;
  add1305(h,c);
  for(j = 0; j < 16; j++) out[j] = h[j];
}


/*
 * Test and benchmark.
 */

function crypto_onetimeauth_test() {
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
    crypto_onetimeauth(out, golden[i].m, golden[i].m.length, golden[i].k);
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
  var m = [], out = [];
  var k = [0,1,2,3,4,5,6,7,8,9,0,1,2,3,4,5,6,7,8,9,0,1,2,3,4,5,6,7,8,9,0,1];
  for (i = 0; i < 1024; i++) {
    m[i] = i & 255;
  }
  var start = new Date();
  var MB = 2;
  for (i = 0; i < MB*1024; i++) {
    crypto_onetimeauth(out, m, m.length, k);
  }
  var elapsed = (new Date()) - start;
  console.log('Benchmark: ', (MB*1000)/elapsed, 'MB/s');
}

crypto_onetimeauth_test();
crypto_onetimeauth_benchmark();
