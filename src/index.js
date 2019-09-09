'use strict';

const load = require('@commitlint/load');
const read = require('@commitlint/read');
const lint = require('@commitlint/lint');
const { format } = require('@commitlint/format');
const formatJunit = require('commitlint-format-junit');
const {
  getCurrentBranch,
  getCommitSinceLastRelease,
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

async function runCommitLint(commit) {
  let { rules, parserPreset } = await load();

  let opts = parserPreset ? { parserOpts: parserPreset.parserOpts } : {};

  let messages = await read({ from: commit });

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
    } else if (!doesReportMatchErrorSchema(report, IGNORED_ERROR_REPORT_SCHEMA)) {
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

  return _format({
    valid: !didFailLinting,
    errorCount,
    warningCount: 0,
    results: reports,
  });
}

function _format(payload) {
  let _format;
  if (process.env.COMMITLINT_REPORTER === 'junit') {
    _format = formatJunit;
  } else {
    _format = format;
  }

  return _format(payload, { verbose: true });
}

async function commitlint() {
  let currentBranch = await getCurrentBranch();
  if (currentBranch === 'master') {
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

  let commit = await getCommitSinceLastRelease();

  let formatted = await runCommitLint(commit);

  return formatted;
}

module.exports = commitlint;
