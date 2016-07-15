---
install:
  devDependencies: ['assemble']
---
'use strict';

var assemble = require('assemble');
var app = assemble();

app.task('default', function() {
  app.partials('templates/partials/*.hbs');
  app.layouts('templates/layouts/*.hbs');
  return app.src('templates/*.hbs')
    .pipe(app.renderFile())
    .pipe(app.dest('dest'));
});

module.exports = app;
