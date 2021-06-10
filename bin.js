#!/usr/bin/env node
import { install } from './index.js';

install().catch(() => {
  process.exit(1);
});
