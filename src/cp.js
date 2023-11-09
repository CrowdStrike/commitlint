'use strict';

const debug = require('./debug');

async function spawn() {
  const { execa } = await import('execa');

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
