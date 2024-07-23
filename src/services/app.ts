// Import configurations.
import {
  ELECTRUM_SERVERS,
  ORACLE_RELAY,
  ORACLE_PUBLIC_KEYS,
} from 'src/config.js';

// Import services the app may require.
import type { DB_StampCollection } from 'src/types.js';
import { ElectrumService } from './electrum.js';
import { OraclesService } from './oracles.js';

// Database Migrations
import { migrateCollection_v1_to_v2 } from 'src/migrations/database-v1-to-v2.js';
import type { DB_StampCollection_v3 } from 'src/migrations/database-v1-to-v2.js';

// Import a simple key-value storage that uses the IndexedDB feature of modern browsers.
import { get, set } from 'idb-keyval';

import { generateBip39Mnemonic } from '@bitauth/libauth';

// Vue and Quasar.
import { reactive, ref, watch } from 'vue';

export class App {
  // Services.
  electrum: ElectrumService;
  oracles: OraclesService;

  // State.
  stampCollections = reactive<Array<DB_StampCollection>>([]);
  nextMnemonic = ref<string>('');

  // Flags.
  debug = ref(false);

  //---------------------------------------------------------------------------
  // Initialization
  //---------------------------------------------------------------------------

  constructor() {
    // Create the Oracles Service instance.
    this.oracles = new OraclesService(ORACLE_RELAY, ORACLE_PUBLIC_KEYS);

    // Setup our Electrum Service.
    this.electrum = new ElectrumService(ELECTRUM_SERVERS);
  }

  async start(): Promise<void> {
    // Check that the user's browser is compatible and perform any initialization.
    await this.initializeBrowser();

    // Initialize IndexedDB by performing and migrations and data setup that is necessary.
    await this.initializeDatabase();

    // Start the following services in parallel as they have no dependency on each other.
    await Promise.all([
      // Electrum Service
      this.electrum.start(),
      // Oracles Service
      // TODO: Should try to make this optional in case the Oracles are down.
      this.oracles.start(),
    ]);
  }

  async initializeBrowser(): Promise<void> {
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
    // TODO: Will we even need this for CashStamps?
    if (typeof navigator.locks === 'undefined') {
      throw new Error(
        'Your browser does not support Mutex Locks. Please update your browser or switch to a browser that supports this feature.'
      );
    }
  }

  async initializeDatabase(): Promise<void> {
    // Migrate the database to the latest format.
    migrateCollection_v1_to_v2();

    // Get stamp collections from IndexedDB and save them to our reactive propery.
    this.stampCollections = reactive((await get('stampCollections')) || []);

    // Watch for changes to our stamp collection so that we can sync them back to IndexedDB.
    watch(this.stampCollections, async () => {
      // TODO: Do a 'get' first and then merge our current state.
      //       This will prevent problems when accessing across multiple browser instances.
      await set('stampCollections', this.stampCollections);
    });

    // Get the next mnemonic that should be used.
    // NOTE: We do this so that the next mnemonic is preserved across sessions.
    //       This means if a user prints without funding, they can still fund upon next visit.
    this.nextMnemonic.value =
      (await get('nextMnemonic')) || generateBip39Mnemonic();

    // Watch for changes to nextMnemonic so that we can sync it back to IndexedDB.
    watch(
      this.nextMnemonic,
      async () => {
        await set('nextMnemonic', this.nextMnemonic.value);
      },
      { immediate: true }
    );
  }
}
