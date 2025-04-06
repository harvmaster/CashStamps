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
    | { [mnemonic: string]: StampCollection }
    | Array<DB_StampCollection_v2>;

  if (collections === undefined) {
    return;
  }

  if (Array.isArray(collections)) {
    console.table(collections);

    // Save the old V2 as a precaution.
    if (collections.length) {
      await set('stampCollections.v2', collections);
    }

    // Attempt to migrate to V3 format
    const newCollections: { [mnemonic: string]: StampCollection } = {};

    try {
      for (const collection of collections) {
        // If this is a version 2 collection, we need to migrate it.
        if (collection.version === 2) {
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
          throw new Error(
            `Unknown version "${collection.version}" - disregarding`
          );
        }
      }
    } catch (error) {
      console.error(
        'Failed to migrate collections. Old collections are saved under stampCollections.v2.',
        error
      );
    }

    // Save the new format to the browser's IndexedDB.
    await set('stampCollections', newCollections);
  }
};

export const migration202504021400 = async () => {
  const templates = (await get('templates')) as { [uuid: string]: any };

  if (typeof templates === 'undefined') {
    return;
  }

  const updatedTemplates: { [uuid: string]: any } = {};
  let isUpdated = false;

  for (const [uuid, templateData] of Object.entries(templates)) {
    // If this template needs updating...
    if (templateData.template) {
      // Set the front and back data for this template.
      const updatedDataForTemplate = {
        ...templateData,
        front: templateData.template,
        back: '',
      };

      // Delete the "template" property as it's obsolete.
      delete updatedDataForTemplate['template'];

      // Add it to the updatedTemplates data.
      updatedTemplates[uuid] = updatedDataForTemplate;

      console.log('Updating', templateData);

      // Set isUpdated to true since migrations took place.
      isUpdated = true;
    }
    // Otherwise, this template is already updated.
    else {
      updatedTemplates[uuid] = templateData;
    }
  }

  // If migrations took place, update storage.
  if (isUpdated) {
    // Backup the old templates as a precaution.
    await set('templates202504021400', templates);

    // Update templates to new format.
    await set('templates', updatedTemplates);

    // Print the migration.
    console.log('Migration 202504021400: Ran');
    console.table(updatedTemplates);
  }
};
