var nacl = (typeof require !== 'undefined') ? require('./nacl-include') : window.nacl;
var helpers = (typeof require !== 'undefined') ? require('./helpers') : window.helpers;
var log = helpers.log;

if (!nacl) throw new Error('nacl not loaded');

/*
 * Test and benchmark.
 */

function crypto_stream_xor_test() {
  log.start('Testing crypto_stream_xor');
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
    nacl.lowlevel.crypto_stream_xor(out, 0, new Uint8Array(golden[i].m), 0, golden[i].m.length, new Uint8Array(golden[i].n), new Uint8Array(golden[i].k));
    if (!helpers.bytesEqual(out, golden[i].out)) {
      log.error(i, 'differ\n', 'expected', golden[i].out, 'got', out);
    } else {
      log.ok();
    }
  }

}

function crypto_stream_test() {
  log.start('Testing crypto_stream');
  // Compare it with crypto_stream_xor with zero-filled array.
  var i;
  var out = new Uint8Array(77);
  var outx = new Uint8Array(77);
  var inx = new Uint8Array(77);
  var k = new Uint8Array(32);
  for (i = 0; i < k.length; i++) k[i] = i;
  var n = new Uint8Array(24);
  for (i = 0; i < n.length; i++) n[i] = i+32;
  nacl.lowlevel.crypto_stream(out, 0, out.length, n, k);
  nacl.lowlevel.crypto_stream_xor(outx, 0, inx, 0, inx.length, n, k);
  if (!helpers.bytesEqual(out, outx)) {
    log.error('differ! expected', outx, 'got', out);
  } else {
    log.ok();
  }
}

function crypto_onetimeauth_test() {
  helpers.log.start('Testing crypto_onetimeauth');
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
  for (i = 0; i < golden.length; i++) {
    var out = [];
    nacl.lowlevel.crypto_onetimeauth(out, 0, golden[i].m, 0, golden[i].m.length, golden[i].k);
    if (!helpers.bytesEqual(out, golden[i].out)) {
      log.error(i, 'differ', 'expected', golden[i].out, 'got', out);
    } else {
      log.ok();
    }
  }
}

function crypto_secretbox_test() {
  log.start('Testing crypto_secretbox');
  var i, k = new Uint8Array(32),
         n = new Uint8Array(24),
         m = new Uint8Array(64 + nacl.lowlevel.crypto_secretbox_ZEROBYTES),
         c = new Uint8Array(64 + nacl.lowlevel.crypto_secretbox_ZEROBYTES);
  for (i = 0; i < 32; i++) k[i] = 1;
  for (i = 0; i < 24; i++) n[i] = 2;
  for (i = 0; i < 64; i++) m[i+nacl.lowlevel.crypto_secretbox_ZEROBYTES] = 3;

  nacl.lowlevel.crypto_secretbox(c, m, m.length, n, k);

  var golden = new Uint8Array([132, 66, 188, 49, 63, 70, 38, 241, 53, 158, 59, 80, 18, 43,
    108, 230, 254, 102, 221, 254, 125, 57, 209, 78, 99, 126, 180, 253, 91, 69,
    190, 173, 171, 85, 25, 141, 246, 171, 83, 104, 67, 151, 146, 162, 60, 135,
    219, 112, 172, 182, 21, 109, 197, 239, 149, 122, 192, 79, 98, 118, 207, 96,
    147, 184, 75, 231, 127, 240, 132, 156, 195, 62, 52, 183, 37, 77, 90, 143,
    101, 173]);

  // Unpad c.
  out = c.subarray(nacl.lowlevel.crypto_secretbox_BOXZEROBYTES);

  if (!helpers.bytesEqual(out, golden)) {
    log.error('differ! expected', golden, 'got', out);
  } else {
    log.ok();
  }

  // Try opening.
  var opened = new Uint8Array(m.length);
  if (nacl.lowlevel.crypto_secretbox_open(opened, c, c.length, n, k) !== 0) {
    log.error('open failed');
  } else {
    log.ok();
  }
  if (!helpers.bytesEqual(opened, m)) {
    log.error('differ! expected', m, 'got', opened);
  } else {
    log.ok();
  }

  for (i = 0; i < 10; i++) c[i] = 0;
  if (nacl.lowlevel.crypto_secretbox_open(opened, c, c.length, m, k) === 0) {
    log.error('opened invalid secretbox');
  } else {
    log.ok();
  }
}

