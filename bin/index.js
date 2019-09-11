#!/usr/bin/env node
'use strict';

require('../src/utils/throw-up');

const commitlint = require('../src');

(async () => {
  let formatted = await commitlint();

  console.log(formatted);
})();
