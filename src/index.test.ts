import { AlfredResult } from './alfred/result.js';
import { main } from './index.js';
import { loadDevEnv } from './tests/utils.js';

const DEFAULT_INPUT = 'open-in';

loadDevEnv();
main({ input: process.argv[2] || DEFAULT_INPUT })
  .then((result) => {
    AlfredResult.debugResult(result);
  })
  .catch((error) => {
    console.error(error);
  });
