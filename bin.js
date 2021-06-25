#!/usr/bin/env node
import { join as path } from 'path';
import { promises as fs } from 'fs';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { install } from './index.js';
import { npm } from './utils.js';

yargs(hideBin(process.argv))
  .command(['install', '$0'], 'install the ruler and immediately apply all the rules', () => {}, install)
  .command(
    'add <service>',
    'add a new service folder and re-apply all the rules',
    () => {},
    async ({ service }) => {
      await fs.mkdir(service, { recursive: true });
      await npm('init', '-y')(service);
      await ensureFile(path(service, 'Dockerfile'));
      await install();
    }
  )
  .help().argv;

const ensureFile = async (file) => {
  try {
    await fs.stat(file);
  } catch (e) {
    if (e.code === 'ENOENT') {
      const fh = await fs.open(file, 'w');
      await fh.close();
    } else {
      throw e;
    }
  }
};
