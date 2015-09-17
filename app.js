// Written in 2014 by Dmitry Chestnykh.
// Public domain.

(function(m) {
"use strict";

m.route.mode = 'hash';

function focusIf(prop) {
  return function(el, isInit) {
    if (prop()) {
      el.focus();
      prop(false);
    }
  };
}

var app = {};

// Common partial views.

app.errorView = function(error) {
  if (error()) {
    return m('.row', [
      m('.col-sm-12', [
        m('.alert.alert-danger', error())
      ])
    ]);
  }
  return '';
};

app.messageView = function(ctrl, action, buttonTitle) {
  return m('form', {onsubmit: action}, [
    m('.form-group', [
      m('label[for=message]', 'Message'),
      m('textarea.form-control[id=message]', {
        value: ctrl.message(),
        onchange: m.withAttr('value', ctrl.message),
        config: focusIf(ctrl.focusMessage)
      }),
    ]),
    m('.form-group', [
      m('button.btn.btn-lg.btn-primary', buttonTitle ? buttonTitle : 'Encrypt')
    ])
  ]);
};

app.boxView = function(ctrl, action, buttonTitle) {
  return m('form', {onsubmit: action}, [
    m('.form-group', [
      m('label[for=box]', 'Box'),
      m('textarea.form-control[id=box]', {
        value: ctrl.box(),
        onkeyup: m.withAttr('value', ctrl.box),
        config: focusIf(ctrl.focusBox)
      })
    ]),
    m('.form-group', [
      m('button.btn.btn-lg.btn-success', {disabled: !ctrl.box()}, buttonTitle ? buttonTitle : 'Decrypt')
    ])
  ]);
};


// Secretbox page.

app.secretbox = {};

app.secretbox.controller = function() {
  this.key = m.prop('');
  this.nonce = m.prop('');
  this.message = m.prop('');
  this.box = m.prop('');
  this.error = m.prop('');

  this.focusMessage = m.prop(false);
  this.focusBox = m.prop(false);

  this.randomKey = function() {
    this.key(nacl.util.encodeBase64(nacl.randomBytes(nacl.secretbox.keyLength)));
  }.bind(this);

  this.randomNonce = function() {
    this.nonce(nacl.util.encodeBase64(nacl.randomBytes(nacl.secretbox.nonceLength)));
  }.bind(this);

  this.decodeKey = function() {
    try {
      var k = nacl.util.decodeBase64(this.key());
      if (k.length != nacl.secretbox.keyLength) {
        this.error('Bad key length: must be ' + nacl.secretbox.keyLength + ' bytes');
        return null;
      }
      return k;
    } catch(e) {
      this.error('Failed to decode key from Base64');
      return null;
    }
  };

  this.decodeNonce = function() {
    try {
      var n = nacl.util.decodeBase64(this.nonce());
      if (n.length != nacl.secretbox.nonceLength) {
        this.error('Bad nonce length: must be ' + nacl.secretbox.nonceLength + ' bytes');
        return null;
      }
      return n;
    } catch(e) {
      this.error('Failed to decode nonce from Base64');
      return null;
    }
  };

  this.encrypt = function(e) {
    var k, n, m;
    e.preventDefault();
    this.error('');
    if (!(n = this.decodeNonce())) return;
    if (!(k = this.decodeKey())) return;
    m = nacl.util.decodeUTF8(this.message());
    this.box(nacl.util.encodeBase64(nacl.secretbox(m, n, k)));
    this.focusBox(true);
  }.bind(this);

  this.decrypt = function(e) {
    var k, n, b, m;
    e.preventDefault();
    this.error('');
    if (!(n = this.decodeNonce())) return;
    if (!(k = this.decodeKey())) return;
    try {
      b = nacl.util.decodeBase64(this.box());
    } catch(ex) {
      this.error('Cannot decode box');
      return;
    }
    m = nacl.secretbox.open(b, n, k);
    if (m === false) {
      this.error('Failed to decrypt');
      this.message('');
      return;
    }
    try {
      this.message(nacl.util.encodeUTF8(m));
    } catch(ex) {
      this.error('Cannot decode decrypted message to string');
      return;
    }
    this.focusMessage(true);
  }.bind(this);

};

app.secretbox.keyNonceView = function(ctrl) {
  return m('form', [
    m('.row', [
      m('.col-md-6', [
        m('.form-group', [
          m('label[for=key]', 'Key'),
          m('.input-group', [
            m('input.form-control[name=key]', {value: ctrl.key(), onchange: m.withAttr('value', ctrl.key)}),
            m('span.input-group-btn', [
              m('a.btn.btn-default', {onclick: ctrl.randomKey}, 'Random'),
            ])
          ]),
        ]),
      ]),
      m('.col-md-6', [
        m('.form-group', [
          m('label[for=nonce]', 'Nonce'),
          m('.input-group', [
            m('input.form-control[name=nonce]', {value: ctrl.nonce(), onchange: m.withAttr('value', ctrl.nonce)}),
            m('span.input-group-btn', [
              m('a.btn.btn-default', {onclick: ctrl.randomNonce}, 'Random'),
            ])
          ]),
        ]),
      ]),
    ]),
  ]);
};

app.secretbox.view = function(ctrl) {
  return [
      m('.bar', [
        m('.container', [
          m('.row', [
            m('.col-sm-12', [
              app.secretbox.keyNonceView(ctrl)
            ])
          ]),
        ]),
      ]),
      m('.container.normal', [
        app.errorView(ctrl.error),
        m('.row', [
          m('.col-sm-6', [
            app.messageView(ctrl, ctrl.encrypt)
          ]),
          m('.col-sm-6', [
            app.boxView(ctrl, ctrl.decrypt)
          ])
        ])
      ])
  ];
};


// Box page.

app.box = {};

app.box.controller = function() {
  this.theirPublicKey = m.prop('');
  this.mySecretKey = m.prop('');
  this.myPublicKey = m.prop('');
  this.nonce = m.prop('');
  this.message = m.prop('');
  this.box = m.prop('');
  this.focusMessage = m.prop(false);
  this.focusBox = m.prop(false);
  this.error = m.prop('');

  this.randomNonce = function() {
    this.nonce(nacl.util.encodeBase64(nacl.randomBytes(nacl.secretbox.nonceLength)));
  }.bind(this);

  this.generateKeyPair = function() {
    var keys = nacl.box.keyPair();
    this.mySecretKey(nacl.util.encodeBase64(keys.secretKey));
    this.myPublicKey(nacl.util.encodeBase64(keys.publicKey));
  }.bind(this);

  this.decodeTheirPublicKey = function() {
    try {
      var k = nacl.util.decodeBase64(this.theirPublicKey());
      if (k.length != nacl.box.publicKeyLength) {
        this.error('Bad public key length: must be ' + nacl.box.publicKeyLength + ' bytes');
        return null;
      }
      return k;
    } catch(e) {
      this.error('Failed to decode public key from Base64');
      return null;
    }
  };

  this.decodeMySecretKey = function() {
    try {
      var k = nacl.util.decodeBase64(this.mySecretKey());
      if (k.length != nacl.box.secretKeyLength) {
        this.error('Bad secret key length: must be ' + nacl.box.secretKeyLength + ' bytes');
        return null;
      }
      return k;
    } catch(e) {
      this.error('Failed to decode secret key from Base64');
      return null;
    }
  };

  this.decodeNonce = function() {
    try {
      var n = nacl.util.decodeBase64(this.nonce());
      if (n.length != nacl.secretbox.nonceLength) {
        this.error('Bad nonce length: must be ' + nacl.secretbox.nonceLength + ' bytes');
        return null;
      }
      return n;
    } catch(e) {
      this.error('Failed to decode nonce from Base64');
      return null;
    }
  };

  this.encrypt = function(e) {
    var pk, sk, n, m;
    e.preventDefault();
    this.error('');
    if (!(n = this.decodeNonce())) return;
    if (!(pk = this.decodeTheirPublicKey())) return;
    if (!(sk = this.decodeMySecretKey())) return;
    m = nacl.util.decodeUTF8(this.message());
    this.box(nacl.util.encodeBase64(nacl.box(m, n, pk, sk)));
    this.focusBox(true);
  }.bind(this);

  this.decrypt = function(e) {
    var pk, sk, n, b, m;
    e.preventDefault();
    this.error('');
    if (!(n = this.decodeNonce())) return;
    if (!(pk = this.decodeTheirPublicKey())) return;
    if (!(sk = this.decodeMySecretKey())) return;
    try {
      b = nacl.util.decodeBase64(this.box());
    } catch(ex) {
      this.error('Cannot decode box');
      return;
    }
    m = nacl.box.open(b, n, pk, sk);
    if (m === false) {
      this.error('Failed to decrypt');
      this.message('');
      return;
    }
    try {
      this.message(nacl.util.encodeUTF8(m));
    } catch(ex) {
      this.error('Cannot decode decrypted message to string');
      return;
    }
    this.focusMessage(true);
  }.bind(this);
};

app.box.keyNonceView = function(ctrl) {
  function myPublicKeyView() {
    return m('.form-group', [
      m('label[for=myPublicKey]', 'My Public Key'),
      m('input.form-control[name=myPublicKey][readonly]', {value: ctrl.myPublicKey()})
    ]);
  }

  return m('form', [
    m('.row', [
      m('.col-md-6', [
        m('.form-group', [
          m('label[for=theirPublicKey]', 'Their Public Key'),
          m('input.form-control[name=theirPublicKey]', {value: ctrl.theirPublicKey(), onchange: m.withAttr('value', ctrl.theirPublicKey)})
        ]),
        m('.form-group', [
          m('label[for=mySecretKey]', 'My Secret Key'),
          m('.input-group', [
            m('input.form-control[name=mySecretKey]', {value: ctrl.mySecretKey(), onchange: m.withAttr('value', ctrl.mySecretKey)}),
            m('span.input-group-btn', [
              m('a.btn.btn-default', {onclick: ctrl.generateKeyPair}, 'Random')
            ]),
          ]),
        ]),
      ]),
      m('.col-md-6', [
        m('.form-group', [
          m('label[for=nonce]', 'Nonce'),
          m('.input-group', [
            m('input.form-control[name=nonce]', {value: ctrl.nonce(), onchange: m.withAttr('value', ctrl.nonce)}),
            m('span.input-group-btn', [
              m('a.btn.btn-default', {onclick: ctrl.randomNonce}, 'Random'),
            ])
          ]),
        ]),
        ctrl.myPublicKey() ? myPublicKeyView() : ''
      ]),
    ]),
  ]);
};

app.box.view = function(ctrl) {
  return [
      m('.bar', [
        m('.container', [
          m('.row', [
            m('.col-sm-12', [
              app.box.keyNonceView(ctrl)
            ])
          ]),
        ]),
      ]),
      m('.container.normal', [
        app.errorView(ctrl.error),
        m('.row', [
          m('.col-sm-6', [
            app.messageView(ctrl, ctrl.encrypt)
          ]),
          m('.col-sm-6', [
            app.boxView(ctrl, ctrl.decrypt)
          ])
        ])
      ])
  ];
};

// Hash page.

app.hash = {};

app.hash.controller = function() {
  this.message = m.prop('');
  this.hash = m.prop('');

  this.updateMessage = function(value) {
    this.message(value);
    this.calculateHash();
  }.bind(this);

  this.calculateHash = function(e) {
    this.hash(nacl.util.encodeBase64(nacl.hash(nacl.util.decodeUTF8(this.message()))));
  }.bind(this);
};

app.hash.view = function(ctrl) {
  return [
      m('.bar', [
        m('.container', [
          m('.row', [
            m('.col-sm-12', [
              m('.form-group', [
                m('label[for=hash]', 'Hash'),
                m('input.form-control[name=hash][readonly]', {value: ctrl.hash()})
              ])
            ])
          ])
        ])
      ]),
      m('.container.normal', [
        m('.row', [
          m('.col-sm-12', [
            m('.form-group', [
              m('label[for=message]', 'Message'),
              m('textarea.form-control[id=message]', {
                value: ctrl.message(),
                onkeyup: m.withAttr('value', ctrl.updateMessage),
                onchange: m.withAttr('value', ctrl.updateMessage),
                onpaste: m.withAttr('value', ctrl.updateMessage),
              }),
            ]),
          ])
        ])
      ])
  ];
};

// Sign page.

app.sign = {};

app.sign.controller = function() {
  this.publicKey = m.prop('');
  this.secretKey = m.prop('');
  this.message = m.prop('');
  this.signature = m.prop('');
  this.focusMessage = m.prop(false);
  this.error = m.prop('');
  this.success = m.prop('');
  this.status = m.prop('sign');

  this.generateKeyPair = function() {
    var keys = nacl.sign.keyPair();
    this.secretKey(nacl.util.encodeBase64(keys.secretKey));
    this.publicKey(nacl.util.encodeBase64(keys.publicKey));
  }.bind(this);

  this.decodePublicKey = function() {
    try {
      var k = nacl.util.decodeBase64(this.publicKey());
      if (k.length != nacl.sign.publicKeyLength) {
        this.error('Bad public key length: must be ' + nacl.sign.publicKeyLength + ' bytes');
        return null;
      }
      return k;
    } catch(e) {
      this.error('Failed to decode public key from Base64');
      return null;
    }
  };

  this.decodeSecretKey = function() {
    try {
      var k = nacl.util.decodeBase64(this.secretKey());
      if (k.length != nacl.sign.secretKeyLength) {
        this.error('Bad secret key length: must be ' + nacl.sign.secretKeyLength + ' bytes');
        return null;
      }
      return k;
    } catch(e) {
      this.error('Failed to decode secret key from Base64');
      return null;
    }
  };

  this.decodeSignature = function() {
    try {
      var s = nacl.util.decodeBase64(this.signature());
      if (s.length != nacl.sign.signatureLength) {
        this.error('Bad signature length: must be ' + nacl.sign.signatureLength + ' bytes');
        return null;
      }
      return s;
    } catch(e) {
      this.error('Failed to decode signature from Base64');
      return null;
    }
  };

  this.sign = function(e) {
    var sk;
    e.preventDefault();
    this.error('');
    if (!(sk = this.decodeSecretKey())) return;
    this.signature(nacl.util.encodeBase64(nacl.sign.detached(nacl.util.decodeUTF8(this.message()), sk)));
  }.bind(this);

  this.verify = function(e) {
    var pk, s, m;
    e.preventDefault();
    this.error('');
    if (!(s = this.decodeSignature())) return;
    if (!(pk = this.decodePublicKey())) return;
    if (!nacl.sign.detached.verify(nacl.util.decodeUTF8(this.message()), s, pk)) {
      this.error('Failed to verify signature');
      return;
    } else {
      this.success('Verified');
      this.status('verified');
      return;
    }
  }.bind(this);

};

app.sign.keyView = function(ctrl) {
  return m('form', [
    m('.row', [
      m('.col-md-12', [
        m('.form-group', {className: ctrl.status() === 'sign' ? '' : 'hidden'}, [
          m('label[for=secretKey]', 'Secret Key'),
          m('.input-group', [
            m('input.form-control[name=secretKey]', {value: ctrl.secretKey(), onchange: m.withAttr('value', ctrl.secretKey)}),
            m('span.input-group-btn', [
              m('a.btn.btn-default', {onclick: ctrl.generateKeyPair}, 'Random')
            ]),
          ]),
        ]),
        m('.form-group', {className: ctrl.status() === 'sign' && !ctrl.publicKey() ? 'hidden': ''}, [
          m('label[for=publicKey]', 'Public Key'),
          m('input.form-control[name=publicKey]', {
            disabled: ctrl.status() !== 'verify',
            value: ctrl.publicKey(),
            onchange: m.withAttr('value', ctrl.publicKey)
          })
        ]),
        m('.form-group', {className: ctrl.status() == 'sign' ? (ctrl.signature() ? 'has-success': 'hidden') : '' }, [
          m('label.control-label[for=signature]', 'Signature'),
          m('input.form-control[name=signature]', {
            disabled: ctrl.status() !== 'verify',
            value: ctrl.signature(),
            onchange: m.withAttr('value', ctrl.signature)})
        ]),
      ]),
    ]),
  ]);
};

app.sign.view = function(ctrl) {
  function messageView() {
    switch (ctrl.status()) {
    case 'sign':
      return app.messageView(ctrl, ctrl.sign, 'Sign');
    case 'verify':
      return app.messageView(ctrl, ctrl.verify, 'Verify');
    default:
      return [
        m('.alert.alert-success', 'Verified'),
        m('textarea#message.form-control[readonly]', {value: ctrl.message()})
      ];
    }
  }

  return [
      m('.bar', [
        m('.container', [
          m('ul.nav.nav-pills', [
            m('li', {className: ctrl.status() == 'sign' ? 'active' : ''}, [
              m('a[href=javascript:;]', {onclick: function() { ctrl.status('sign'); ctrl.error(''); }}, 'Sign')
            ]),
            m('li', {className: ctrl.status() == 'verify' ?'active' : ''}, [
              m('a[href=javascript:;]', {onclick: function() { ctrl.status('verify'); ctrl.error(''); }}, 'Verify')
            ])
          ]),
        ]),
        m('.container.normal', [
          m('.row', [
            m('.col-sm-12', [
              app.sign.keyView(ctrl)
            ])
          ]),
        ]),
      ]),
      m('.container.normal', [
        app.errorView(ctrl.error),
        m('.row', [
          m('.col-sm-12', [
            messageView()
          ]),
        ])
      ])
  ];
};


// About page.

app.about = {};

app.about.controller = function() {
};

app.about.content = document.getElementById('about').innerHTML;

app.about.configure = function(el, isInit) {
    el.innerHTML = app.about.content;
};

app.about.view = function(ctrl) {
  return m('div', {config: app.about.configure});
};


// Navbar.

app.navbar = {};

app.navbar.controller = function() {
};

app.navbar.view = function() {
  function navitem(url, title) {
    return m('li', {className: m.route() == url ? 'active' : ''}, m('a', {href: url, config: m.route}, title));
  }

  return m('.navbar.navbar-inverse.navbar-static-top[role=navigation]', [
    m('.container', [
      m('.navbar-header', [
        m('a.navbar-brand[href=/]', {config: m.route}, 'TweetNaCl.js')
      ]),
      m('div', [
        m('ul.nav.navbar-nav', [
          navitem('/', 'About'),
          m('li.divider'),
          navitem('/secretbox', 'Secretbox'),
          navitem('/box', 'Box'),
          navitem('/hash', 'Hash'),
          navitem('/sign', 'Sign')
        ])
      ])
    ])
  ]);
};


// Main.

app.page = function(pageModule) {
  return {
    controller: pageModule.controller,
    view: function(ctrl) {
      return [
        app.navbar.view(new app.navbar.controller()),
        pageModule.view(ctrl)
      ];
    }
  };
};

m.route(document.body, '/', {
  '/': app.page(app.about),
  '/secretbox': app.page(app.secretbox),
  '/box': app.page(app.box),
  '/hash': app.page(app.hash),
  '/sign': app.page(app.sign)
});

})(m);
