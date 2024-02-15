import * as nacl from '../nacl.js'
import test from 'tape'
import util from 'tweetnacl-util'

test('nacl.randomBytes', function(t) {
  t.plan(1);
  var set = {}, s, i;
  for (i = 0; i < 10000; i++) {
    s = util.encodeBase64(nacl.randomBytes(32));
    if (set[s]) {
      t.fail('duplicate random sequence! ', s);
      return;
    }
    set[s] = true;
  }
  t.pass('no collisions');
});
