'use strict';

require('mocha');
var fs = require('fs');
var path = require('path');
var assert = require('assert');
var generate = require('generate');
var gm = require('global-modules');
var npm = require('npm-install-global');
var del = require('delete');
var generator = require('./');
var app;

var actual = path.resolve.bind(path, __dirname, 'actual');
function symlink(dir, cb) {
  var src = path.resolve(dir);
  var name = path.basename(src);
  var dest = path.resolve(gm, name);
  fs.stat(dest, function(err, stat) {
    if (err) {
      fs.symlink(src, dest, cb);
    } else {
      cb();
    }
  });
}

function unlink(dir, cb) {
  var name = path.basename(dir);
  var dest = path.resolve(gm, name);
  fs.unlink(dest, cb);
}

function exists(name, cb) {
  return function(err) {
    if (err) return cb(err);
    fs.stat(actual(name), function(err, stat) {
      if (err) return cb(err);
      assert(stat);
      cb();
    });
  };
}

describe('generate-assemblefile', function() {
  if (!process.env.CI && !process.env.TRAVIS) {
    before(function(cb) {
      npm.maybeInstall('generate', cb);
    });
  }

  beforeEach(function() {
    app = generate({silent: true});
    app.option('dest', actual());
    app.cwd = actual();
  });

  afterEach(function(cb) {
    del(actual(), cb);
  });

  describe('plugin', function() {
    it('should only register the plugin once', function(cb) {
      var count = 0;
      app.on('plugin', function(name) {
        if (name === 'generate-assemblefile') {
          count++;
        }
      });
      app.use(generator);
      app.use(generator);
      app.use(generator);
      assert.equal(count, 1);
      cb();
    });

    it('should extend tasks onto the instance', function() {
      app.use(generator);
      assert(app.tasks.hasOwnProperty('default'));
      assert(app.tasks.hasOwnProperty('assemblefile'));
    });

    it('should run the `default` task with .build', function(cb) {
      app.use(generator);
      app.build('default', exists('assemblefile.js', cb));
    });

    it('should run the `default` task with .generate', function(cb) {
      app.use(generator);
      app.generate('default', exists('assemblefile.js', cb));
    });

    it('should run the `assemblefile` task with .build', function(cb) {
      app.use(generator);
      app.build('assemblefile', exists('assemblefile.js', cb));
    });

    it('should run the `assemblefile` task with .generate', function(cb) {
      app.use(generator);
      app.generate('assemblefile', exists('assemblefile.js', cb));
    });
  });

  if (!process.env.CI && !process.env.TRAVIS) {
    describe('generator (CLI)', function() {
      before(function(cb) {
        symlink(__dirname, cb);
      });

      it('should run the default task using the `generate-assemblefile` name', function(cb) {
        app.use(generator);
        app.generate('generate-assemblefile', exists('assemblefile.js', cb));
      });

      it('should run the default task using the `assemblefile` generator alias', function(cb) {
        app.use(generator);
        app.generate('assemblefile', exists('assemblefile.js', cb));
      });
    });
  }

  describe('generator (API)', function() {
    it('should run the default task on the generator', function(cb) {
      app.register('assemblefile', generator);
      app.generate('assemblefile', exists('assemblefile.js', cb));
    });

    it('should run the `assemblefile` task', function(cb) {
      app.register('assemblefile', generator);
      app.generate('assemblefile:assemblefile', exists('assemblefile.js', cb));
    });

    it('should run the `default` task when defined explicitly', function(cb) {
      app.register('assemblefile', generator);
      app.generate('assemblefile:default', exists('assemblefile.js', cb));
    });
  });

  describe('sub-generator', function() {
    it('should work as a sub-generator', function(cb) {
      app.register('foo', function(foo) {
        foo.register('assemblefile', generator);
      });
      app.generate('foo.assemblefile', exists('assemblefile.js', cb));
    });

    it('should run the `default` task by default', function(cb) {
      app.register('foo', function(foo) {
        foo.register('assemblefile', generator);
      });
      app.generate('foo.assemblefile', exists('assemblefile.js', cb));
    });

    it('should run the `assemblefile:default` task when defined explicitly', function(cb) {
      app.register('foo', function(foo) {
        foo.register('assemblefile', generator);
      });
      app.generate('foo.assemblefile:default', exists('assemblefile.js', cb));
    });

    it('should run the `assemblefile:assemblefile` task', function(cb) {
      app.register('foo', function(foo) {
        foo.register('assemblefile', generator);
      });
      app.generate('foo.assemblefile:assemblefile', exists('assemblefile.js', cb));
    });

    it('should work with nested sub-generators', function(cb) {
      app
        .register('foo', generator)
        .register('bar', generator)
        .register('baz', generator);

      app.generate('foo.bar.baz', exists('assemblefile.js', cb));
    });
  });
});
