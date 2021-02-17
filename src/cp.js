'use strict';

const debug = require('./debug');
const execa = require('execa');

function spawn() {
  debug(...arguments);

  let ps = execa(...arguments);

  ps.stdout.on('data', data => {
    debug(data);
    // debug(data.toString());
  });

  return ps;
}

module.exports = {
  spawn,
};
