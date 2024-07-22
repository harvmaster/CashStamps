import { App } from 'src/services/app.js';

import { boot } from 'quasar/wrappers';
import { Loading } from 'quasar';

// Create a singleton of our app service.
export const app = new App();

// Boot (initialize) the service:
// For more info on params: https://v2.quasar.dev/quasar-cli/boot-files
export default boot(async () => {
  // // Show the Loading Indicator.
  // Loading.show();

  // // Start the App service.
  // await app.start();

  // // Hide the loading indicator.
  // Loading.hide();
});
