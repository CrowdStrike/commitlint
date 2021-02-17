'use strict';

const { spawn } = require('./cp');

async function git() {
  return (await spawn('git', [...arguments])).stdout;
}

async function getCurrentBranch() {
  return await git('rev-parse', '--abbrev-ref', 'HEAD');
}

async function getCurrentCommit() {
  return await git('rev-parse', 'HEAD');
}

async function getCommitSinceBranchPoint() {
  return await git('merge-base', 'master', 'HEAD');
}

async function getLastCommitMessage() {
  return await git('log', '-1', '--pretty=%B');
}

module.exports = {
  getCurrentBranch,
  getCurrentCommit,
  getCommitSinceBranchPoint,
  getLastCommitMessage,
};
