'use strict';

const { describe, it } = require('./helpers/mocha');
const { expect } = require('./helpers/chai');
const { gitInit } = require('git-fixtures');
const fs = require('fs');
const { promisify } = require('util');
const copyFile = promisify(fs.copyFile);
const path = require('path');

const bin = require.resolve('../bin');

async function execa() {
  const { execa } = await import('execa');

  return execa(...arguments);
}

describe(function() {
  let tmpPath;

  beforeEach(async function() {
    tmpPath = await gitInit();

    await copyFile(
      path.resolve(__dirname, 'fixtures/commitlint.config.js'),
      path.resolve(tmpPath, 'commitlint.config.js'),
    );

    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'chore: add commitlint.config.js'], { cwd: tmpPath });
  });

  describe('master branch', function() {
    it('fails when no good commits on branch', async function() {
      await execa('git', ['branch', 'foo'], { cwd: tmpPath });
      await execa('git', ['checkout', 'foo'], { cwd: tmpPath });
      await execa('git', ['commit', '--allow-empty', '-m', 'CHORE: foo'], { cwd: tmpPath });

      let err = await execa(bin, {
        cwd: tmpPath,
        reject: false,
      });

      expect(err.stdout.trim()).to.equal(`⧗   input: CHORE: foo
✖   type must be lower-case [type-case]

✖   found 1 problems, 0 warnings`);

      expect(err.exitCode).to.equal(1);
    });

    it('succeeds when one good commit and one bad type-empty commit on branch', async function() {
      await execa('git', ['branch', 'foo'], { cwd: tmpPath });
      await execa('git', ['checkout', 'foo'], { cwd: tmpPath });
      await execa('git', ['commit', '--allow-empty', '-m', ': foo'], { cwd: tmpPath });
      await execa('git', ['commit', '--allow-empty', '-m', 'chore: bar'], { cwd: tmpPath });

      let { stdout } = await execa(bin, { cwd: tmpPath });

      expect(stdout).to.equal(`⧗   input: chore: bar
✔   found 0 problems, 0 warnings
⧗   input: : foo
✔   found 0 problems, 0 warnings`);
    });

    it('succeeds when one good commit and one bad subject-empty commit on branch', async function() {
      await execa('git', ['branch', 'foo'], { cwd: tmpPath });
      await execa('git', ['checkout', 'foo'], { cwd: tmpPath });
      await execa('git', ['commit', '--allow-empty', '-m', 'chore:'], { cwd: tmpPath });
      await execa('git', ['commit', '--allow-empty', '-m', 'chore: bar'], { cwd: tmpPath });

      let { stdout } = await execa(bin, { cwd: tmpPath });

      expect(stdout).to.equal(`⧗   input: chore: bar
✔   found 0 problems, 0 warnings
⧗   input: chore:
✔   found 0 problems, 0 warnings`);
    });

    it('fails when one good commit and one bad commit on branch', async function() {
      await execa('git', ['branch', 'foo'], { cwd: tmpPath });
      await execa('git', ['checkout', 'foo'], { cwd: tmpPath });
      await execa('git', ['commit', '--allow-empty', '-m', 'CHORE: foo'], { cwd: tmpPath });
      await execa('git', ['commit', '--allow-empty', '-m', 'chore: bar'], { cwd: tmpPath });

      let err = await execa(bin, {
        cwd: tmpPath,
        reject: false,
      });

      expect(err.stdout.trim()).to.equal(`⧗   input: chore: bar
✔   found 0 problems, 0 warnings
⧗   input: CHORE: foo
✖   type must be lower-case [type-case]

✖   found 1 problems, 0 warnings`);

      expect(err.exitCode).to.equal(1);
    });

    it('ignores bad commits on default branch', async function() {
      await execa('git', ['commit', '--allow-empty', '-m', 'CHORE: foo'], { cwd: tmpPath });

      let { stdout } = await execa(bin, { cwd: tmpPath });

      expect(stdout).to.equal(`⧗   input: CHORE: foo
✔   found 0 problems, 0 warnings`);
    });
  });

  describe('custom default branch', function() {
    beforeEach(async function() {
      await execa('git', ['branch', 'foo'], { cwd: tmpPath });
      await execa('git', ['checkout', 'foo'], { cwd: tmpPath });
      await execa('git', ['branch', '-D', 'master'], { cwd: tmpPath });
    });

    it('works', async function() {
      await execa('git', ['branch', 'bar'], { cwd: tmpPath });
      await execa('git', ['checkout', 'bar'], { cwd: tmpPath });
      await execa('git', ['commit', '--allow-empty', '-m', 'CHORE: foo'], { cwd: tmpPath });

      let err = await execa(bin, ['--default-branch', 'foo'], {
        cwd: tmpPath,
        reject: false,
      });

      expect(err.stdout.trim()).to.equal(`⧗   input: CHORE: foo
✖   type must be lower-case [type-case]

✖   found 1 problems, 0 warnings`);

      expect(err.exitCode).to.equal(1);
    });

    it('ignores bad commits on default branch', async function() {
      await execa('git', ['commit', '--allow-empty', '-m', 'CHORE: foo'], { cwd: tmpPath });

      let { stdout } = await execa(bin, ['--default-branch', 'foo'], { cwd: tmpPath });

      expect(stdout).to.equal(`⧗   input: CHORE: foo
✔   found 0 problems, 0 warnings`);
    });
  });
});
