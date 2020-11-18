var nacl = await import('tweetnacl/' + (process.env.NACL_SRC || 'nacl.js'));
nacl = nacl.default;
import util from 'tweetnacl-util';
nacl.util = util;
import { spawn } from 'child_process';
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

test('nacl.sign (C)', function(t) {
  function check(num) {
    var keys = nacl.sign.keyPair();
    var msg = nacl.randomBytes(num);
    var signedMsg = nacl.util.encodeBase64(nacl.sign(msg, keys.secretKey));
    csign(keys.secretKey, Buffer.from(msg), function(signedFromC) {
      t.equal(signedMsg, signedFromC, 'signed messages should be equal');
      var openedMsg = nacl.sign.open(nacl.util.decodeBase64(signedFromC), keys.publicKey);
      t.notEqual(openedMsg, null, 'open should succeed');
      t.equal(nacl.util.encodeBase64(openedMsg), nacl.util.encodeBase64(msg),
            'messages should be equal');
      if (num >= 100) {
        t.end();
        return;
      }
      check(num+1);
    });
  }

  check(0);
});
