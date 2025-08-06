'use strict';

const formatJunit = require('commitlint-format-junit');
const {
  getCurrentBranch,
  getCurrentCommit,
  getCommitSinceBranchPoint,
  getLastCommitMessage,
} = require('../src/git');

const IGNORED_ERROR_REPORT_SCHEMA = [
  'type-empty',
  'subject-empty',
];

function doesReportMatchErrorSchema(report, schema) {
  return report.errors.length === schema.length
    && report.errors.every(error => schema.includes(error.name));
}

async function runCommitLint(commit, { shouldLintEveryCommit }) {
  const { default: load } = await import('@commitlint/load');
  const { default: read } = await import('@commitlint/read');
  const { default: lint } = await import('@commitlint/lint');

  let { rules, parserPreset } = await load();

  let opts = parserPreset ? { parserOpts: parserPreset.parserOpts } : {};

  let messages = await read({ from: commit });

  if (messages[0] && messages[0].startsWith('Merge ')) {
    messages.shift();
  }

  let reports = await Promise.all(messages.map(message => {
    return lint(message, rules, opts);
  }));

  let hasValidReports;
  let hasErrorReports;
  let orderedValidAndErrorReports = [];
  let errorCount = 0;

  for (let report of reports) {
    if (report.valid) {
      hasValidReports = true;
      orderedValidAndErrorReports.push(report);
    } else if (shouldLintEveryCommit || !doesReportMatchErrorSchema(report, IGNORED_ERROR_REPORT_SCHEMA)) {
      hasErrorReports = true;
      orderedValidAndErrorReports.push(report);
      errorCount++;
    }
  }

  let shouldRemoveIgnoredErrors = hasErrorReports || hasValidReports;
  let didFailLinting = hasErrorReports || !hasValidReports;

  if (shouldRemoveIgnoredErrors) {
    reports = orderedValidAndErrorReports;
  }

  if (didFailLinting) {
    process.exitCode = 1;
  }

  return await _format({
    valid: !didFailLinting,
    errorCount,
    warningCount: 0,
    results: reports,
  });
}

async function _format(payload) {
  const { default: format } = await import('@commitlint/format');

  let _format;
  if (process.env.COMMITLINT_REPORTER === 'junit') {
    _format = formatJunit;
  } else {
    _format = format;
  }

  return _format(payload, { verbose: true });
}

async function succeedWithLatestCommit() {
  let message = await getLastCommitMessage();

  // need at least one test to satisfy junit parsers
  return _format({
    valid: true,
    errorCount: 0,
    warningCount: 0,
    results: [{
      valid: true,
      input: message,
      errors: [],
      warnings: [],
    }],
  });
}

async function commitlint({ defaultBranch, shouldLintEveryCommit } = {}) {
  let currentBranch = await getCurrentBranch();
  if (currentBranch === defaultBranch) {
    return await succeedWithLatestCommit();
  }

  let currentCommit = await getCurrentCommit();

  let commitSinceBranchPoint;
  try {
    commitSinceBranchPoint = await getCommitSinceBranchPoint(defaultBranch);
  } catch (err) {
    // can't determine where you branched from, so succeed
    return await succeedWithLatestCommit();
  }

  if (currentCommit === commitSinceBranchPoint) {
    // You might be on a detached HEAD, but still the latest master commit
    return await succeedWithLatestCommit();
  }

  let formatted = await runCommitLint(commitSinceBranchPoint, { shouldLintEveryCommit });
  return formatted;
}

module.exports = commitlint;
