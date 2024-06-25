// Import configurations.
import { ELECTRUM_SERVERS } from 'src/config.js';

// Import services the app may require.
import { ElectrumService } from './electrum.js';
import { StampCollection } from './stamp-collection.js';

// Import a simple key-value storage that uses the IndexedDB feature of modern browsers.
import { get } from 'idb-keyval';

// Vue and Quasar.
import { ref } from 'vue';

export class App {
  // Services.
  electrum: ElectrumService;
  stampCollection?: StampCollection;

  // Flags.
  debug = ref(false);

  //---------------------------------------------------------------------------
  // Initialization
  //---------------------------------------------------------------------------

  constructor() {
    // Setup our Electrum Service.
    this.electrum = new ElectrumService(ELECTRUM_SERVERS);
  }

  async start(): Promise<void> {
    // Check that the user's browser is compatible.
    await this.checkBrowser();

    // Start the Oracle Service.
    await this.electrum.start();

    console.log('Electrum connected');
  }

  async checkBrowser(): Promise<void> {
    // Check that browser supports IndexedDB.
    try {
      // NOTE: It does not matter whether this key exists or not. If the browser does not support IndexedDB, this will throw an error.
      await get('isIndexedDbSupported');
    } catch (error) {
      throw new Error(
        'Your browser does not support IndexedDB. Please ensure you are not in a Private Window or switch to a Browser that supports IndexedDB'
      );
    }

    // Make sure that this browser supports Mutex Locks (navigator.lock).
    // TODO: Will we even need this for Guru?
    if (typeof navigator.locks === 'undefined') {
      throw new Error(
        'Your browser does not support Mutex Locks. Please update your browser or switch to a browser that supports this feature.'
      );
    }
  }

  //---------------------------------------------------------------------------
  // Methods
  //---------------------------------------------------------------------------

  //---------------------------------------------------------------------------
  // Events/Callbacks
  //---------------------------------------------------------------------------
}
