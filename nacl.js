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
  if (d < 32) throw new Error("crypto_secretbox: d < 32");
  crypto_stream_xor(c,0,m,0,d,n,k);
  crypto_onetimeauth(c, 16, c, 32, d - 32, c);
  for(i = 0; i < 16; i++) c[i] = 0;
}

function crypto_secretbox_open(m,c,d,n,k) {
  var i;
  var x = [];
  if (d < 32) throw new Error("crypto_secretbox_open: d < 32");
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

// crypto_scalarmult(q, qpos, n, npos, p, ppos)
//
// This function multiplies a group element
//   p[ppos], ..., p[ppos+crypto_scalarmult_BYTES-1]
// by an integer
//   n[npos], ..., n[npos+crypto_scalarmult_SCALARBYTES-1]
// and puts the resulting group element into
//   q[qpos], ..., q[qpos+crypto_scalarmult_BYTES-1].
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

  return function(q, qpos, n, npos, p, ppos) {
    var work = [], e = [], i;
    for (i = 0; i < 32; ++i) e[i] = n[npos+i];
    e[0] &= 248;
    e[31] &= 127;
    e[31] |= 64;
    for (i = 0; i < 32; ++i) work[i] = p[ppos+i];
    mainloop(work, 0, e, 0);
    recip(work, 32, work, 32);
    mult(work, 64, work, 0, work, 32);
    freeze(work, 64);
    for (i = 0; i < 32; ++i) q[qpos+i] = work[64 + i];
  };

})();

function crypto_scalarmult_base(q, qpos, n, npos) {
  var base = [9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  crypto_scalarmult(q, qpos, n, npos, base, 0);
}

function randombytes(x, xpos, n) {
  var values = null;
  if (typeof window !== 'undefined' && window.crypto) {
    values = window.crypto.getRandomValues(new Uint8Array(n));
  } else if (typeof require !== 'undefined') {
    var prng = require('crypto');
    values = prng ? prng.randomBytes(n) : null;
  } else {
    throw new Error("no random number generator found");
  }
  if (!values || values.length !== n) {
    throw new Error("failed to generate random bytes");
  }
  for (var i = 0; i < values.length; i++) x[xpos+i] = values[i];
}

function crypto_box_keypair(y, x) {
  randombytes(x, 0, 32);
  crypto_scalarmult_base(y, 0, x, 0);
}

function crypto_box_beforenm(k, y, x) {
  var s = [];
  var _0 = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  crypto_scalarmult(s, 0, x, 0, y, 0);
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
    crypto_box_BOXZEROBYTES = crypto_secretbox_BOXZEROBYTES;

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
  if (k.length != crypto_secretbox_KEYBYTES)
    throw new Error('bad key length');
  if (n.length != crypto_secretbox_NONCEBYTES)
    throw new Error('bad nonce length');
}

function checkPairLengths(pk, sk) {
  if (pk.length != crypto_box_PUBLICKEYBYTES)
    throw new Error('bad public key length');
  if (sk.length != crypto_box_SECRETKEYBYTES)
    throw new Error('bad secret key length');
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

})(typeof exports !== 'undefined' ? exports : (window.nacl = window.nacl || {}));
