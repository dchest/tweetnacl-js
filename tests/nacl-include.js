var nacl;
if (process && process.env.FAST) {
  console.log('Using FAST version');
  nacl = require('../nacl-fast.min.js');
} else {
  console.log('Using NORMAL version');
  nacl = require('../nacl.min.js');
}
module.exports = nacl;
