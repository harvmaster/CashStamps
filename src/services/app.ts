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

// Import a simple key-value storage that uses the IndexedDB feature of modern browsers.
import { get, set } from 'idb-keyval';

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
      this.migrateCollection_v1_to_v2(),
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

  // Get the StampCollections from the browser's IndexedDB.
  /*
    stampCollections: [
      {  
        mnemonic: 'mneumonic',
        name: 'name',
        veersion: 2,
        Expiry?: Date
      }
    ]
  */
  async getStampCollections(): Promise<DB_StampCollection[]> {
    const collections: DB_StampCollection[] | undefined = await get('stampCollections');
    return collections || [];
  }

  // Find a StampCollection by name and set it to the stampCollection ref.
  async getStampCollection(name: string) {
    Loading.show();

    // Get the StampCollections from the browser's IndexedDB.
    const collections = await this.getStampCollections();

    // Load the StampCollection from the mnemonic.
    const collection = collections.find((c) => c.name === name);
    if (!collection) {
      throw new Error(`StampCollection with name "${name}" not found`);
    }

    // Set the StampCollection to the stampCollection ref.
    this.stampCollection.value = await StampCollection.fromMnemonic(collection.mnemonic);
    
    Loading.hide();
  }

  async migrateCollection_v1_to_v2() {
    // Get the StampCollections from the browser's IndexedDB.
    const collections = await get('stampCollections');
    console.table(collections)

    // If the collections are already in the new format, then we don't need to do anything.
    const newCollections = [] as DB_StampCollection[];
    
    // Loop through the collections and convert them to the new format. Add them to newCollections
    Object.entries(collections).forEach(([key, val]) => {
      const version = (val as DB_StampCollection).version;

      // If the version is not set, then we need to migrate it.
      if (!version) {
        console.log('migratinng collection', key)
        newCollections.push({
          name: key,
          mnemonic: val as string,
          version: 2,
        });
      } else {
        // If the version is already set, then we don't need to do anything.
        newCollections.push(val as DB_StampCollection);
      }
    })

    console.log(newCollections)

    // Save the new format to the browser's IndexedDB.
    await set('stampCollections', newCollections);
  }

  //---------------------------------------------------------------------------
  // Events/Callbacks
  //---------------------------------------------------------------------------
}
