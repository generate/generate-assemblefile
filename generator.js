'use strict';

var isValid = require('is-valid-app');

module.exports = function(app) {
  if (!isValid(app, 'generate-assemblefile')) return;

  /**
   * Generate an `assemblefile.js` file to the current working directory.
   *
   * ```sh
   * $ gen assemblefile
   * $ gen assemblefile --dest ./docs
   * ```
   * @name assemblefile
   * @api public
   */

  app.task('default', ['assemblefile']);
  app.task('assemblefile', function(cb) {
    return app.src('templates/assemblefile.js', {cwd: __dirname})
      .pipe(app.conflicts(app.cwd))
      .pipe(app.dest(app.cwd));
  });
};
