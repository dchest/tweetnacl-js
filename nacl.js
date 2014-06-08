(function(exports) {
  'use strict';

/* XSalsa20 */

function L32(x, c) { return (x << c) | (x >>> (32 - c)); }

function ld32(x, pos) {
  var u = x[pos+3];
  u = (u<<8)|x[pos+2];
  u = (u<<8)|x[pos+1];
  return (u<<8)|x[pos+0];
}

function st32(x, xpos, u) {
  var i;
  for(i = 0; i < 4; i++) { x[xpos+i] = u & 255; u >>>= 8; }
}

function core(out,inp,k,c,h) {
  var w = [], x = [], y = [], t = [];
  var i, j, m;

  for(i = 0; i < 4; i++) {
    x[5*i] = ld32(c, 4*i);
    x[1+i] = ld32(k, 4*i);
    x[6+i] = ld32(inp, 4*i);
    x[11+i] = ld32(k, 16+4*i);
  }

  for(i = 0; i < 16; i++) y[i] = x[i];

  for(i = 0; i < 20; i++) {
    for(j = 0; j < 4; j++) {
      for(m = 0; m < 4; m++) t[m] = x[(5*j+4*m)%16];
      t[1] ^= L32((t[0]+t[3])|0, 7);
      t[2] ^= L32((t[1]+t[0])|0, 9);
      t[3] ^= L32((t[2]+t[1])|0,13);
      t[0] ^= L32((t[3]+t[2])|0,18);
      for(m = 0; m < 4; m++) w[4*j+(j+m)%4] = t[m];
    }
    for(m = 0; m < 16; m++) x[m] = w[m];
  }

  if (h) {
    for(i = 0; i < 16; i++) x[i] = (x[i] + y[i]) | 0;
    for(i = 0; i < 4; i++) {
      x[5*i] = (x[5*i] - ld32(c, 4*i)) | 0;
      x[6+i] = (x[6+i] - ld32(inp, 4*i)) | 0;
    }
    for(i = 0; i < 4; i++) {
      st32(out,4*i,x[5*i]);
      st32(out,16+4*i,x[6+i]);
    }
  } else {
    for(i = 0; i < 16; i++) st32(out, 4 * i, (x[i] + y[i]) | 0);
  }
}

function crypto_core_salsa20(out,inp,k,c) {
  core(out,inp,k,c,false);
}

function crypto_core_hsalsa20(out,inp,k,c) {
  core(out,inp,k,c,true);
}

var sigma = [101, 120, 112, 97, 110, 100, 32, 51, 50, 45, 98, 121, 116, 101, 32, 107];
            // "expand 32-byte k"

function crypto_stream_salsa20_xor(c,cpos,m,mpos,b,n,k) {
  var z = [], x = [];
  var u, i;
  if (!b) return;
  for(i = 0; i < 16; i++) z[i] = 0;
  for(i = 0; i < 8; i++) z[i] = n[i];
  while (b >= 64) {
    crypto_core_salsa20(x,z,k,sigma);
    for(i = 0; i < 64; i++) c[cpos+i] = (m?m[mpos+i]:0) ^ x[i];
    u = 1;
    for (i = 8;i < 16;++i) {
      u = u + z[i] | 0;
      z[i] = u;
      u >>>= 8;
    }
    b -= 64;
    cpos += 64;
    if (m) mpos += 64;
  }
  if (b > 0) {
    crypto_core_salsa20(x,z,k,sigma);
    for(i = 0; i < b; i++) c[cpos+i] = (m?m[mpos+i]:0) ^ x[i];
  }
}

function crypto_stream_salsa20(c,cpos,d,n,k) {
  crypto_stream_salsa20_xor(c,cpos,null,0,d,n,k);
}

function crypto_stream(c,cpos,d,n,k) {
  var i, s = [], subn = [];
  crypto_core_hsalsa20(s,n,k,sigma);
  for(i = 0; i < 8; i++) subn[i] = n[16+i];
  crypto_stream_salsa20(c,cpos,d,subn,s);
}

function crypto_stream_xor(c,cpos,m,mpos,d,n,k) {
  var i, s = [], subn = [];
  crypto_core_hsalsa20(s,n,k,sigma);
  for(i = 0; i < 8; i++) subn[i] = n[16+i];
  crypto_stream_salsa20_xor(c,cpos,m,mpos,d,subn,s);
}

/* Poly1305 */

function crypto_onetimeauth(out, outpos, m, mpos, n, k) {
  var add1305 = function(h, c) {
    var j, u = 0;
    for(j = 0; j < 17; j++) {
      u = (u + ((h[j] + c[j]) | 0)) | 0;
      h[j] = u & 255;
      u >>>= 8;
    }
  };

  var minusp = [5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 252];

  var s, i, j, u ;
  var x = [], r = [], h = [], c = [], g = [];
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
  for(j = 0; j < 16; j++) out[outpos+j] = h[j];
}

function vn(x, xpos, y, ypos, n) {
  var i,d = 0;
  for(i = 0; i < n; i++) d |= x[xpos+i]^y[ypos+i];
  return (1 & ((d - 1) >>> 8)) - 1;
}

function crypto_verify_16(x, xpos, y, ypos) {
  return vn(x,xpos,y,ypos,16);
}

function crypto_verify_32(x, xpos, y, ypos) {
  return vn(x,xpos,y,ypos,32);
}

function crypto_onetimeauth_verify(h, hpos, m, mpos, n, k) {
  var x = [];
  crypto_onetimeauth(x,0,m,mpos,n,k);
  return crypto_verify_16(h,hpos,x,0);
}

/* Secret box */

function crypto_secretbox(c,m,d,n,k) {
  var i;
  if (d < 32) throw new Error('d < 32');
  crypto_stream_xor(c,0,m,0,d,n,k);
  crypto_onetimeauth(c, 16, c, 32, d - 32, c);
  for(i = 0; i < 16; i++) c[i] = 0;
}

function crypto_secretbox_open(m,c,d,n,k) {
  var i;
  var x = [];
  if (d < 32) throw new Error('d < 32');
  crypto_stream(x,0,32,n,k);
  if (crypto_onetimeauth_verify(c, 16,c, 32,d - 32,x) !== 0) return false;
  crypto_stream_xor(m,0,c,0,d,n,k);
  for(i = 0; i < 32; i++) m[i] = 0;
  return true;
}


/* Curve25519 */

// Implementation derived from curve25519/ref: version 20081011
// Matthew Dempsky. Public domain.
// Derived from public domain code by D. J. Bernstein.

// crypto_scalarmult(q, n, p)
//
// This function multiplies a group element
//   p[0], ..., p[crypto_scalarmult_BYTES-1]
// by an integer
//   n[0], ..., n[crypto_scalarmult_SCALARBYTES-1]
// and puts the resulting group element into
//   q[0], ..., q[crypto_scalarmult_BYTES-1].
//
var crypto_scalarmult = (function() {

  function add(out, outpos, a, apos, b, bpos) {
    var j, u = 0;
    for (j = 0; j < 31; ++j) {
      u = (u + ((a[apos+j] + b[bpos+j]) | 0)) | 0;
      out[outpos+j] = u & 255;
      u >>>= 8;
    }
    u = (u + ((a[apos+31] + b[bpos+31]) | 0)) | 0;
    out[outpos+31] = u;
  }

  function sub(out, outpos, a, apos, b, bpos) {
    var j, u = 218;
    for (j = 0; j < 31; ++j) {
      u = (u + ((((a[apos+j] + 65280) | 0) - b[bpos+j]) | 0)) | 0;
      out[outpos+j] = u & 255;
      u >>>= 8;
    }
    u = (u + ((a[apos+31] - b[bpos+31]) | 0)) | 0;
    out[outpos+31] = u;
  }

  function squeeze(a, apos) {
    var j, u = 0;
    for (j = 0; j < 31; ++j) {
      u = (u + a[apos+j]) | 0;
      a[apos+j] = u & 255;
      u >>>= 8;
    }
    u = (u + a[apos+31]) | 0;
    a[apos+31] = u & 127;
    u = (19 * (u >>> 7)) | 0;
    for (j = 0; j < 31; ++j) {
      u = (u + a[apos+j]) | 0;
      a[apos+j] = u & 255;
      u >>>= 8;
    }
    u = (u + a[apos+31]) | 0;
    a[apos+31] = u;
  }

  var minusp = [
   19, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 128
  ];

  function freeze(a, apos) {
    var aorig = [], j, negative;
    for (j = 0; j < 32; ++j) aorig[j] = a[apos+j];
    add(a, apos, a, apos, minusp, 0);
    negative = -((a[apos+31] >>> 7) & 1);
    for (j = 0; j < 32; ++j) a[apos+j] ^= negative & (aorig[j] ^ a[apos+j]);
  }

  function mult(out, outpos, a, apos, b, bpos) {
    var i, j, u;
    for (i = 0; i < 32; ++i) {
      u = 0;
      for (j = 0; j <= i; ++j) u = (u + ((a[apos+j] * b[bpos+(i-j)]) | 0)) | 0;
      for (j = i + 1; j < 32; ++j) u = (u + (((38 * a[apos+j]) | 0) * b[bpos+(i+32-j)]) | 0) | 0;
      out[outpos+i] = u;
    }
    squeeze(out, outpos);
  }

  function mult121665(out, outpos, a, apos) {
    var j, u = 0;
    for (j = 0; j < 31; ++j) {
      u = (u + ((121665 * a[apos+j]) | 0)) | 0;
      out[outpos+j] = u & 255;
      u >>>= 8;
    }
    u = (u + ((121665 * a[apos+31]) | 0)) | 0;
    out[outpos+31] = u & 127;
    u = (19 * (u >>> 7)) | 0;
    for (j = 0; j < 31; ++j) {
      u = (u + out[outpos+j]) | 0;
      out[outpos+j] = u & 255;
      u >>>= 8;
    }
    u = (u + out[outpos+j]) | 0;
    out[outpos+j] = u;
  }

  function square(out, outpos, a, apos) {
    var i, j, u;
    for (i = 0; i < 32; ++i) {
      u = 0;
      for (j = 0; j < i - j; ++j) u = (u + ((a[apos+j] * a[apos+(i-j)]) | 0)) | 0;
      for (j = i + 1; j < i + 32 - j; ++j) u = (u + ((((38 * a[apos+j]) | 0) * a[apos+(i+32-j)]) | 0)) | 0;
      u = (u * 2) | 0;
      if ((i & 1) === 0) {
        u = (u + ((a[apos+(i/2|0)] * a[apos+(i/2|0)]) | 0)) | 0;
        u = (u + ((((38 * a[apos+((i/2|0)+16)]) | 0) * a[apos+((i/2|0)+16)]) | 0)) | 0;
      }
      out[outpos+i] = u;
    }
    squeeze(out, outpos);
  }

  function select(p, ppos, q, qpos, r, rpos, s, spos, b) {
    var j, t, bminus1;
    bminus1 = (b - 1) >>> 0;
    for (j = 0; j < 64; ++j) {
      t = bminus1 & (r[rpos+j] ^ s[spos+j]);
      p[ppos+j] = s[spos+j] ^ t;
      q[qpos+j] = r[rpos+j] ^ t;
    }
  }

  function mainloop(work, workpos, e, epos) {
    var xzm1 = [], xzm = [], xzmb = [], xzm1b = [], xznb = [], xzn1b = [],
        a0 = [], a1 = [], b0 = [], b1 = [], c1 = [], r = [], s = [], t = [],
        u = [], j, b, pos;

    for (j = 0; j < 32; ++j) xzm1[j] = work[workpos+j];
    xzm1[32] = 1;
    for (j = 33; j < 64; ++j) xzm1[j] = 0;

    xzm[0] = 1;
    for (j = 1; j < 64; ++j) xzm[j] = 0;

    for (pos = 254; pos >= 0; --pos) {
      b = e[epos + (pos/8|0)] >>> (pos & 7);
      b &= 1;
      select(xzmb, 0, xzm1b, 0, xzm, 0, xzm1, 0, b);
      add(a0, 0, xzmb, 0, xzmb, 32);
      sub(a0, 32, xzmb, 0, xzmb, 32);
      add(a1, 0, xzm1b, 0, xzm1b, 32);
      sub(a1, 32, xzm1b, 0, xzm1b, 32);
      square(b0, 0, a0, 0);
      square(b0, 32, a0, 32);
      mult(b1, 0, a1, 0, a0, 32);
      mult(b1, 32, a1, 32, a0, 0);
      add(c1, 0, b1, 0, b1, 32);
      sub(c1, 32, b1, 0, b1, 32);
      square(r, 0, c1, 32);
      sub(s, 0, b0, 0, b0, 32);
      mult121665(t, 0, s, 0);
      add(u, 0, t, 0, b0, 0);
      mult(xznb, 0, b0, 0, b0, 32);
      mult(xznb, 32, s, 0, u, 0);
      square(xzn1b, 0, c1, 0);
      mult(xzn1b, 32, r, 0, work, workpos);
      select(xzm, 0, xzm1, 0, xznb, 0, xzn1b, 0, b);
    }
    for (j = 0; j < 64; ++j) work[workpos+j] = xzm[j];
  }

  function recip(out, outpos, z, zpos) {
    var z2 = [], z9 = [], z11 = [], z2_5_0 = [], z2_10_0 = [],
        z2_20_0 = [], z2_50_0 = [], z2_100_0 = [], t0 = [], t1 = [], i;

    /* 2 */ square(z2, 0, z, zpos);
    /* 4 */ square(t1, 0, z2, 0);
    /* 8 */ square(t0, 0, t1, 0);
    /* 9 */ mult(z9, 0, t0, 0, z, zpos);
    /* 11 */ mult(z11, 0, z9, 0, z2, 0);
    /* 22 */ square(t0, 0, z11, 0);
    /* 2^5 - 2^0 = 31 */ mult(z2_5_0, 0, t0, 0, z9, 0);

    /* 2^6 - 2^1 */ square(t0, 0, z2_5_0, 0);
    /* 2^7 - 2^2 */ square(t1, 0, t0, 0);
    /* 2^8 - 2^3 */ square(t0, 0, t1, 0);
    /* 2^9 - 2^4 */ square(t1, 0, t0, 0);
    /* 2^10 - 2^5 */ square(t0, 0, t1, 0);
    /* 2^10 - 2^0 */ mult(z2_10_0, 0, t0, 0, z2_5_0, 0);

    /* 2^11 - 2^1 */ square(t0, 0, z2_10_0, 0);
    /* 2^12 - 2^2 */ square(t1, 0, t0, 0);
    /* 2^20 - 2^10 */ for (i = 2; i < 10; i += 2) { square(t0, 0, t1, 0); square(t1, 0, t0, 0); }
    /* 2^20 - 2^0 */ mult(z2_20_0, 0, t1, 0, z2_10_0, 0);

    /* 2^21 - 2^1 */ square(t0, 0, z2_20_0, 0);
    /* 2^22 - 2^2 */ square(t1, 0, t0, 0);
    /* 2^40 - 2^20 */ for (i = 2; i < 20; i += 2) { square(t0, 0, t1, 0); square(t1, 0, t0, 0); }
    /* 2^40 - 2^0 */ mult(t0, 0, t1, 0, z2_20_0, 0);

    /* 2^41 - 2^1 */ square(t1, 0, t0, 0);
    /* 2^42 - 2^2 */ square(t0, 0, t1, 0);
    /* 2^50 - 2^10 */ for (i = 2; i < 10; i += 2) { square(t1, 0, t0, 0); square(t0, 0, t1, 0); }
    /* 2^50 - 2^0 */ mult(z2_50_0, 0, t0, 0, z2_10_0, 0);

    /* 2^51 - 2^1 */ square(t0, 0, z2_50_0, 0);
    /* 2^52 - 2^2 */ square(t1, 0, t0, 0);
    /* 2^100 - 2^50 */ for (i = 2; i < 50; i += 2) { square(t0, 0, t1, 0); square(t1, 0, t0, 0); }
    /* 2^100 - 2^0 */ mult(z2_100_0, 0, t1, 0, z2_50_0, 0);

    /* 2^101 - 2^1 */ square(t1, 0, z2_100_0, 0);
    /* 2^102 - 2^2 */ square(t0, 0, t1, 0);
    /* 2^200 - 2^100 */ for (i = 2; i < 100; i += 2) { square(t1, 0, t0, 0); square(t0, 0, t1, 0); }
    /* 2^200 - 2^0 */ mult(t1, 0, t0, 0, z2_100_0, 0);

    /* 2^201 - 2^1 */ square(t0, 0, t1, 0);
    /* 2^202 - 2^2 */ square(t1, 0, t0, 0);
    /* 2^250 - 2^50 */ for (i = 2; i < 50; i += 2) { square(t0, 0, t1, 0); square(t1, 0, t0, 0); }
    /* 2^250 - 2^0 */ mult(t0, 0, t1, 0, z2_50_0, 0);

    /* 2^251 - 2^1 */ square(t1, 0, t0, 0);
    /* 2^252 - 2^2 */ square(t0, 0, t1, 0);
    /* 2^253 - 2^3 */ square(t1, 0, t0, 0);
    /* 2^254 - 2^4 */ square(t0, 0, t1, 0);
    /* 2^255 - 2^5 */ square(t1, 0, t0, 0);
    /* 2^255 - 21 */ mult(out, outpos, t1, 0, z11, 0);
  }

  return function(q, n, p) {
    var work = [], e = [], i;
    for (i = 0; i < 32; ++i) e[i] = n[i];
    e[0] &= 248;
    e[31] &= 127;
    e[31] |= 64;
    for (i = 0; i < 32; ++i) work[i] = p[i];
    mainloop(work, 0, e, 0);
    recip(work, 32, work, 32);
    mult(work, 64, work, 0, work, 32);
    freeze(work, 64);
    for (i = 0; i < 32; ++i) q[i] = work[64 + i];
  };

})();

function crypto_scalarmult_base(q, n) {
  var base = [9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  crypto_scalarmult(q, n, base);
}

function randombytes(x, xpos, n) {
  var values = null;
  if (typeof window !== 'undefined' && window.crypto) {
    values = new Uint8Array(n);
    window.crypto.getRandomValues(values);
  } else if (typeof require !== 'undefined') {
    var prng = require('crypto');
    values = prng ? prng.randomBytes(n) : null;
  } else {
    throw new Error('no PRNG');
  }
  if (!values || values.length !== n) {
    throw new Error('PRNG failed');
  }
  for (var i = 0; i < values.length; i++) x[xpos+i] = values[i];
}

function crypto_box_keypair(y, x) {
  randombytes(x, 0, 32);
  crypto_scalarmult_base(y, x);
}

function crypto_box_beforenm(k, y, x) {
  var s = [];
  var _0 = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  crypto_scalarmult(s, x, y);
  crypto_core_hsalsa20(k, _0, s, sigma);
}

var crypto_box_afternm = crypto_secretbox;
var crypto_box_open_afternm = crypto_secretbox_open;

function crypto_box(c, m, d, n, y, x) {
  var k = [];
  crypto_box_beforenm(k, y, x);
  crypto_box_afternm(c, m, d, n, k);
}

function crypto_box_open(m, c, d, n, y, x) {
  var k = [];
  crypto_box_beforenm(k, y, x);
  return crypto_box_open_afternm(m, c, d, n, k);
}

/* sha512 - extracted from http://caligatio.github.com/jsSHA */
var crypto_hash = function(out, data, len) {

  var bits = function(high, low) {
    this.high = high;
    this.low = low;
  }

  var H = [new bits(0x6a09e667, 0xf3bcc908), new bits(0xbb67ae85, 0x84caa73b),
          new bits(0x3c6ef372, 0xfe94f82b), new bits(0xa54ff53a, 0x5f1d36f1),
          new bits(0x510e527f, 0xade682d1), new bits(0x9b05688c, 0x2b3e6c1f),
          new bits(0x1f83d9ab, 0xfb41bd6b), new bits(0x5be0cd19, 0x137e2179)];

  var K = [new bits(0x428a2f98, 0xd728ae22), new bits(0x71374491, 0x23ef65cd),
          new bits(0xb5c0fbcf, 0xec4d3b2f), new bits(0xe9b5dba5, 0x8189dbbc),
          new bits(0x3956c25b, 0xf348b538), new bits(0x59f111f1, 0xb605d019),
          new bits(0x923f82a4, 0xaf194f9b), new bits(0xab1c5ed5, 0xda6d8118),
          new bits(0xd807aa98, 0xa3030242), new bits(0x12835b01, 0x45706fbe),
          new bits(0x243185be, 0x4ee4b28c), new bits(0x550c7dc3, 0xd5ffb4e2),
          new bits(0x72be5d74, 0xf27b896f), new bits(0x80deb1fe, 0x3b1696b1),
          new bits(0x9bdc06a7, 0x25c71235), new bits(0xc19bf174, 0xcf692694),
          new bits(0xe49b69c1, 0x9ef14ad2), new bits(0xefbe4786, 0x384f25e3),
          new bits(0x0fc19dc6, 0x8b8cd5b5), new bits(0x240ca1cc, 0x77ac9c65),
          new bits(0x2de92c6f, 0x592b0275), new bits(0x4a7484aa, 0x6ea6e483),
          new bits(0x5cb0a9dc, 0xbd41fbd4), new bits(0x76f988da, 0x831153b5),
          new bits(0x983e5152, 0xee66dfab), new bits(0xa831c66d, 0x2db43210),
          new bits(0xb00327c8, 0x98fb213f), new bits(0xbf597fc7, 0xbeef0ee4),
          new bits(0xc6e00bf3, 0x3da88fc2), new bits(0xd5a79147, 0x930aa725),
          new bits(0x06ca6351, 0xe003826f), new bits(0x14292967, 0x0a0e6e70),
          new bits(0x27b70a85, 0x46d22ffc), new bits(0x2e1b2138, 0x5c26c926),
          new bits(0x4d2c6dfc, 0x5ac42aed), new bits(0x53380d13, 0x9d95b3df),
          new bits(0x650a7354, 0x8baf63de), new bits(0x766a0abb, 0x3c77b2a8),
          new bits(0x81c2c92e, 0x47edaee6), new bits(0x92722c85, 0x1482353b),
          new bits(0xa2bfe8a1, 0x4cf10364), new bits(0xa81a664b, 0xbc423001),
          new bits(0xc24b8b70, 0xd0f89791), new bits(0xc76c51a3, 0x0654be30),
          new bits(0xd192e819, 0xd6ef5218), new bits(0xd6990624, 0x5565a910),
          new bits(0xf40e3585, 0x5771202a), new bits(0x106aa070, 0x32bbd1b8),
          new bits(0x19a4c116, 0xb8d2d0c8), new bits(0x1e376c08, 0x5141ab53),
          new bits(0x2748774c, 0xdf8eeb99), new bits(0x34b0bcb5, 0xe19b48a8),
          new bits(0x391c0cb3, 0xc5c95a63), new bits(0x4ed8aa4a, 0xe3418acb),
          new bits(0x5b9cca4f, 0x7763e373), new bits(0x682e6ff3, 0xd6b2b8a3),
          new bits(0x748f82ee, 0x5defb2fc), new bits(0x78a5636f, 0x43172f60),
          new bits(0x84c87814, 0xa1f0ab72), new bits(0x8cc70208, 0x1a6439ec),
          new bits(0x90befffa, 0x23631e28), new bits(0xa4506ceb, 0xde82bde9),
          new bits(0xbef9a3f7, 0xb2c67915), new bits(0xc67178f2, 0xe372532b),
          new bits(0xca273ece, 0xea26619c), new bits(0xd186b8c7, 0x21c0c207),
          new bits(0xeada7dd6, 0xcde0eb1e), new bits(0xf57d4f7f, 0xee6ed178),
          new bits(0x06f067aa, 0x72176fba), new bits(0x0a637dc5, 0xa2c898a6),
          new bits(0x113f9804, 0xbef90dae), new bits(0x1b710b35, 0x131c471b),
          new bits(0x28db77f5, 0x23047d84), new bits(0x32caab7b, 0x40c72493),
          new bits(0x3c9ebe0a, 0x15c9bebc), new bits(0x431d67c4, 0x9c100d4c),
          new bits(0x4cc5d4be, 0xcb3e42b6), new bits(0x597f299c, 0xfc657e2a),
          new bits(0x5fcb6fab, 0x3ad6faec), new bits(0x6c44198c, 0x4a475817)];

  function safe_add_2(x, y) {
    var lsw, msw, low, high;

    lsw = (x.low & 65535) + (y.low & 65535);
    msw = (x.low >>> 16) + (y.low >>> 16) + (lsw >>> 16);
    low = ((msw & 65535) << 16) | (lsw & 65535);

    lsw = (x.high & 65535) + (y.high & 65535) + (msw >>> 16);
    msw = (x.high >>> 16) + (y.high >>> 16) + (lsw >>> 16);
    high = ((msw & 65535) << 16) | (lsw & 65535);

    return new bits(high, low);
  }

  function safe_add_4(a, b, c, d) {
    var lsw, msw, low, high;

    lsw = (a.low & 65535) + (b.low & 65535) + (c.low & 65535) + (d.low & 65535);
    msw = (a.low >>> 16) + (b.low >>> 16) + (c.low >>> 16) + (d.low >>> 16) + (lsw >>> 16);
    low = ((msw & 65535) << 16) | (lsw & 65535);

    lsw = (a.high & 65535) + (b.high & 65535) + (c.high & 65535) + (d.high & 65535) + (msw >>> 16);
    msw = (a.high >>> 16) + (b.high >>> 16) + (c.high >>> 16) + (d.high >>> 16) + (lsw >>> 16);
    high = ((msw & 65535) << 16) | (lsw & 65535);

    return new bits(high, low);
  }

  function safe_add_5(a, b, c, d, e) {
    var lsw, msw, low, high;

    lsw = (a.low & 65535) + (b.low & 65535) + (c.low & 65535) + (d.low & 65535) + (e.low & 65535);
    msw = (a.low >>> 16) + (b.low >>> 16) + (c.low >>> 16) + (d.low >>> 16) + (e.low >>> 16) + (lsw >>> 16);
    low = ((msw & 65535) << 16) | (lsw & 65535);

    lsw = (a.high & 65535) + (b.high & 65535) + (c.high & 65535) + (d.high & 65535) + (e.high & 65535) + (msw >>> 16);
    msw = (a.high >>> 16) + (b.high >>> 16) + (c.high >>> 16) + (d.high >>> 16) + (e.high >>> 16) + (lsw >>> 16);
    high = ((msw & 65535) << 16) | (lsw & 65535);

    return new bits(high, low);
  }

  function maj(x, y, z) {
    return new bits(
        (x.high & y.high) ^ (x.high & z.high) ^ (y.high & z.high),
        (x.low & y.low) ^ (x.low & z.low) ^ (y.low & z.low)
    );
  }

  function ch(x, y, z) {
    return new bits(
      (x.high & y.high) ^ (~x.high & z.high),
      (x.low & y.low) ^ (~x.low & z.low)
    );
  }

  function rotr(x, n) {
    if (n <= 32) {
        return new bits(
            (x.high >>> n) | (x.low << (32 - n)),
            (x.low >>> n) | (x.high << (32 - n))
        );
    } else {
        return new bits(
            (x.low >>> n) | (x.high << (32 - n)),
            (x.high >>> n) | (x.low << (32 - n))
        );
    }
  }

  function sigma0(x) {
    var rotr28 = rotr(x, 28);
    var rotr34 = rotr(x, 34);
    var rotr39 = rotr(x, 39);

    return new bits(
        rotr28.high ^ rotr34.high ^ rotr39.high,
        rotr28.low ^ rotr34.low ^ rotr39.low
    );
  }

  function sigma1(x) {
    var rotr14 = rotr(x, 14);
    var rotr18 = rotr(x, 18);
    var rotr41 = rotr(x, 41);

    return new bits(
        rotr14.high ^ rotr18.high ^ rotr41.high,
        rotr14.low ^ rotr18.low ^ rotr41.low
    );
  }

  function gamma0(x) {
    var rotr1 = rotr(x, 1), rotr8 = rotr(x, 8), shr7 = shr(x, 7);

    return new bits(
        rotr1.high ^ rotr8.high ^ shr7.high,
        rotr1.low ^ rotr8.low ^ shr7.low
    );
  }

  function gamma1(x) {
    var rotr19 = rotr(x, 19);
    var rotr61 = rotr(x, 61);
    var shr6 = shr(x, 6);

    return new bits(
        rotr19.high ^ rotr61.high ^ shr6.high,
        rotr19.low ^ rotr61.low ^ shr6.low
    );
  }

  function shr(x, n) {
    if (n <= 32) {
        return new bits(
            x.high >>> n,
            x.low >>> n | (x.high << (32 - n))
        );
    } else {
        return new bits(
            0,
            x.high << (32 - n)
        );
    }
  }

  if (typeof len == 'undefined') len = data.length;
  
  var W = new Array(64),
      a, b, c, d, e, f, g, h, i, j, l,
      T1, T2,
      charsize = 8,
      words = [], datalen = len*charsize;

  for (i = 0; i < datalen; i += charsize) {
      words[i >> 5] |= data[i/charsize] << (32 - charsize - (i % 32));
  }

  words[datalen >> 5] |= 0x80 << (24 - datalen % 32);
  words[(((datalen + 128) >> 10) << 5) + 31] = datalen;

  l = words.length;
  for (i = 0; i < l; i += 32) {
      a = H[0];
      b = H[1];
      c = H[2];
      d = H[3];
      e = H[4];
      f = H[5];
      g = H[6];
      h = H[7];

      for (j = 0; j < 80; j++) {
          if (j < 16) {
              W[j] = new bits(words[j*2 + i], words[j*2 + i + 1]);
          } else {
              W[j] = safe_add_4(gamma1(W[j - 2]), W[j - 7], gamma0(W[j - 15]), W[j - 16]);
          }

          T1 = safe_add_5(h, sigma1(e), ch(e, f, g), K[j], W[j]);
          T2 = safe_add_2(sigma0(a), maj(a, b, c));
          h = g;
          g = f;
          f = e;
          e = safe_add_2(d, T1);
          d = c;
          c = b;
          b = a;
          a = safe_add_2(T1, T2);
      }

      H[0] = safe_add_2(a, H[0]);
      H[1] = safe_add_2(b, H[1]);
      H[2] = safe_add_2(c, H[2]);
      H[3] = safe_add_2(d, H[3]);
      H[4] = safe_add_2(e, H[4]);
      H[5] = safe_add_2(f, H[5]);
      H[6] = safe_add_2(g, H[6]);
      H[7] = safe_add_2(h, H[7]);
  }

  var binarray = [];
  l = H.length;
  for (i = 0; i < l; i++) {
      binarray.push(H[i].high);
      binarray.push(H[i].low);
  }

  l = binarray.length * 4;
  for (i = 0; i < l; i += 1) {
      out[i] = (binarray[i >> 2] >> ((3 - (i % 4)) * 8)) & 0xff;
  }
}

// ed25519 
//
// Written in 2014 by Devi Mandiri
//
// To the extent possible under law, the author(s) have dedicated all copyright and related and
// neighboring rights to this software to the public domain worldwide. This software is distributed
// without any warranty.
//
// You should have received a copy of the CC0 Public Domain Dedication along with this software.
// If not, see <http://creativecommons.org/publicdomain/zero/1.0/>.
//
// Implementation derived from TweetNaCl version 20140427.
// See for details: http://tweetnacl.cr.yp.to/
//
var gf = function() { return [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];}
var gf0 = new gf(), gf1 = new gf(); gf1[0] = [1];
var D = [30883,4953,19914,30187,55467,16705,2637,112,59544,30585,16505,36039,65139,11119,27886,20995],
    D2 = [61785,9906,39828,60374,45398,33411,5274,224,53552,61171,33010,6542,64743,22239,55772,9222],
    X = [54554,36645,11616,51542,42930,38181,51040,26924,56412,64982,57905,49316,21502,52590,14035,8553],
    Y = [26200,26214,26214,26214,26214,26214,26214,26214,26214,26214,26214,26214,26214,26214,26214,26214],
    I = [41136,18958,6951,50414,58488,44335,6150,12099,55207,15867,153,11085,57099,20417,9344,11139];

function car25519(o) {
  var c;
  for (var i = 0; i < 16; i++) {
      o[i] += 65536;
      c = Math_floor(o[i] / 65536);
      o[(i+1)*(i<15)] += c - 1 + 37 * (c-1) * (i==15);
      o[i] -= (c * 65536);
  }
}

function sel25519(p, q, b) {
  var t, c = ~(b-1);
  for (var i = 0; i < 16; i++) {
    t = c & (p[i] ^ q[i]);
    p[i] ^= t;
    q[i] ^= t;
  }
}

function pack25519(o, n) {
  var i, j, b, m = new gf(), t = new gf();
  for (i = 0; i < 16; i++) t[i] = n[i];
  car25519(t);
  car25519(t);
  car25519(t);
  for (j = 0; j < 2; j++) {
    m[0] = t[0] - 65517;
    for (i = 1; i < 15; i++) {
      m[i] = t[i] - 65535 - ((m[i-1]>>16) & 1);
      m[i-1] &= 65535;
    }
    m[15] = t[15] - 32767 - ((m[14]>>16) & 1);
    b = (m[15]>>16) & 1;
    m[14] &= 65535;
    sel25519(t, m, 1-b);
  }
  for (i = 0; i < 16; i++) {
    o[2*i] = t[i] & 255;
    o[2*i+1] = t[i]>>8;
  }
}

function A(o, a, b) {
  var i = 16;
  while (i--) {
    // make sure it's a number
    o[i] = (a[i]|0) + (b[i]|0);
  }
}

function Z(o, a, b) {
  var i = 16;
  while (i--) {
    o[i] = (a[i]|0) - (b[i]|0);
  }
}

function M(o, a, b) {
  var i, j, t = [];
  i = 31; while(i--) t[i] = 0;
  for (i = 0; i < 16; i++) {
    for (j = 0; j < 16; j++) {
      t[i+j] += a[i] * b[j];
    }
  }
  for (i = 0; i < 15; i++) {
    t[i] += 38 * t[i+16];
  }
  i = 16; while(i--) o[i] = t[i];
  car25519(o);
  car25519(o);
}

function S(o, a) {
  M(o, a, a);
}

function inv25519(o, i) {
  var c = new gf(), a;
  a = 16; while (a--) c[a] = i[a];
  a = 253;
  do {
    S(c, c);
    if(a != 2 && a != 4) M(c, c, i);
  } while (a--);
  a = 16; while (a--) o[a] = c[a];
}

function unpack25519(o, n) {
  for (var i = 0; i < 16; i++) {
    o[i] = n[2*i] + (n[2*i+1] << 8);
  }
  o[15] &= 32767;
}

function add(p, q) {
  var a = new gf(), b = new gf(), c = new gf(),
      d = new gf(), e = new gf(), f = new gf(),
      g = new gf(), h = new gf(), t = new gf();

  Z(a, p[1], p[0]);
  Z(t, q[1], q[0]);
  M(a, a, t);
  A(b, p[0], p[1]);
  A(t, q[0], q[1]);
  M(b, b, t);
  M(c, p[3], q[3]);
  M(c, c, D2);
  M(d, p[2], q[2]);
  A(d, d, d);
  Z(e, b, a);
  Z(f, d, c);
  A(g, d, c);
  A(h, b, a);
  M(p[0], e, f);
  M(p[1], h, g);
  M(p[2], g, f);
  M(p[3], e, h);
}

function cswap(p, q, b) {
  for (var i = 0; i < 4; i++) {
    sel25519(p[i], q[i], b);
  }
}

function par25519(a) {
  var d = new Array(32);
  pack25519(d, a);
  return d[0] & 1;
}

function pack(r, p) {
  var tx = new gf(), ty = new gf(), zi = new gf();
  inv25519(zi, p[2]);
  M(tx, p[0], zi);
  M(ty, p[1], zi);
  pack25519(r, ty);
  r[31] ^= par25519(tx) << 7;
}

function set25519(r, a) {
  var i = 16; while(i--) r[i] = a[i]|0;
}

function scalarmult(p, q, s) {
  var b;
  set25519(p[0], gf0);
  set25519(p[1], gf1);
  set25519(p[2], gf1);
  set25519(p[3], gf0);
  var i = 255;
  do {
    b = (s[(i/8)|0] >> (i&7)) & 1;
    cswap(p, q, b);
    add(q, p);
    add(p, p);
    cswap(p, q, b);
  } while (i--);
}

function scalarbase(p, s) {
  var i = 4, q = [];
  while (i--) q[i] = new gf();
  set25519(q[0], X);
  set25519(q[1], Y);
  set25519(q[2], gf1);
  M(q[3], X, Y);
  scalarmult(p, q, s);
}

function crypto_sign_keypair(pk, sk, seed) {
  var p = [], d = new Array(64), skseed = [];
  var i = 4; while(i--) p[i] = new gf();

  if (typeof seed !== 'undefined') {
    skseed = skseed.concat(seed);
  } else {
    randombytes(skseed, 0, 32);
  }

  crypto_hash(d, skseed, 32);
  d[0] &= 248;
  d[31] &= 127;
  d[31] |= 64;

  scalarbase(p, d);
  pack(pk, p);

  for (i = 0; i < 32; i++) {
    sk[i] = skseed[i];
    sk[i+32] = pk[i];
  }
}

var L = [237,211,245,92,26,99,18,88,214,156,247,162,222,249,222,20,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,16];
var Math_floor = Math.floor;

function modL(r, x) {
  var carry, i, j, k;
  for (i = 63; i >= 32; --i) {
    carry = 0;
    for (j = i - 32, k = i - 12; j < k; ++j) {
      x[j] += carry - 16 * x[i] * L[j - (i - 32)];
      carry = Math_floor((x[j] + 128) / 256);
      x[j] -= carry * 256;
    }
    x[j] += carry;
    x[i] = 0;
  }
  carry = 0;
  for (j = 0; j < 32; j++) {
    x[j] += carry - Math_floor(x[31]/16) * L[j];
    carry = Math_floor(x[j] / 256);
    x[j] &= 255;
  }
  for (j = 0; j < 32; j++) x[j] -= carry * L[j];
  for (i = 0; i < 32; i++) {
    x[i+1] += Math_floor(x[i] / 256);
    r[i] = x[i] & 255;
  }
}

function reduce(r) {
  var x = new Array(64), i = 64;
  while (i--) {
    x[i] = r[i];
    r[i] = 0;
  }
  modL(r, x);
}

function crypto_sign(sm, m, n, sk) {
  var d = new Array(64),
      h = new Array(64),
      r = new Array(64),
      x = new Array(64),
      p = [], j;

  var i = 4; while (i--) p[i] = new gf();

  crypto_hash(d, sk, 32);
  d[0] &= 248;
  d[31] &= 127;
  d[31] |= 64;

  // passing smlen as arguments doesn't work (at my box),
  // smlen moved as return
  var smlen = n + 64;

  for (i = 0; i < n; i++) sm[64 + i] = m[i];
  for (i = 0; i < 32; i++) sm[32 + i] = d[32 + i];

  crypto_hash(r, sm.slice(32), n+32);
  reduce(r);
  scalarbase(p, r);
  pack(sm, p);

  for (i = 32; i < 64; i++) sm[i] = sk[i];
  crypto_hash(h, sm, n + 64);
  reduce(h);

  i = 64; while(i--) x[i] = 0;
  i = 32; while(i--) x[i] = r[i];

  for (i = 0; i < 32; i++) {
    for (j = 0; j < 32; j++) {
      x[i+j] += h[i] * d[j];
    }
  }

  var xrest = new Array(32);
  modL(xrest, x);
  for (i = 0; i < 32; i++) {
      sm[i+32] = xrest[i];
  }
  return smlen;
}

function pow2523(o, i) {
  var c = new gf(), a;
  var a = 16; while(a--) c[a] = i[a];
  a = 250;
  do {
      S(c, c);
      if(a != 1) M(c, c, i);
  } while (a--);
  a = 16; while(a--) o[a] = c[a];
}

function neq25519(a, b) {
  var c = new Array(32),
      d = new Array(32);
  pack25519(c, a);
  pack25519(d, b);
  return crypto_verify_32(c, 0, d, 0);
}

function unpackneg(r, p) {
  var t = new gf(), chk = new gf(), num = new gf(),
      den = new gf(), den2 = new gf(), den4 = new gf(),
      den6 = new gf();

  set25519(r[2], gf1);
  unpack25519(r[1], p);
  S(num, r[1]);
  M(den, num, D);
  Z(num, num, r[2]);
  A(den, r[2], den);

  S(den2, den);
  S(den4, den2);
  M(den6, den4, den2);
  M(t, den6, num);
  M(t, t, den);

  pow2523(t, t);
  M(t, t, num);
  M(t, t, den);
  M(t, t, den);
  M(r[0], t, den);

  S(chk, r[0]);
  M(chk, chk, den);
  if (neq25519(chk, num)) M(r[0], r[0], I);

  S(chk, r[0]);
  M(chk, chk, den);
  if (neq25519(chk, num)) return -1;

  if (par25519(r[0]) == (p[31]>>7)) Z(r[0], gf0, r[0]);

  M(r[3], r[0], r[1]);
  return 0;
}

function crypto_sign_open(m, sm, n, pk) {
  var i, t = new Array(32),
      h = new Array(64),
      p = [], q = [],
      x = [];

  i = 4;
  while (i--) {
    p[i] = new gf();
    q[i] = new gf();
  }

  //mlen = -1; // doesn't work
  if (n < 64) return -1;

  if (unpackneg(q, pk)) return false;
  for (i = 0; i < n; i++) x[i] = sm[i];
  for (i = 0; i < 32; i++) x[i+32] = pk[i];

  crypto_hash(h, x, n);
  reduce(h);
  scalarmult(p, q, h);

  scalarbase(q, sm.slice(32));
  add(p, q);
  pack(t, p);

  n -= 64;
  if (crypto_verify_32(sm, 0, t, 0)) return false;

  //mlen = n;
  for (i = 0; i < n; i++) {
    m[i] = sm[i + 64];
  }

  return true;
}

var crypto_secretbox_KEYBYTES = 32,
    crypto_secretbox_NONCEBYTES = 24,
    crypto_secretbox_ZEROBYTES = 32,
    crypto_secretbox_BOXZEROBYTES = 16,
    crypto_scalarmult_BYTES = 32,
    crypto_scalarmult_SCALARBYTES = 32,
    crypto_box_PUBLICKEYBYTES = 32,
    crypto_box_SECRETKEYBYTES = 32,
    crypto_box_BEFORENMBYTES = 32,
    crypto_box_NONCEBYTES = crypto_secretbox_NONCEBYTES,
    crypto_box_ZEROBYTES = crypto_secretbox_ZEROBYTES,
    crypto_box_BOXZEROBYTES = crypto_secretbox_BOXZEROBYTES,
    crypto_sign_BYTES = 64,
    crypto_sign_PUBLICKEYBYTES = 32,
    crypto_sign_SECRETKEYBYTES = 64;

exports.crypto_stream_xor = crypto_stream_xor;
exports.crypto_stream = crypto_stream;
exports.crypto_stream_salsa20_xor = crypto_stream_salsa20_xor;
exports.crypto_stream_salsa20 = crypto_stream_salsa20;
exports.crypto_onetimeauth = crypto_onetimeauth;
exports.crypto_onetimeauth_verify = crypto_onetimeauth_verify;
exports.crypto_verify_16 = crypto_verify_16;
exports.crypto_verify_32 = crypto_verify_32;
exports.crypto_secretbox = crypto_secretbox;
exports.crypto_secretbox_open = crypto_secretbox_open;
exports.crypto_scalarmult = crypto_scalarmult;
exports.crypto_scalarmult_base = crypto_scalarmult_base;
exports.crypto_box_beforenm = crypto_box_beforenm;
exports.crypto_box_afternm = crypto_box_afternm;
exports.crypto_box = crypto_box;
exports.crypto_box_open = crypto_box_open;
exports.crypto_box_keypair = crypto_box_keypair;
exports.crypto_hash = crypto_hash;
exports.crypto_sign = crypto_sign;
exports.crypto_sign_keypair = crypto_sign_keypair;
exports.crypto_sign_open = crypto_sign_open;

exports.crypto_secretbox_KEYBYTES = crypto_secretbox_KEYBYTES;
exports.crypto_secretbox_NONCEBYTES = crypto_secretbox_NONCEBYTES;
exports.crypto_secretbox_ZEROBYTES = crypto_secretbox_ZEROBYTES;
exports.crypto_secretbox_BOXZEROBYTES = crypto_secretbox_BOXZEROBYTES;
exports.crypto_scalarmult_BYTES = crypto_scalarmult_BYTES;
exports.crypto_scalarmult_SCALARBYTES = crypto_scalarmult_SCALARBYTES;
exports.crypto_box_PUBLICKEYBYTES = crypto_box_PUBLICKEYBYTES;
exports.crypto_box_SECRETKEYBYTES = crypto_box_SECRETKEYBYTES;
exports.crypto_box_BEFORENMBYTES = crypto_box_BEFORENMBYTES;
exports.crypto_box_NONCEBYTES = crypto_box_NONCEBYTES;
exports.crypto_box_ZEROBYTES = crypto_box_ZEROBYTES;
exports.crypto_box_BOXZEROBYTES = crypto_box_BOXZEROBYTES;
exports.crypto_sign_BYTES = crypto_sign_BYTES;
exports.crypto_sign_PUBLICKEYBYTES = crypto_sign_PUBLICKEYBYTES;
exports.crypto_sign_SECRETKEYBYTES = crypto_sign_SECRETKEYBYTES;


// Additions.
exports.crypto_randombytes = randombytes;

/* Encodings */

function bytesFromUTF8(s) {
  var b = [], i;
  s = unescape(encodeURIComponent(s));
  for (i = 0; i < s.length; i++) b.push(s.charCodeAt(i));
  return b;
}

function bytesToUTF8(b) {
  var s = [], i;
  for (i = 0; i < b.length; i++) s.push(String.fromCharCode(b[i]));
  return decodeURIComponent(escape(s.join('')));
}

function getBytes(s) {
  return (typeof s === 'string') ? bytesFromUTF8(s) : s;
}

function encodeBase64(b) {
  var i, s = [], len = b.length;
  if (typeof btoa === 'undefined') {
    return (new Buffer(b)).toString('base64');
  }
  for (i = 0; i < len; i++) s.push(String.fromCharCode(b[i]));
  return btoa(s.join(''));
}

function decodeBase64(s) {
  var b = [], i;
  if (typeof atob === 'undefined') {
    return Array.prototype.slice.call(new Buffer(s, 'base64'), 0);
  }
  s = atob(s);
  for (i = 0; i < s.length; i++) b.push(s.charCodeAt(i));
  return b;
}

function checkLengths(k, n) {
  if (k.length !== crypto_secretbox_KEYBYTES)
    throw new Error('bad key size');
  if (n.length !== crypto_secretbox_NONCEBYTES)
    throw new Error('bad nonce size');
}

function checkPairLengths(pk, sk) {
  if (pk.length !== crypto_box_PUBLICKEYBYTES)
    throw new Error('bad public key size');
  if (sk.length !== crypto_box_SECRETKEYBYTES)
    throw new Error('bad secret key size');
}

/* High-level API */
exports.secretbox = exports.secretbox || {};

exports.secretbox.seal = function(msg, nonce, key) {
  var i, m = [], c = [], k, n;
  for (i = 0; i < crypto_secretbox_ZEROBYTES; i++) m.push(0);
  m = m.concat(getBytes(msg));
  k = getBytes(key);
  n = getBytes(nonce);
  checkLengths(k, n);
  crypto_secretbox(c, m, m.length, n, k);
  return encodeBase64(c.slice(crypto_secretbox_BOXZEROBYTES));
};

exports.secretbox.open = function(box, nonce, key) {
  var i, m = [], c = [], k, n;
  for (i = 0; i < crypto_secretbox_BOXZEROBYTES; i++) c.push(0); 
  try { c = c.concat(decodeBase64(box)); } catch(e) { return false; }
  if (c.length < 32) return false;
  k = getBytes(key);
  n = getBytes(nonce);
  checkLengths(k, n);
  if (!crypto_secretbox_open(m, c, c.length, n, k)) return false;
  return bytesToUTF8(m.slice(crypto_secretbox_ZEROBYTES));
};

exports.box = exports.box || {};

exports.box.before = function(publicKey, secretKey) {
  var pk = getBytes(publicKey);
  var sk = getBytes(secretKey);
  var k = [];
  checkPairLengths(pk, sk);
  crypto_box_beforenm(k, pk, sk);
  return k;
};

exports.box.sealAfter = exports.secretbox.seal;
exports.box.openAfter = exports.secretbox.open;

exports.box.seal = function(msg, nonce, publicKey, secretKey) {
  var k = exports.box.before(publicKey, secretKey);
  return exports.secretbox.seal(msg, nonce, k);
};

exports.box.open = function(msg, nonce, publicKey, secretKey) {
  var k = exports.box.before(publicKey, secretKey);
  return exports.secretbox.open(msg, nonce, k);
};

exports.sign = exports.sign || {};

exports.sign = function(msg, key) {
  var m = getBytes(msg);
  var k = getBytes(key);
  if (k.length !== crypto_sign_SECRETKEYBYTES) {
    throw new Error('bad key size');
  }
  var mlen = m.length;
  var sm = new Array(64+mlen);
  crypto_sign(sm, m, mlen, k);
  return encodeBase64(sm.slice(0,64));
};

exports.sign.open = function(msg, signature, publickey) {
  var sig;
  try { sig = decodeBase64(signature);} catch(e) { return false; }
  if (sig.length !== crypto_sign_BYTES) {
    throw new Error('bad signature size');
  }
  var pk = getBytes(publickey);
  if (pk.length !== crypto_sign_PUBLICKEYBYTES) {
    throw new Error('bad publickey size');
  }
  sig = sig.concat(getBytes(msg));
  var m = [];
  if (!crypto_sign_open(m, sig, sig.length, pk)) return false;
  return bytesToUTF8(m);
};

})(typeof exports !== 'undefined' ? exports : (window.nacl = window.nacl || {}));
