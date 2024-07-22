import { computed, ref, watch } from 'vue';

import {
  StampCollection,
  GenerateOptions,
} from 'src/services/stamp-collection';

import { dateToString } from 'src/utils/misc';
import { App } from 'src/services/app';

export const useCollectionForm = (app: App) => {
  const collectionForm = ref<Required<GenerateOptions>>({
    name: '',
    quantity: 1,
    expiry: dateToString(new Date()),
    funding: {
      value: 0,
      currency: 'BCH',
      funded: false,
    },
    mnemonic: '',
  });

  const createCollection = async () => {
    const mnemonic = !app.stampCollection.value?.getFundingOptions()?.funded
      ? app.stampCollection.value?.getMnemonic()
      : undefined;

    app.stampCollection.value = StampCollection.generate(app.electrum,{
      quantity: collectionForm.value.quantity,
      name: collectionForm.value.name,
      expiry: collectionForm.value.expiry,
      mnemonic,
      funding: {
        value: collectionForm.value?.funding.value,
        currency: collectionForm.value?.funding.currency,
        funded: false,
      },
    });
  };

  const clearCollection = () => {
    app.stampCollection.value = StampCollection.generate(app.electrum, { quantity: 0 });
  };

  // Watch for changes in the stamp collection, and update the form accordingly.
  watch(app.stampCollection, async () => {
    collectionForm.value = {
      name: app.stampCollection.value?.getName() || '',
      quantity: app.stampCollection.value?.getStamps().length || 1,
      expiry: dateToString(app.stampCollection.value?.getExpiry()),
      funding: {
        value: app.stampCollection.value?.getFundingOptions()?.value || 0,
        currency:
          app.stampCollection.value?.getFundingOptions()?.currency || 'BCH',
        funded: app.stampCollection.value?.getFundingOptions()?.funded || false,
      },
      mnemonic: '',
    };
  });

  const stampCollction = computed(() => app.stampCollection.value);
  const fundingOptions = computed(() =>
    stampCollction.value?.getFundingOptions()
  );
  watch(
    () => fundingOptions.value?.funded,
    () => {
      collectionForm.value.funding.funded =
        fundingOptions.value?.funded || false;
    }
  );

  return {
    collectionForm,
    createCollection,
    clearCollection,
  };
};
