import { get, set } from 'idb-keyval'

export type DB_StampCollection_v1 = {
  [key: string]: string;
}

export type DB_StampCollection_v2 = {
  mnemonic: string;
  name: string;
  version: 2;
  expiry?: number;
}

export const migrateCollection_v1_to_v2 = async () => {
  // Get the StampCollections from the browser's IndexedDB.
  const collections = await get('stampCollections');
  console.table(collections)

  // If the collections are already in the new format, then we don't need to do anything.
  const newCollections = [] as DB_StampCollection_v2[];
  
  // Loop through the collections and convert them to the new format. Add them to newCollections
  Object.entries(collections).forEach(([key, val]) => {
    const version = (val as DB_StampCollection_v2).version;

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
      newCollections.push(val as DB_StampCollection_v2);
    }
  })

  console.log(newCollections)

  // Save the new format to the browser's IndexedDB.
  await set('stampCollections', newCollections);
}