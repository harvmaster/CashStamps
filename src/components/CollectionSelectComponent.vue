<template>
  <q-select
    label="Collection"
    :options="stampCollectionsOptions"
    v-model="model"
    option-label="label"
    option-value="mnemonic"
    emit-value
    map-options
    filled
  >
    <template v-slot:before>
      <q-btn round flat icon="add_circle">
        <q-menu>
          <q-list style="min-width: 100px">
            <q-item clickable v-close-popup @click="onNewCollection">
              <q-item-section avatar>
                <q-icon name="add" />
              </q-item-section>
              <q-item-section>New</q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="onImportCollection">
              <q-item-section avatar>
                <q-icon name="create" />
              </q-item-section>
              <q-item-section>Import Mnemonic</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-btn>
    </template>
    <template v-slot:after>
      <q-btn round flat icon="edit" @click="onRenameCollection">
        <q-tooltip>Rename</q-tooltip>
      </q-btn>
      <q-btn round flat icon="more_horiz">
        <q-menu>
          <q-list style="min-width: 100px">
            <q-item clickable v-close-popup @click="onShowMnemonicDialog">
              <q-item-section avatar>
                <q-icon name="key" />
              </q-item-section>
              <q-item-section>View Mnemonic</q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="onDeleteCollection">
              <q-item-section avatar>
                <q-icon name="delete" />
              </q-item-section>
              <q-item-section>Delete</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-btn>
    </template>
  </q-select>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useQuasar } from 'quasar';

// App / Service / Utils Imports
import { App } from 'src/services/app.js';
import type { StampCollection } from 'src/types.js';
import { Satoshis } from 'src/libcash/primitives/index.js';
import { StampsWallet } from 'src/utils/stamps-wallet.js';

interface SelectOption<T> {
  label: string;
  value: T;
}

const $q = useQuasar();

//---------------------------------------------------------------------------
// State
//---------------------------------------------------------------------------

const model = defineModel<Required<string>>({
  required: true,
});

const props = defineProps<{
  app: App;
}>();

// Computeds.
const activeCollection = computed(() => {
  return props.app.stampCollections[model.value];
});

const stampCollectionsOptions = computed(
  (): Array<SelectOption<StampCollection>> => {
    return Object.values(props.app.stampCollections).map((collection) => {
      return {
        mnemonic: collection.mnemonic,
        label: collection.name,
        value: collection,
      };
    });
  }
);

//---------------------------------------------------------------------------
// Collection Editing
//---------------------------------------------------------------------------

async function onNewCollection() {
  $q.dialog({
    title: 'New',
    message: 'Enter a name for this collection',
    prompt: {
      model: '',
    },
    cancel: true,
    persistent: true,
  }).onOk(async (name: string) => {
    // Add a new stamp collection.
    const mnemonic = props.app.setCollection({ name });

    // Set it as active.
    model.value = mnemonic;
  });
}

async function onImportCollection() {
  $q.dialog({
    title: 'Import mnemonic',
    message: 'Enter your 12 word seed phrase',
    prompt: {
      model: '',
      isValid: (mnemonic) => {
        // Trim the mnemonic.
        const trimmedMnemonic = mnemonic.trim();

        // Get the word count.
        const wordCount = trimmedMnemonic.split(/\s+/).length;

        // Ensure that 12 or 24 words are entered.
        return wordCount === 12 || wordCount === 24;
      },
    },
    cancel: true,
    persistent: true,
  }).onOk(async (mnemonic: string) => {
    try {
      // Show the loading indicator.
      $q.loading.show();

      // Trim the mnemonic.
      const trimmedMnemonic = mnemonic.trim();

      // Ensure that 12 or 24 words are entered.
      const wordCount = trimmedMnemonic.split(/\s+/).length;
      if (wordCount !== 12 && wordCount !== 24) {
        throw new Error('Invalid mnemonic: Must be 12 or 24 words');
      }

      // Initialize the Stamp Collection.
      const wallet = new StampsWallet(trimmedMnemonic, props.app.electrum);

      // Scan the wallet for existing nodes.
      await wallet.scan();

      // Set our quantity and the default amont to zero.
      let quantity = wallet.wallets.length;
      let amount = 0;

      // If there are stamps, attempt to set the amount more accurately.
      if (quantity) {
        // await wallet.wallets.value[0].refreshHistory();

        // Assume the amount based on the first ever transaction of the first ever stamp.
        // NOTE: This is guess-work - we're making a pretty big assumption here.
        amount = Satoshis.fromSats(
          wallet.wallets[0]?.transactions[0]?.getOutputs()[0]?.valueSatoshis ||
            0n
        ).toBCH();
      }

      // Add as a new collection with the given mnemonic.
      const newMnemonic = props.app.setCollection({
        mnemonic: trimmedMnemonic,
        name: trimmedMnemonic,
        quantity,
        amount,
        currency: 'BCH',
      });

      // Set it as the active collection.
      model.value = newMnemonic;

      $q.notify({
        color: 'primary',
        message: 'Mnemonic successfully imported',
      });
    } catch (error) {
      console.log(error);

      $q.notify({
        color: 'negative',
        message: `${error}`,
      });
    } finally {
      $q.loading.hide();
    }
  });
}

async function onRenameCollection() {
  $q.dialog({
    title: 'Rename Collection',
    message: 'Enter a new name for this collection',
    prompt: {
      model: '',
    },
    cancel: true,
    persistent: true,
  }).onOk(async (name: string) => {
    // Set the name of the currently active stamp collection.
    activeCollection.value.name = name;
  });
}

async function onDeleteCollection() {
  $q.dialog({
    title: 'Delete',
    message: 'Are you sure you want to delete this collection?',
    cancel: true,
    persistent: true,
  }).onOk(() => {
    // Delete the collection.
    props.app.deleteCollection(model.value);

    // Set the first collection as active.
    model.value = Object.keys(props.app.stampCollections)[0];
  });
}

async function onShowMnemonicDialog() {
  $q.dialog({
    title: 'Mnemonic',
    message: activeCollection.value?.mnemonic || 'No Stamp Collection Selected',
  });
}
</script>