function secretbox_seal_open_test() {
  log.start('Testing secretbox and secretbox.open');
  var key = nacl.util.decodeUTF8('12345678901234567890123456789012');
  var nonce = nacl.util.decodeUTF8('123456789012345678901234');
  var msg = nacl.util.decodeUTF8('привет!');
  var box = nacl.secretbox(msg, nonce, key);
  var dec = nacl.secretbox.open(box, nonce, key);
  if (helpers.bytesEqual(msg, dec))
    log.ok();
  else
    log.error('expected ', msg, 'got', dec);
}

function crypto_scalarmult_base_test_long() {
  // This takes takes a bit of time.
  // Similar to https://code.google.com/p/go/source/browse/curve25519/curve25519_test.go?repo=crypto
  log.start('Testing crypto_scalarmult_base (long test)');
  var golden = [0x89, 0x16, 0x1f, 0xde, 0x88, 0x7b, 0x2b, 0x53, 0xde, 0x54,
    0x9a, 0xf4, 0x83, 0x94, 0x01, 0x06, 0xec, 0xc1, 0x14, 0xd6, 0x98, 0x2d,
    0xaa, 0x98, 0x25, 0x6d, 0xe2, 0x3b, 0xdf, 0x77, 0x66, 0x1a];
  var input = [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  var output = [];
  for (var j = 0; j < 200; j++) {
    nacl.lowlevel.crypto_scalarmult_base(output, input);
    var tmp = input; input = output; output = tmp;
  }
  if (!helpers.bytesEqual(input, golden)) {
    log.error('differ! expected', golden, 'got', out);
  } else {
    log.ok();
  }
}

function crypto_scalarmult_base_test() {
  log.start('Testing crypto_scalarmult_base');
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
    nacl.lowlevel.crypto_scalarmult_base(out, golden[i].n);
    if (!helpers.bytesEqual(out, golden[i].q)) {
      log.error(i, 'differ\n', 'expected', golden[i].q, 'got', out);
    } else {
      log.ok();
    }
  }
}

function scalarMultBase_test() {
  log.start('Testing nacl.scalarMult.base');
  var golden = [
    {
      q: new Uint8Array([143, 64, 197, 173, 182, 143, 37, 98, 74, 229, 178, 20, 234, 118, 122, 110,
          201, 77, 130, 157, 61, 123, 94, 26, 209, 186, 111, 62, 33, 56, 40, 95]),
      n: new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
        20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31])
    }
  ];
  for (var i = 0; i < golden.length; i++) {
    var out = nacl.scalarMult.base(golden[i].n);
    if (!helpers.bytesEqual(out, golden[i].q)) {
      log.error(i, 'differ\n', 'expected', golden[i].q, 'got', out);
    } else {
      log.ok();
    }
  }
}

function scalarMult_test() {
  log.start('Testing nacl.scalarMult');
  var golden = [
    {
      q: new Uint8Array([143, 64, 197, 173, 182, 143, 37, 98, 74, 229, 178, 20, 234, 118, 122, 110,
          201, 77, 130, 157, 61, 123, 94, 26, 209, 186, 111, 62, 33, 56, 40, 95]),
      n: new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
        20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31]),
      p: new Uint8Array([9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0])
    }
  ];
  for (var i = 0; i < golden.length; i++) {
    var out = nacl.scalarMult(golden[i].n, golden[i].p);
    if (!helpers.bytesEqual(out, golden[i].q)) {
      log.error(i, 'differ\n', 'expected', golden[i].q, 'got', out);
    } else {
      log.ok();
    }
  }
}

function randomBytes_test() {
  log.start('Testing nacl.randomBytes');
  var t = {}, s, i;
  for (i = 0; i < 10000; i++) {
    s = nacl.util.encodeBase64(nacl.randomBytes(32));
    if (t[s]) {
      log.error("duplicate random sequence! ", s);
      return;
    }
    t[s] = true;
  }
  log.ok();
}

function randomBytes_test() {
  log.start('Testing nacl.randomBytes');
  var x1 = nacl.randomBytes(49);
  if (x1.length != 49) {
    log.error('bad random array length');
  } else {
    log.ok();
  }
  var x2 = nacl.randomBytes(49);
  if (helpers.bytesEqual(x1, x2)) {
    log.log('random bytes equal!');
  } else {
    log.ok();
  }
}

