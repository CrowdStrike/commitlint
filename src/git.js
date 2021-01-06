'use strict';

const { exec } = require('./cp');

async function getCurrentBranch() {
  return await exec('git rev-parse --abbrev-ref HEAD');
}

async function getCurrentCommit() {
  return await exec('git rev-parse HEAD');
}

async function getCommitSinceLastRelease() {
  return await exec('git merge-base master HEAD');
}

async function getLastCommitMessage() {
  return await exec('git log -1 --pretty=%B');
}

async function getAttemptedCommitMessage() {
  try {
    // This file is created by Husky to hold the contents of the commit message.
    return await exec('cat .git/COMMIT_EDITMSG');
  } catch (err) {
    return '';
  }
}

module.exports = {
  getAttemptedCommitMessage,
  getCurrentBranch,
  getCurrentCommit,
  getCommitSinceLastRelease,
  getLastCommitMessage,
};
