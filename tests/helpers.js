// Test helpers.
(function(exports) {

// Compares bytes of an indexable something (Array, typed array).
exports.bytesEqual = function(x, y) {
  if (x.length !== y.length) return false;
  for (var i = 0; i < x.length; i++) {
    if (x[i] !== y[i]) return false;
  }
  return true;
};

function NodeLogger() {
  this.print = function() {
    console.log.apply(console, arguments);
  };

  this.ok = function() {
    process.stdout.write('.');
  };

  this.error = function() {
    console.error.apply(console, arguments);
  };

  this.start = this.print.bind(this, '\n');
}

function BrowserLogger() {
  var el = document.createElement('pre');
  document.body.appendChild(el);

  this.print = function() {
    var s = arguments.length ? Array.prototype.slice.call(arguments).join(' ') : '';
    el.innerText += s + '\n';
  };

  this.ok = function() {
    el.innerText += '.';
  };

  this.error = function() {
    var s = arguments.length ? Array.prototype.slice.call(arguments) : '';
    el.innerText += 'ERROR: ' + s + '\n';
  };

  this.start = this.print.bind(this, '\n');
}

if (typeof window !== 'undefined')
  exports.log = new BrowserLogger();
else
  exports.log = new NodeLogger();

})(typeof exports !== 'undefined' ? exports : (window.helpers = window.helpers || {}));
