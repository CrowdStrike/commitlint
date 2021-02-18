#!/usr/bin/env node
'use strict';

require('../src/utils/throw-up');

const commitlint = require('../src');

const defaultBranch = 'master';

const { argv } = require('yargs')
  .usage('$0', require('../package').description)
  .options({
    'default-branch': {
      type: 'string',
      default: defaultBranch,
      description: `Use a different branch point other than ${defaultBranch}`,
    },
  });

(async () => {
  let formatted = await commitlint(argv);

  console.log(formatted);
})();