function box_seal_open_test() {
  log.start('Testing box and box.open');
  var golden = 'eOowsZ0jQeu9ulQYD4Ie7CZc+GMSVJvqijdlKou5Twe3inPtFwgIXm' +
               '3dDpQ7veuHVQeaN+sx2GFjziQRZKR2KcBTnzMLSRTNE1s4VbwqLfw=';
  var sk1 = new Uint8Array(nacl.box.secretKeyLength),
      sk2 = new Uint8Array(nacl.box.secretKeyLength),
      i;
  for (i = 0; i < 32; i++) {
    sk1[i] = 1;
    sk2[i] = 2;
  }
  var pk1 = new Uint8Array(nacl.box.publicKeyLength);
  nacl.lowlevel.crypto_scalarmult_base(pk1, sk1);
  var msg = new Uint8Array(64);
  for (i = 0; i < 64; i++) msg[i] = 3;
  var nonce = new Uint8Array(24);
  for (i = 0; i < 24; i++) nonce[i] = 4;
  var box = nacl.box(msg, nonce, pk1, sk2);
  var eb = nacl.util.encodeBase64(box);
  if (eb != golden) {
    log.error('differ! expected', golden, 'got', eb);
  } else {
    log.ok();
  }

  var opened = nacl.box.open(box, nonce, pk1, sk2);
  if (opened === false) {
    log.error('failed to open box');
  } else {
    log.ok();
  }
  var badpk = nacl.box.keyPair().publicKey;
  if (nacl.box.open(box, nonce, badpk, sk2) !== false) {
    log.error('opened box with bad key');
  } else {
    log.ok();
  }
}

function sign_open_test() {
  log.start('Testing sign and sign.open');
  var keys = nacl.sign.keyPair();
  var msg = nacl.util.decodeUTF8("test message");
  var sig = nacl.sign(msg, keys.secretKey);
  var result = nacl.sign.open(msg, sig, keys.publicKey);
  if (!result) {
    log.error("verification failed");
  } else {
    log.ok();
  }

  var vec = {
    sk: [81,98,70,175,109,25,23,152,230,95,239,157,167,162,65,141,224,105,131,236,19,4,100,86,132,201,75,63,157,6,105,73,53,224,113,12,118,167,75,110,233,167,113,236,118,198,203,104,197,153,59,62,241,46,189,109,226,158,102,8,84,43,154,166],
    pk: [53,224,113,12,118,167,75,110,233,167,113,236,118,198,203,104,197,153,59,62,241,46,189,109,226,158,102,8,84,43,154,166],
    msg: nacl.util.decodeUTF8("xxxxxxxxxxxxxxxxxxxxxxxxxxxx"),
    sig: "7Mh/TpgCjZloCwL/WV8x387bB3CCKLGWyKhGqqx61n62ld/LSmXKNRyWjavuVrM/ILmEK1fazKCA3OQXZLymAQ=="
  };
  sig = nacl.util.encodeBase64(nacl.sign(new Uint8Array(vec.msg), new Uint8Array(vec.sk)));
  if (sig != vec.sig) {
    log.error("bad signature!\nexpected\n", vec.sig, "\ngot\n", sig);
  } else {
    log.ok();
  }
}

function crypto_hashblocks_test() {
  var m, n, h, eh, ex, i, j;
  log.start('Testing crypto_hashblocks');
  for (i = 0; i < 5; i++) { // same test
    m = new Uint8Array(128);
    n = m.length;
    h = new Uint8Array(64);
    nacl.lowlevel.crypto_hashblocks(h, m, n);
    eh = nacl.util.encodeBase64(h);
    ex = 'rTpdqDjr+DBdcUL/hfy+23+ov4bW98qZHGsVsDnXC78p9lFSiZI1GG/XEB1fLo86HDWNJHZTFFBWjA2Z11bcPA==';
    if (eh != ex) {
      log.error('hashblocks differ\n', ex, '\n', eh, '\n');
    } else {
      log.ok();
    }
  }
}


