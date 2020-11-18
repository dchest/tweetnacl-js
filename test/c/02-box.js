var nacl = await import('tweetnacl/' + (process.env.NACL_SRC || 'nacl.js'));
nacl = nacl.default;
import util from 'tweetnacl-util';
nacl.util = util;
import crypto from 'crypto';
import { spawn } from 'child_process';
import path from 'path';
import url from 'url';
import test from 'tap-esm';

var __dirname = path.dirname(url.fileURLToPath(import.meta.url));

function cbox(msg, sk, pk, n, callback) {
  var hexsk = (Buffer.from(sk)).toString('hex');
  var hexpk = (Buffer.from(pk)).toString('hex');
  var hexn = (Buffer.from(n)).toString('hex');
  var p = spawn(path.resolve(__dirname, 'cbox'), [hexsk, hexpk, hexn]);
  var result = [];
  p.stdout.on('data', function(data) {
    result.push(data);
  });
  p.on('close', function(code) {
    return callback(Buffer.concat(result).toString('base64'));
  });
  p.on('error', function(err) {
    throw err;
  });
  p.stdin.write(msg);
  p.stdin.end();
}

test('nacl.box (C)', function(t) {
  var k1 = nacl.box.keyPair();

  function check(num, maxNum, next) {
    var sk2 = nacl.randomBytes(nacl.box.secretKeyLength);
    var msg = nacl.randomBytes(num);
    var nonce = nacl.randomBytes(24);
    var box = nacl.util.encodeBase64(nacl.box(msg, nonce, k1.publicKey, sk2));
    cbox(Buffer.from(msg), sk2, k1.publicKey, nonce, function(boxFromC) {
      t.equal(box, boxFromC, 'boxes should be equal');
      t.notEqual(nacl.box.open(nacl.util.decodeBase64(boxFromC), nonce, k1.publicKey, sk2),
                false, 'opening box should succeed');
      if (num >= maxNum) {
        if (next) next();
        return;
      }
      check(num+1, maxNum, next);
    });
  }

  check(0, 1024, function() {
    check(16417, 16500, function() {
      t.end();
    });
  });
});
