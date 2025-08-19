import { env } from './utils/env.js';
import { app } from './app.js';

app.listen(env.port, () => {
  console.log(`API listening on http://localhost:${env.port}`);
});