function crypto_hash_test() {
  log.start('Testing crypto_hash');
  // golden taken from https://code.google.com/p/go/source/browse/src/pkg/crypto/sha512/sha512_test.go
  var golden = [
    [[207,131,225,53,126,239,184,189,241,84,40,80,214,109,128,7,214,32,228,5,11,87,21,220,131,244,169,33,211,108,233,206,71,208,209,60,93,133,242,176,255,131,24,210,135,126,236,47,99,185,49,189,71,65,122,129,165,56,50,122,249,39,218,62 ],[]],
    [[31,64,252,146,218,36,22,148,117,9,121,238,108,245,130,242,213,215,210,142,24,51,93,224,90,188,84,208,86,14,15,83,2,134,12,101,43,240,141,86,2,82,170,94,116,33,5,70,243,105,251,187,206,140,18,207,199,149,123,38,82,254,154,117 ],[ 97]],
    [[45,64,138,7,23,236,24,129,88,39,138,121,108,104,144,68,54,29,198,253,222,40,214,240,73,115,184,8,150,225,130,57,117,205,191,18,235,99,249,224,89,19,40,238,35,93,128,233,181,191,26,166,164,79,70,23,255,60,175,100,0,235,23,45 ],[ 97,98]],
    [[221,175,53,161,147,97,122,186,204,65,115,73,174,32,65,49,18,230,250,78,137,169,126,162,10,158,238,230,75,85,211,154,33,146,153,42,39,79,193,168,54,186,60,35,163,254,235,189,69,77,68,35,100,60,232,14,42,154,201,79,165,76,164,159 ],[ 97,98,99]],
    [[216,2,47,32,96,173,110,253,41,122,183,61,204,83,85,201,178,20,5,75,13,23,118,161,54,166,105,210,106,125,59,20,247,58,160,208,235,255,25,238,51,51,104,240,22,75,100,25,169,109,164,158,62,72,23,83,231,233,107,113,107,220,203,111 ],[ 97,98,99,100]],
    [[135,138,230,90,146,232,108,172,1,26,87,13,76,48,167,234,236,68,43,133,206,142,202,12,41,82,181,227,204,6,40,194,231,157,136,154,212,213,199,198,38,152,109,69,45,216,99,116,182,255,170,124,216,182,118,101,190,242,40,154,92,112,176,161 ],[ 97,98,99,100,101]],
    [[227,46,241,150,35,232,237,157,38,127,101,122,129,148,75,61,7,173,187,118,133,24,6,142,136,67,87,69,86,78,141,65,80,160,167,3,190,42,125,136,182,30,61,57,12,43,185,126,45,76,49,31,220,105,214,177,38,127,5,245,154,169,32,231 ],[ 97,98,99,100,101,102]],
    [[215,22,164,24,133,105,182,138,177,182,223,172,23,142,87,1,20,205,240,234,58,28,192,227,20,134,195,228,18,65,188,106,118,66,78,140,55,171,38,240,150,252,133,239,152,134,200,203,99,65,135,244,253,223,246,69,251,9,159,31,245,76,107,140 ],[ 97,98,99,100,101,102,103]],
    [[163,168,200,27,201,124,37,96,1,13,115,137,188,136,170,201,116,161,4,224,226,56,18,32,198,224,132,196,220,205,29,45,23,212,248,109,179,28,42,133,29,200,14,102,129,215,71,51,197,93,205,3,221,150,246,6,44,221,161,42,41,26,230,206 ],[ 97,98,99,100,101,102,103,104]],
    [[242,45,81,210,82,146,202,29,15,104,246,154,237,199,137,112,25,48,140,201,219,70,239,183,90,3,221,73,79,199,241,38,192,16,232,173,230,160,10,12,26,95,27,117,216,30,14,213,169,60,233,141,201,184,51,219,120,57,36,123,29,156,36,254 ],[ 97,98,99,100,101,102,103,104,105]],
    [[239,107,151,50,31,52,177,254,162,22,154,125,185,225,150,11,71,26,161,51,2,169,136,8,115,87,197,32,190,149,124,161,25,195,186,104,230,180,152,44,1,158,200,157,227,134,92,207,106,60,218,31,225,30,89,249,141,153,241,80,44,139,151,69 ],[ 97,98,99,100,101,102,103,104,105,106]],
    [[34,16,217,154,249,200,189,236,218,27,75,239,248,34,19,103,83,216,52,37,5,221,206,55,241,49,78,44,219,180,136,198,1,107,218,169,189,47,250,81,61,213,222,46,75,80,240,49,57,61,138,182,31,119,59,14,1,48,215,56,30,15,138,29 ],[ 68,105,115,99,97,114,100,32,109,101,100,105,99,105,110,101,32,109,111,114,101,32,116,104,97,110,32,116,119,111,32,121,101,97,114,115,32,111,108,100,46]],
    [[166,135,168,152,91,77,141,10,36,241,21,254,39,34,85,198,175,175,57,9,34,88,56,84,97,89,193,237,104,92,33,26,32,55,150,174,142,204,76,129,165,182,49,89,25,179,166,79,16,113,61,160,126,52,31,205,187,8,84,27,240,48,102,206 ],[ 72,101,32,119,104,111,32,104,97,115,32,97,32,115,104,97,100,121,32,112,97,115,116,32,107,110,111,119,115,32,116,104,97,116,32,110,105,99,101,32,103,117,121,115,32,102,105,110,105,115,104,32,108,97,115,116,46]],
    [[141,219,3,146,232,24,183,213,133,171,34,118,154,80,223,102,13,159,109,85,156,202,58,252,86,145,184,202,145,184,69,19,116,228,43,205,171,214,69,137,237,124,145,216,95,98,101,150,34,138,92,133,114,103,126,185,139,198,182,36,190,251,122,248 ],[ 73,32,119,111,117,108,100,110,39,116,32,109,97,114,114,121,32,104,105,109,32,119,105,116,104,32,97,32,116,101,110,32,102,111,111,116,32,112,111,108,101,46]],
    [[38,237,143,108,167,248,212,75,106,138,84,174,57,100,15,168,173,92,103,63,112,238,156,224,116,186,78,240,212,131,238,160,11,171,47,97,216,105,93,107,52,223,156,108,72,174,54,36,99,98,32,14,216,32,68,139,220,3,167,32,54,106,135,198 ],[ 70,114,101,101,33,32,70,114,101,101,33,47,65,32,116,114,105,112,47,116,111,32,77,97,114,115,47,102,111,114,32,57,48,48,47,101,109,112,116,121,32,106,97,114,115,47,66,117,114,109,97,32,83,104,97,118,101]],
    [[229,161,75,240,68,190,105,97,90,173,232,154,252,241,171,3,137,213,252,48,42,136,77,64,53,121,209,56,106,36,0,192,137,176,219,179,135,237,15,70,63,158,227,66,248,36,77,90,56,207,188,14,129,157,169,82,159,191,247,131,104,201,169,130 ],[ 84,104,101,32,100,97,121,115,32,111,102,32,116,104,101,32,100,105,103,105,116,97,108,32,119,97,116,99,104,32,97,114,101,32,110,117,109,98,101,114,101,100,46,32,32,45,84,111,109,32,83,116,111,112,112,97,114,100]],
    [[66,10,31,170,72,145,158,20,101,27,237,69,114,90,190,15,122,88,224,240,153,66,76,78,90,73,25,73,70,227,139,70,193,248,3,75,24,239,22,155,46,49,5,13,22,72,224,185,130,56,101,149,247,223,71,218,75,111,209,142,85,51,48,21 ],[ 78,101,112,97,108,32,112,114,101,109,105,101,114,32,119,111,110,39,116,32,114,101,115,105,103,110,46]],
    [[217,38,168,99,190,173,178,1,52,219,7,104,53,53,199,32,7,176,230,149,4,88,118,37,79,52,29,220,204,222,19,42,144,140,90,245,123,170,106,106,156,99,230,100,155,186,12,33,61,192,95,173,207,154,188,206,160,159,35,220,251,99,127,190 ],[ 70,111,114,32,101,118,101,114,121,32,97,99,116,105,111,110,32,116,104,101,114,101,32,105,115,32,97,110,32,101,113,117,97,108,32,97,110,100,32,111,112,112,111,115,105,116,101,32,103,111,118,101,114,110,109,101,110,116,32,112,114,111,103,114,97,109,46]],
    [[154,152,221,155,182,125,13,167,191,131,218,83,19,223,244,253,96,164,186,192,9,79,27,5,99,54,144,255,167,246,214,29,233,161,212,248,97,121,55,213,96,131,58,154,170,156,202,254,63,210,77,180,24,208,231,40,131,53,69,202,221,58,217,45 ],[ 72,105,115,32,109,111,110,101,121,32,105,115,32,116,119,105,99,101,32,116,97,105,110,116,101,100,58,32,39,116,97,105,110,116,32,121,111,117,114,115,32,97,110,100,32,39,116,97,105,110,116,32,109,105,110,101,46]],
    [[215,253,226,210,53,30,250,222,82,244,33,29,55,70,160,120,10,38,238,195,223,155,46,213,117,54,138,138,28,9,236,69,36,2,41,58,142,164,236,235,90,79,96,6,78,162,155,19,205,216,105,24,205,122,79,175,54,97,96,176,9,128,65,7 ],[ 84,104,101,114,101,32,105,115,32,110,111,32,114,101,97,115,111,110,32,102,111,114,32,97,110,121,32,105,110,100,105,118,105,100,117,97,108,32,116,111,32,104,97,118,101,32,97,32,99,111,109,112,117,116,101,114,32,105,110,32,116,104,101,105,114,32,104,111,109,101,46,32,45,75,101,110,32,79,108,115,101,110,44,32,49,57,55,55]],
    [[176,243,95,250,38,151,53,156,51,165,111,92,12,247,21,199,174,237,150,218,153,5,202,38,152,172,173,176,143,188,158,102,155,245,102,182,189,93,97,163,232,109,194,41,153,188,201,242,34,78,51,209,212,243,42,34,140,249,208,52,158,45,181,24 ],[ 73,116,39,115,32,97,32,116,105,110,121,32,99,104,97,110,103,101,32,116,111,32,116,104,101,32,99,111,100,101,32,97,110,100,32,110,111,116,32,99,111,109,112,108,101,116,101,108,121,32,100,105,115,103,117,115,116,105,110,103,46,32,45,32,66,111,98,32,77,97,110,99,104,101,107]],
    [[61,46,95,145,119,140,158,102,247,224,97,41,58,170,138,143,199,66,221,59,46,79,72,55,114,70,75,17,68,24,155,73,39,62,97,14,92,204,215,168,26,25,202,31,167,15,22,177,15,26,16,10,77,140,19,114,51,107,232,72,76,100,179,17 ],[ 115,105,122,101,58,32,32,97,46,111,117,116,58,32,32,98,97,100,32,109,97,103,105,99]],
    [[178,246,143,245,138,192,21,239,177,201,76,144,139,13,140,43,240,111,73,30,77,232,230,48,44,73,1,111,127,138,51,234,195,233,89,133,108,127,221,188,70,77,230,24,112,19,56,164,180,111,118,219,250,249,161,229,38,43,95,64,99,151,113,199 ],[ 84,104,101,32,109,97,106,111,114,32,112,114,111,98,108,101,109,32,105,115,32,119,105,116,104,32,115,101,110,100,109,97,105,108,46,32,32,45,77,97,114,107,32,72,111,114,116,111,110]],
    [[216,201,45,181,253,245,44,248,33,94,77,243,180,144,157,41,32,63,244,208,14,154,208,182,74,106,78,4,222,197,231,79,98,231,195,92,127,184,129,189,93,233,84,66,18,61,248,245,122,72,155,10,230,22,189,50,111,132,209,0,33,18,28,87 ],[ 71,105,118,101,32,109,101,32,97,32,114,111,99,107,44,32,112,97,112,101,114,32,97,110,100,32,115,99,105,115,115,111,114,115,32,97,110,100,32,73,32,119,105,108,108,32,109,111,118,101,32,116,104,101,32,119,111,114,108,100,46,32,32,67,67,70,101,115,116,111,111,110]],
    [[25,169,248,220,10,35,62,70,78,133,102,173,60,169,185,30,69,154,123,140,71,128,152,91,1,87,118,225,191,35,154,25,188,35,61,5,86,52,62,43,10,155,194,32,144,11,78,191,79,139,223,137,255,142,254,175,121,96,45,104,73,230,247,46 ],[ 73,102,32,116,104,101,32,101,110,101,109,121,32,105,115,32,119,105,116,104,105,110,32,114,97,110,103,101,44,32,116,104,101,110,32,115,111,32,97,114,101,32,121,111,117,46]],
    [[0,180,196,31,48,123,222,135,48,28,220,91,90,177,174,154,89,46,142,203,178,2,29,215,188,75,52,226,172,230,7,65,204,54,37,96,190,197,102,186,53,23,133,149,169,25,50,184,213,53,126,44,156,236,146,211,147,176,250,120,49,133,36,118 ],[ 73,116,39,115,32,119,101,108,108,32,119,101,32,99,97,110,110,111,116,32,104,101,97,114,32,116,104,101,32,115,99,114,101,97,109,115,47,84,104,97,116,32,119,101,32,99,114,101,97,116,101,32,105,110,32,111,116,104,101,114,115,39,32,100,114,101,97,109,115,46]],
    [[145,236,204,61,83,117,253,2,110,77,103,135,135,75,29,206,32,28,236,216,162,125,189,237,80,101,114,140,178,208,156,88,163,212,103,187,31,175,53,59,247,186,86,126,0,82,69,213,50,27,85,188,52,79,124,7,185,28,182,242,108,149,155,231 ],[ 89,111,117,32,114,101,109,105,110,100,32,109,101,32,111,102,32,97,32,84,86,32,115,104,111,119,44,32,98,117,116,32,116,104,97,116,39,115,32,97,108,108,32,114,105,103,104,116,58,32,73,32,119,97,116,99,104,32,105,116,32,97,110,121,119,97,121,46]],
    [[250,187,190,34,24,15,31,19,124,253,201,85,109,37,112,231,117,209,174,2,165,151,222,212,58,114,164,15,155,72,93,80,0,67,183,190,18,143,185,252,217,130,184,49,89,160,217,154,168,85,169,231,204,66,64,192,13,192,26,155,223,130,24,215 ],[ 67,32,105,115,32,97,115,32,112,111,114,116,97,98,108,101,32,97,115,32,83,116,111,110,101,104,101,100,103,101,33,33]],
    [[46,205,236,35,92,31,164,252,42,21,77,143,186,29,221,184,167,42,26,215,56,56,181,29,121,35,49,209,67,248,185,106,159,111,203,15,52,215,202,163,81,254,109,136,119,28,79,16,80,64,224,57,47,6,224,98,22,137,211,59,47,59,169,46 ],[ 69,118,101,110,32,105,102,32,73,32,99,111,117,108,100,32,98,101,32,83,104,97,107,101,115,112,101,97,114,101,44,32,73,32,116,104,105,110,107,32,73,32,115,104,111,117,108,100,32,115,116,105,108,108,32,99,104,111,111,115,101,32,116,111,32,98,101,32,70,97,114,97,100,97,121,46,32,45,32,65,46,32,72,117,120,108,101,121]],
    [[122,214,129,246,249,111,130,247,171,250,126,204,3,52,232,250,22,211,220,28,220,69,182,11,122,244,63,228,7,93,35,87,192,193,214,14,152,53,15,26,251,31,47,231,164,215,205,42,213,91,136,228,88,224,107,115,196,11,67,115,49,245,218,180 ],[ 84,104,101,32,102,117,103,97,99,105,116,121,32,111,102,32,97,32,99,111,110,115,116,105,116,117,101,110,116,32,105,110,32,97,32,109,105,120,116,117,114,101,32,111,102,32,103,97,115,101,115,32,97,116,32,97,32,103,105,118,101,110,32,116,101,109,112,101,114,97,116,117,114,101,32,105,115,32,112,114,111,112,111,114,116,105,111,110,97,108,32,116,111,32,105,116,115,32,109,111,108,101,32,102,114,97,99,116,105,111,110,46,32,32,76,101,119,105,115,45,82,97,110,100,97,108,108,32,82,117,108,101]],
    [[131,63,146,72,171,74,59,158,81,49,247,69,253,161,255,210,221,67,91,48,233,101,149,126,120,41,28,122,183,54,5,253,25,18,176,121,78,92,35,58,176,161,45,32,90,57,119,141,25,184,53,21,214,164,112,3,241,156,222,229,29,152,199,224 ],[ 72,111,119,32,99,97,110,32,121,111,117,32,119,114,105,116,101,32,97,32,98,105,103,32,115,121,115,116,101,109,32,119,105,116,104,111,117,116,32,67,43,43,63,32,32,45,80,97,117,108,32,71,108,105,99,107]],
  ];

  var out;
  for (var i = 0; i < golden.length; i++) {
    out = nacl.hash(new Uint8Array(golden[i][1]));
    if (!helpers.bytesEqual(out, golden[i][0])) {
      log.error(i, 'differ');
      log.error('expected', golden[i][0], 'got', out);
    } else {
      log.ok();
    }
  }

}

