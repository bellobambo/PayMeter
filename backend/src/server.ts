import { app } from './app.js';
import { env } from './config/env.js';

app.listen(env.port, () => {
  console.log(`PayMeter backend listening on port ${env.port}`);
  console.log(`Supabase URL: ${env.supabase.url}`);
  console.log(`Nomba base URL: ${env.nomba.baseUrl}`);
});
