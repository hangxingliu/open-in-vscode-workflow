import { AlfredResult } from './alfred/result.js';
import { main } from './index.js';
import { loadDevEnv } from './tests/utils.js';

loadDevEnv();
main({ input: 'open' })
  .then((result) => {
    AlfredResult.debugResult(result);
  })
  .catch((error) => {
    console.error(error);
  });
