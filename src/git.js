'use strict';

const { exec } = require('./cp');

async function getCurrentBranch() {
  return await exec('git rev-parse --abbrev-ref HEAD');
}

async function getCurrentCommit() {
  return await exec('git rev-parse HEAD');
}

async function getCommitSinceBranchPoint() {
  return await exec('git merge-base master HEAD');
}

async function getLastCommitMessage() {
  return await exec('git log -1 --pretty=%B');
}

module.exports = {
  getCurrentBranch,
  getCurrentCommit,
  getCommitSinceBranchPoint,
  getLastCommitMessage,
};
