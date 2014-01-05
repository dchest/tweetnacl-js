(function(exports) {

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
  }

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

function vn(x, xpos, y, ypos, n)
{
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
  if (crypto_onetimeauth_verify(c, 16,c, 32,d - 32,x) != 0) return false;
  crypto_stream_xor(m,0,c,0,d,n,k);
  for(i = 0; i < 32; i++) m[i] = 0;
  return true;
}

exports.crypto_stream_xor = crypto_stream_xor;
exports.crypto_stream = crypto_stream;
exports.crypto_stream_salsa20_xor = crypto_stream_salsa20_xor;
exports.crypto_stream_salsa20 = crypto_stream_salsa20;
exports.crypto_onetimeauth = crypto_onetimeauth;
exports.crypto_onetimeauth_verify = crypto_onetimeauth_verify;
exports.crypto_secretbox = crypto_secretbox;
exports.crypto_secretbox_open = crypto_secretbox_open;
exports.crypto_secretbox_KEYBYTES = 32;
exports.crypto_secretbox_NONCEBYTES = 24;
exports.crypto_secretbox_ZEROBYTES = 32;
exports.crypto_secretbox_BOXZEROBYTES = 16;

})(typeof exports !== 'undefined' ? exports : (window.nacl = window.nacl || {}));
