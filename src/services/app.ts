// Import configurations.
import {
  ELECTRUM_SERVERS,
  ORACLE_RELAY,
  ORACLE_PUBLIC_KEYS,
} from 'src/config.js';

// Import services the app may require.
import type { StampCollection, Template } from 'src/types.js';
import { ElectrumService } from './electrum.js';
import { OraclesService } from './oracles.js';

// Database Migrations
import {
  migrateCollection_v1_to_v2,
  migrateCollection_v2_to_v3,
} from 'src/migrations/migrations.js';

// Import a simple key-value storage that uses the IndexedDB feature of modern browsers.
import { get, set } from 'idb-keyval';

import { generateBip39Mnemonic } from '@bitauth/libauth';

// Vue and Quasar.
import { reactive, ref, watch, toRaw } from 'vue';

export class App {
  // Services.
  electrum: ElectrumService;
  oracles: OraclesService;

  // State.
  stampCollections = reactive<Array<StampCollection>>([]);
  templates = reactive<Array<Template>>([]);

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
    migrateCollection_v2_to_v3();

    // Get stamp collections from IndexedDB and save them to our reactive propery.
    this.stampCollections = reactive((await get('stampCollections')) || []);

    // Watch for changes to our stamp collection so that we can sync them back to IndexedDB.
    watch(
      this.stampCollections,
      async () => {
        // TODO: Do a 'get' first and then merge our current state.
        //       This will prevent problems when accessing across multiple browser instances.
        await set('stampCollections', toRaw(this.stampCollections));
      },
      { deep: true }
    );

    // Get templates from IndexedDB and save them to our reactive propery.
    this.templates = reactive((await get('templates')) || []);

    // Watch for changes to our templates so that we can sync them back to IndexedDB.
    watch(
      this.templates,
      async () => {
        // TODO: Do a 'get' first and then merge our current state.
        //       This will prevent problems when accessing across multiple browser instances.
        await set('templates', toRaw(this.templates));
      },
      { deep: true }
    );

    // If no collections exist yet, add a default one.
    if (this.stampCollections.length === 0) {
      this.addCollection();
    }
  }

  //---------------------------------------------------------------------------
  // Collections
  //---------------------------------------------------------------------------

  addCollection(opts: Partial<StampCollection> = {}): void {
    this.stampCollections.push({
      version: 3,
      mnemonic: opts.mnemonic || generateBip39Mnemonic(),
      name: opts.name || '[New Stamp Collection]',
      amount: opts.amount || 0,
      currency: opts.currency || 'BCH',
      quantity: 1,
      expiry: new Date().toISOString().slice(0, 10),
    });
  }

  deleteCollection(index: number): void {
    // Delete the collection at the given index.
    this.stampCollections.splice(index, 1);

    // If we have no collections left, add a new one.
    if (this.stampCollections.length === 0) {
      this.addCollection();
    }
  }

  //---------------------------------------------------------------------------
  // Templates
  //---------------------------------------------------------------------------

  addTemplate(template: Template) {
    this.templates.push(template);
  }

  updateTemplate(newTemplate: Template, oldTemplate: Template) {
    const indexOfTemplate = this.templates.findIndex(
      (template) => template === oldTemplate
    );

    if (indexOfTemplate === -1) {
      throw new Error('Failed to find existing template');
    }

    this.templates[indexOfTemplate] = newTemplate;
  }

  deleteTemplate(templateToDelete: Template) {
    const indexOfTemplate = this.templates.findIndex(
      (template) => template === templateToDelete
    );

    if (indexOfTemplate === -1) {
      throw new Error('Failed to find existing template');
    }

    this.templates.splice(indexOfTemplate, 1);
  }
}
