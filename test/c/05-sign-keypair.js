var nacl = await import('tweetnacl/' + (process.env.NACL_SRC || 'nacl.js'));
nacl = nacl.default;
import util from 'tweetnacl-util';
nacl.util = util;
import { spawn, execFile } from 'child_process';
import path from 'path';
import url from 'url';
import test from 'tap-esm';

var __dirname = path.dirname(url.fileURLToPath(import.meta.url));

function csign(sk, msg, callback) {
  var hexsk = (Buffer.from(sk)).toString('hex');
  var p = spawn(path.resolve(__dirname, 'csign'), [hexsk]);
  var result = [];
  p.stdout.on('data', function(data) {
    result.push(data);
  });
  p.on('close', function(code) {
    callback(Buffer.concat(result).toString('base64'));
  });
  p.on('error', function(err) {
    throw err;
  });
  p.stdin.write(msg);
  p.stdin.end();
}

function csignkeypair(callback) {
  execFile(path.resolve(__dirname, 'csign-keypair'), [], function(err, stdout) {
    if (err) throw err;
    callback(stdout.toString('utf8'));
  });
}

test('nacl.sign (C) with keypair from C', function(t) {
  function check(num) {
    csignkeypair(function(hexSecretKey) {
      var secretKey = new Uint8Array(nacl.sign.secretKeyLength);
      var b = Buffer.from(hexSecretKey, 'hex');
      for (var i = 0; i < b.length; i++) secretKey[i] = b[i];
      var msg = nacl.randomBytes(num);
      var signedMsg = nacl.util.encodeBase64(nacl.sign(msg, secretKey));
      csign(secretKey, Buffer.from(msg), function(signedFromC) {
        t.equal(signedMsg, signedFromC, 'signed messages should be equal');
        if (num >= 100) {
          t.end();
          return;
        }
        check(num+1);
      });
    });
  }

  check(0);
});
