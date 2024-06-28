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
import { get } from 'idb-keyval';

// Vue and Quasar.
import { ref } from 'vue';
import { Loading } from 'quasar';

export class App {
  // Services.
  electrum: ElectrumService;
  oracles: OraclesService;

  // stampCollection?: StampCollection | undefined = reactive<{value: InstanceType<StampCollection> | undefined }>({ value:  undefined });
  stampCollection = ref<StampCollection | undefined>(
    StampCollection.generate({ count: 0 })
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
      [key]: 'mneumonic',
    ]
  */
  async getStampCollections(): Promise<Record<string, string>> {
    const collections = await get('stampCollections');
    return collections || {};
  }

  // Find a StampCollection by name and set it to the stampCollection ref.
  async getStampCollection(name: string) {
    const collections = await this.getStampCollections();

    // Example code to simulate computing a StampCollection from a mnemonic and getting funded information, etc
    const wait = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));

    // Simulate loading
    Loading.show();
    await wait(2000);

    // Set the stampCollection to the generated StampCollection
    this.stampCollection.value = StampCollection.generate({
      count: 5,
      name: name,
      mnemonic: collections[name],
      funding: { amount: 0, currency: 'BCH', funded: true },
    });
    Loading.hide();
  }

  //---------------------------------------------------------------------------
  // Events/Callbacks
  //---------------------------------------------------------------------------
}
