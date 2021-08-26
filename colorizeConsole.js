/* eslint-disable security/detect-object-injection */

import { green, yellow, red } from 'kleur/colors';

const colors = {
  log: green,
  warn: yellow,
  error: red,
};

export default (logger = console) =>
  Object.entries(colors).forEach(([level, color]) => {
    const consoleFunction = logger[level].bind(console);
    logger[level] = (...args) => consoleFunction(color(args.join(' ')));
  });
