import { createApp, analytics, genie, lakebase, server } from '@databricks/appkit';
import { setupMobilityOpsRoutes } from './routes/lakebase/mobility-ops-routes';

createApp({
  plugins: [analytics(), genie(), lakebase(), server()],
  async onPluginsReady(appkit) {
    await setupMobilityOpsRoutes(appkit);
  },
}).catch(console.error);
