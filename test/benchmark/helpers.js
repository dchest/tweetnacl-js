// Test helpers.
function NodeLogger() {
  this.print = function() {
    console.log.apply(console, arguments);
  };

  this.ok = function() {
    process.stdout.write('.');
  };

  this.error = function() {
    console.error.apply(console, arguments);
    process.exit(1);
  };

  this.start = this.print.bind(this, '\n');
}

function BrowserLogger() {
  var el = document.createElement('pre');
  document.body.appendChild(el);

  function escape(s) {
    var reps = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '/': '&#x2F;'
    };
    return String(s).replace(/[&<>"'\/]/g, function(x) { return reps[x]; });
  }

  this.print = function() {
    console.log.apply(console, arguments);
    var s = escape(arguments.length ? Array.prototype.slice.call(arguments).join(' ') : '');
    el.innerHTML += s + '\n';
  };

  this.ok = function() {
    // No console output.
    el.innerHTML += '.';
  };

  this.error = function() {
    console.error.apply(console, arguments);
    var s = escape(arguments.length ? Array.prototype.slice.call(arguments) : '');
    el.innerHTML += 'ERROR: ' + s + '\n';
  };

  this.start = this.print.bind(this, '\n');
}

if (typeof window !== 'undefined')
  var log = new BrowserLogger();
else
  log = new NodeLogger();

export { log };
