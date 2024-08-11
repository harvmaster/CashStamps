import type { StampCollection } from 'src/types.js';

import { get, set } from 'idb-keyval';

export type DB_StampCollection_v1 = {
  [key: string]: string;
};

export type DB_StampCollection_v2 = {
  mnemonic: string;
  name: string;
  version: 2;
  expiry?: number;
};

export const migrateCollection_v2_to_v3 = async () => {
  // Get the StampCollections from the browser's IndexedDB.
  const collections = (await get('stampCollections')) as
    | Array<StampCollection>
    | Array<DB_StampCollection_v2>;

  if (collections === undefined) {
    return;
  }

  if (Array.isArray(collections)) {
    console.table(collections);

    const v2Collections: Array<DB_StampCollection_v2> = [];
    const newCollections: { [mnemonic: string]: StampCollection } = {};

    // Save the old V2 as a precaution.
    if (v2Collections.length) {
      await set('stampColections.v2', v2Collections);
    }

    // Save the new format to the browser's IndexedDB.
    await set('stampCollections', newCollections);

    for (const collection of collections) {
      // If this is a version 2 collection, we need to migrate it.
      if (collection.version === 2) {
        // Backup the V2 collection.
        v2Collections.push(collection);

        // Add it to the new collection.
        newCollections[collection.mnemonic] = {
          version: 3,
          mnemonic: collection.mnemonic,
          name: collection.name,
          amount: 0,
          currency: 'BCH',
          quantity: 0,
          expiry:
            new Date(collection.expiry || Date.now())
              .toISOString()
              .substring(0, 10) || new Date().toISOString().substring(0, 10),
        };
      }

      // Otherwise, leave it as is.
      else {
        newCollections[collection.mnemonic] = collection;
      }
    }
  }
};