function typecheck_test() {
  log.start('Testing type checking');
  var ex = false;
  try {
    nacl.secretbox("one", "two", "three");
  } catch(e) {
    ex = true;
  }
  if (!ex) {
    log.error("failed to catch string with type check");
  } else {
    log.ok();
  }
  ex = false;
  try {
    nacl.secretbox([1,2,3], [1,2,3], 1);
  } catch(e) {
    ex = true;
  }
  if (!ex) {
    log.error("failed to catch number with type check");
  } else {
    log.ok();
  }
}

function encodeDecodeBase64_test() {
  log.start('Testing nacl.util.encodeBase64');
  var s = new Uint8Array([208,159,209,128,208,184,208,178,208,181,209,130,44,32,78,97,67,108]);
  var en = nacl.util.encodeBase64(s);
  var ex = "0J/RgNC40LLQtdGCLCBOYUNs";
  if (en != ex) {
    log.error('bad encoding! expected', ex, 'got', en);
  } else {
    log.ok();
  }
  log.start('Testing nacl.util.decodeBase64');
  var de = nacl.util.decodeBase64(en);
  if (!helpers.bytesEqual(s, de)) {
    log.error('bad decoding! expected', s, 'got', de);
  } else {
    log.ok();
  }
}

function encodeDecodeUTF8_test() {
  log.start('Testing nacl.util.decodeUTF8');
  var s = "Привет, NaCl";
  var de = nacl.util.decodeUTF8(s);
  var ex = new Uint8Array([208,159,209,128,208,184,208,178,208,181,209,130,44,32,78,97,67,108]);
  if (!helpers.bytesEqual(ex, de)) {
    log.error('bad decoding! expected', ex, 'got', de);
  } else {
    log.ok();
  }
  log.start('Testing nacl.util.encodeUTF8');
  var en = nacl.util.encodeUTF8(de);
  if (en != s) {
    log.error('bad encoding! expected', s, 'got', en);
  } else {
    log.ok();
  }
}

