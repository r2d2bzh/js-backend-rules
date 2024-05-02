#!/usr/bin/env node
import path from 'node:path';
import { promises as fs } from 'node:fs';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { install } from './index.js';
import { spawn } from './utils.js';

/* eslint-disable security/detect-non-literal-fs-filename */

const commonYargsOptions = {
  'npm-install': {
    describe: 'operate an npm install for test and for each service',
    type: 'boolean',
    default: true,
  },
  color: {
    describe: 'enable output colorization',
    type: 'boolean',
    default: true,
  },
};

yargs(hideBin(process.argv))
  .command(
    ['install', '$0'],
    'install the ruler and immediately apply all the rules',
    (yargs) =>
      yargs.options({
        ...commonYargsOptions,
        'git-parent': {
          describe: 'execute in the closest git parent folder instead of the current working directory',
          type: 'boolean',
          default: false,
        },
      }),
    install,
  )
  .command(
    'add <service>',
    'add a new service folder and re-apply all the rules',
    (yargs) => yargs.options(commonYargsOptions),
    async ({ service, ...options }) => {
      await fs.mkdir(service, { recursive: true });
      await spawn('npm', 'init', '-y')(service);
      await ensureFile(path.join(service, 'Dockerfile'));
      await install(options);
    },
  )
  .help().argv;

const ensureFile = async (file) => {
  try {
    await fs.stat(file);
  } catch (error) {
    if (error.code === 'ENOENT') {
      const fh = await fs.open(file, 'w');
      await fh.close();
    } else {
      throw error;
    }
  }
};
