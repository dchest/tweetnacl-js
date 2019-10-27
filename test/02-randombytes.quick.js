var nacl = (typeof window !== 'undefined') ? window.nacl : require('../' + (process.env.NACL_SRC || 'nacl.min.js'));
nacl.util = require('tweetnacl-util');
var test = require('tape');

test('nacl.randomBytes', async function(t) {
  t.plan(1);
  var set = {}, s, i;
  for (i = 0; i < 10000; i++) {
    s = nacl.util.encodeBase64(await nacl.randomBytes(32));
    if (set[s]) {
      t.fail('duplicate random sequence! ', s);
      return;
    }
    set[s] = true;
  }
  t.pass('no collisions');
});
