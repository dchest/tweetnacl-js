var nacl = await import('tweetnacl/' + (process.env.NACL_SRC || 'nacl.js'));
nacl = nacl.default;
import test from 'tap-esm';
import util from 'tweetnacl-util';
nacl.util = util;

test('nacl.randomBytes', function(t) {
  t.plan(1);
  var set = {}, s, i;
  for (i = 0; i < 10000; i++) {
    s = nacl.util.encodeBase64(nacl.randomBytes(32));
    if (set[s]) {
      t.fail('duplicate random sequence! ', s);
      return;
    }
    set[s] = true;
  }
  t.pass('no collisions');
});
