function(exports) {

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

function crypto_stream_salsa20_xor(c,m,b,n,k) {
  var z = [], x = [];
  var u, i;
  if (!b) return;
  for(i = 0; i < 16; i++) z[i] = 0;
  for(i = 0; i < 8; i++) z[i] = n[i];
  mpos = 0;
  cpos = 0;
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

function crypto_stream_salsa20(c,d,n,k) {
  crypto_stream_salsa20_xor(c,null,d,n,k);
}

function crypto_stream(c,d,n,k) {
  var i, s = [], subn = [];
  crypto_core_hsalsa20(s,n,k,sigma);
  for(i = 0; i < 8; i++) subn[i] = n[16+i];
  crypto_stream_salsa20(c,d,subn,s);
}

function crypto_stream_xor(c,m,d,n,k) {
  var i, s = [], subn = [];
  crypto_core_hsalsa20(s,n,k,sigma);
  for(i = 0; i < 8; i++) subn[i] = n[16+i];
  crypto_stream_salsa20_xor(c,m,d,subn,s);
}

exports.crypto_stream_xor = crypto_stream_xor;
exports.crypto_stream = crypto_stream_xor;
exports.crypto_stream_salsa20_xor = crypto_stream_salsa20_xor;
exports.crypto_stream_salsa20 = crypto_stream_salsa20;

}(typeof exports !== 'undefined' ? exports : window.nacl || window.nacl = {});
