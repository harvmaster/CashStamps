<template>
  <q-select
    :label="t('collection')"
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
              <q-item-section>{{ t('new') }}</q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="onImportCollection">
              <q-item-section avatar>
                <q-icon name="create" />
              </q-item-section>
              <q-item-section>{{ t('importMnemonic') }}</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-btn>
    </template>
    <template v-slot:after>
      <q-btn round flat icon="edit" @click="onRenameCollection">
        <q-tooltip>{{ t('rename') }}</q-tooltip>
      </q-btn>
      <q-btn round flat icon="more_horiz">
        <q-menu>
          <q-list style="min-width: 100px">
            <q-item clickable v-close-popup @click="onShowMnemonicDialog">
              <q-item-section avatar>
                <q-icon name="key" />
              </q-item-section>
              <q-item-section>{{ t('viewMnemonic') }}</q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="onDeleteCollection">
              <q-item-section avatar>
                <q-icon name="delete" />
              </q-item-section>
              <q-item-section>{{ t('delete') }}</q-item-section>
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
import { useI18n } from 'vue-i18n';

// App / Service / Utils Imports
import { App } from 'src/services/app.js';
import type { StampCollection } from 'src/types.js';
import { Satoshis } from 'src/utils/satoshis.js';
import { WalletHD } from 'src/utils/wallet-hd.js';

// translations
import translations from './CollectionSelectComponent.i18n.json';

interface SelectOption<T> {
  label: string;
  value: T;
}

const $q = useQuasar();
const { t } = useI18n({
  inheritLocale: true,
  useScope: 'local',
  messages: translations.messages,
});

//---------------------------------------------------------------------------
// State
//---------------------------------------------------------------------------

const _emits = defineEmits(['wallet:updated']);

const model = defineModel<string>({
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
    title: t('new'),
    message: t('enterNameForCollection'),
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
    title: t('importMnemonic'),
    message: t('enterSeedPhrase'),
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
        throw new Error(t('invalidMnemonic'));
      }

      // Initialize the Stamp Collection.
      const wallet = await WalletHD.fromMnemonic(
        trimmedMnemonic,
        props.app.electrum
      );

      // Scan the wallet for existing nodes.
      await wallet.scan();

      // Set our quantity and the default amount to zero.
      let quantity = wallet.wallets.value.length;
      let amount = 0;

      // If there are stamps, attempt to set the amount more accurately.
      if (quantity) {
        // Assume the amount based on the first-ever transaction of the first-ever stamp.
        amount = Satoshis.fromSats(
          wallet.wallets.value[0]?.transactions.value[0]?.getOutputs()[0]
            ?.valueSatoshis || 0n
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
        message: t('mnemonicImported'),
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
    title: t('renameCollection'),
    message: t('enterNewNameForCollection'),
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
    title: t('delete'),
    message: t('deleteConfirmation'),
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
    title: t('mnemonic'),
    message: activeCollection.value?.mnemonic || t('noStampCollectionSelected'),
  });
}
</script>
