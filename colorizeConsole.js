import { green, yellow, red } from 'kleur/colors';

const colors = {
  log: green,
  warn: yellow,
  error: red,
};

export default () =>
  Object.entries(colors).forEach(([level, color]) => {
    const consoleFunction = console[level].bind(console);
    console[level] = (...args) => consoleFunction(color(args.join(' ')));
  });
