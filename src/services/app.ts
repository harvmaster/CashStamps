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
import { get, set } from 'idb-keyval';

// Vue and Quasar.
import { Ref, ref } from 'vue';
import { Loading } from 'quasar';
import { DB_StampCollection } from 'src/types.js';

export class App {
  // Services.
  electrum: ElectrumService;
  oracles: OraclesService;

  // stampCollection?: StampCollection | undefined = reactive<{value: InstanceType<StampCollection> | undefined }>({ value:  undefined });
  // stampCollection = ref<StampCollection | undefined>(
  //   StampCollection.generate(this.electrum, { quantity: 0 })
  // );
  stampCollection: Ref<StampCollection | undefined> = ref(undefined);

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

    // Set the stampCollection to a new StampCollection instance.
    this.stampCollection.value = StampCollection.generate(this.electrum, {
      quantity: 0
    });
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

  //--------------------------------------------------------------------------
  // Database_Methods
  //---------------------------------------------------------------------------

  // Get the StampCollections from the browser's IndexedDB.
  async getStampCollections(): Promise<DB_StampCollection[]> {
    const collections: DB_StampCollection[] | undefined = await get(
      'stampCollections'
    );
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
    this.stampCollection.value = await StampCollection.fromMnemonic(
      this.electrum,
      collection.mnemonic,
      expiry
    );

    Loading.hide();
  }

  async saveStamps (stampCollection: StampCollection) {
    // Get the name or use the mnemonic as the name
    const name = stampCollection.getName() || stampCollection.getMnemonic();
    const mnemonic = stampCollection.getMnemonic();
    const expiry = stampCollection.getExpiry();

    // Get the existing collections or create a new one
    const collections = await this.getStampCollections();

    // Check if the collection already exists
    const existingIndex = collections.findIndex((c) => c.name === name);

    // If the collection exists, Overwrite it
    if (existingIndex > -1) {
      collections[existingIndex] = {
        name,
        mnemonic,
        version: 2,
        expiry: expiry.getTime(),
      };
    } else {
      // If the collection does not exist, Add it
      collections.push({
        name,
        mnemonic,
        version: 2,
        expiry: expiry.getTime(),
      });
    }

    // Save the collections back to IDB
    await set('stampCollections', collections);
  }

  //---------------------------------------------------------------------------
  // Events/Callbacks
  //---------------------------------------------------------------------------
}