function boxKeyPairFromSecretKey_test() {
  log.start('Testing nacl.box.keyPair.fromSecretKey');
  var keys1 = nacl.box.keyPair();
  var keys2 = nacl.box.keyPair.fromSecretKey(keys1.secretKey);
  if (!helpers.bytesEqual(keys1.publicKey, keys2.publicKey)) {
    log.error('differ! expected', nacl.util.encodeBase64(keys1.publicKey), 'got', nacl.util.encodeBase64(keys2.publicKey));
  } else if (!helpers.bytesEqual(keys1.secretKey, keys2.secretKey)) {
    log.error('differ! expected', nacl.util.encodeBase64(keys1.secretKey), 'got', nacl.util.encodeBase64(keys2.secretKey));
  } else {
    log.ok();
  }
}

function signKeyPairFromSecretKey_test() {
  log.start('Testing nacl.sign.keyPair.fromSecretKey');
  var keys1 = nacl.sign.keyPair();
  var keys2 = nacl.sign.keyPair.fromSecretKey(keys1.secretKey);
  if (!helpers.bytesEqual(keys1.publicKey, keys2.publicKey)) {
    log.error('differ! expected', nacl.util.encodeBase64(keys1.publicKey), 'got', nacl.util.encodeBase64(keys2.publicKey));
  } else if (!helpers.bytesEqual(keys1.secretKey, keys2.secretKey)) {
    log.error('differ! expected', nacl.util.encodeBase64(keys1.secretKey), 'got', nacl.util.encodeBase64(keys2.secretKey));
  } else {
    log.ok();
  }
}

