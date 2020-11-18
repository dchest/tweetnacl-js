var nacl = await import('tweetnacl/' + (process.env.NACL_SRC || 'nacl.js'));
nacl = nacl.default;
import crypto from 'crypto';
import { spawn } from 'child_process';
import path from 'path';
import url from 'url';
import test from 'tap-esm';

var __dirname = path.dirname(url.fileURLToPath(import.meta.url));

function chash(msg, callback) {
  var p = spawn(path.resolve(__dirname, 'chash'));
  var result = [];
  p.stdout.on('data', function(data) {
    result.push(data);
  });
  p.on('close', function(code) {
    return callback(Buffer.concat(result).toString('utf8'));
  });
  p.on('error', function(err) {
    throw err;
  });
  p.stdin.write(msg);
  p.stdin.end();
}

test('nacl.hash (C)', function(t) {
  function check(num) {
    var msg = nacl.randomBytes(num);
    var h = nacl.hash(msg);
    var hexH = (Buffer.from(h)).toString('hex');
    chash(Buffer.from(msg), function(hexCH) {
      t.equal(hexH, hexCH, 'hashes should be equal');
      if (num >= 1000) {
        t.end();
        return;
      }
      check(num+1);
    });
  }

  check(0);
});
