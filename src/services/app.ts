// Import configurations.
import {
  ELECTRUM_SERVERS,
  ORACLE_RELAY,
  ORACLE_PUBLIC_KEYS,
} from 'src/config.js';

// Import services the app may require.
import { ElectrumService } from './electrum.js';
import { OraclesService } from './oracles.js';
import { StampCollection } from './stamp-collection.js';

// Database Migrations 
import { migrateCollection_v1_to_v2 } from 'src/utils/migrations/database-v1-to-v2.js';

// Import a simple key-value storage that uses the IndexedDB feature of modern browsers.
import { get } from 'idb-keyval';

// Vue and Quasar.
import { ref } from 'vue';
import { Loading } from 'quasar';
import { DB_StampCollection } from 'src/types.js';

export class App {
  // Services.
  electrum: ElectrumService;
  oracles: OraclesService;

  // stampCollection?: StampCollection | undefined = reactive<{value: InstanceType<StampCollection> | undefined }>({ value:  undefined });
  stampCollection = ref<StampCollection | undefined>(
    StampCollection.generate({ quantity: 0 })
  );

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
    // Check that the user's browser is compatible.
    await this.checkBrowser();

    // Start the following services in parallel as they have no dependency on each other.
    await Promise.all([
      // Electrum Service
      this.electrum.start(),
      // Oracles Service
      // TODO: Should try to make this optional in case the Oracles are down.
      this.oracles.start(),

      // this.importOldCollections(), // Test code for migration
      migrateCollection_v1_to_v2(),
    ]);

    // Start the Oracle Service.
    // await this.electrum.start();

    // console.log('Electrum connected');
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
    // TODO: Will we even need this for CashStamps?
    if (typeof navigator.locks === 'undefined') {
      throw new Error(
        'Your browser does not support Mutex Locks. Please update your browser or switch to a browser that supports this feature.'
      );
    }
  }

  //---------------------------------------------------------------------------
  // Methods
  //---------------------------------------------------------------------------

  // --------------------------------------------------------------------------
  // Database_Methods
  //---------------------------------------------------------------------------
  //
  // Get the StampCollections from the browser's IndexedDB.
  async getStampCollections(): Promise<DB_StampCollection[]> {
    const collections: DB_StampCollection[] | undefined = await get('stampCollections');
    return collections || [];
  }

  // Find a StampCollection by name and set it to the stampCollection ref.
  async getStampCollection(name: string) {
    Loading.show();

    // TODO: Rename this to useStampCollection or something similar.
    // Get the StampCollections from the browser's IndexedDB.
    const collections = await this.getStampCollections();

    // Load the StampCollection from the mnemonic.
    const collection = collections.find((c) => c.name === name);
    if (!collection) {
      throw new Error(`StampCollection with name "${name}" not found`);
    }

    const expiry = collection.expiry ? new Date(collection.expiry) : undefined;

    // Set the StampCollection to the stampCollection ref.
    this.stampCollection.value = await StampCollection.fromMnemonic(collection.mnemonic, expiry);
    
    Loading.hide();
  }

  //---------------------------------------------------------------------------
  // Events/Callbacks
  //---------------------------------------------------------------------------
}