function verify_test() {
  log.start('Testing nacl.verify');
  var i;
  var x = new Uint8Array(0);
  var y = new Uint8Array(0);
  if (nacl.verify(x, y)) {
    log.error('verified arrays of zero length');
  } else {
    log.ok();
  }
  x = new Uint8Array(0);
  y = new Uint8Array(10);
  if (nacl.verify(x, y)) {
    log.error('verified arrays of zero/different length');
  } else {
    log.ok();
  }
  x = new Uint8Array(10);
  y = new Uint8Array(11);
  if (nacl.verify(x, y)) {
    log.error('verified arrays of different length');
  } else {
    log.ok();
  }
  x = new Uint8Array(32);
  y = new Uint8Array(32);
  if (!nacl.verify(x, y)) {
    log.error('failed to verify equal arrays');
  } else {
    log.ok();
  }
  x = new Uint8Array(77);
  for (i = 0; i < x.length; i++) x[i] = i&0xff;
  y = new Uint8Array(77);
  for (i = 0; i < y.length; i++) y[i] = i&0xff;
  if (!nacl.verify(x, y)) {
    log.error('failed to verify equal arrays');
  } else {
    log.ok();
  }
  y[32] = 99;
  if (nacl.verify(x, y)) {
    log.error('verified unequal arrays');
  } else {
    log.ok();
  }
}

typecheck_test();
encodeDecodeBase64_test();
encodeDecodeUTF8_test();
crypto_stream_xor_test();
crypto_stream_test();
crypto_onetimeauth_test();
crypto_secretbox_test();
randomBytes_test();
crypto_hashblocks_test();
crypto_hash_test();
secretbox_seal_open_test();
randomBytes_test();
box_seal_open_test();
verify_test();
sign_open_test();
boxKeyPairFromSecretKey_test();
signKeyPairFromSecretKey_test();
scalarMultBase_test();
scalarMult_test();
crypto_scalarmult_base_test();
crypto_scalarmult_base_test_long();

log.ok();
