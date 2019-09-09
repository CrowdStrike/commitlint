'use strict';

const debug = require('./debug');
const cp = require('child_process');
const { promisify } = require('util');
const _exec = promisify(cp.exec);

async function exec(command, ...args) {
  debug(command);
  let result = (await _exec(command, ...args)).stdout.trim();
  debug(result);
  return result;
}

module.exports.exec = exec;
