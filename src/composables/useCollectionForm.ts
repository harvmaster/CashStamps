import { ref, watch } from 'vue'

import { app } from 'src/boot/app'
import { StampCollection, GenerateOptions } from 'src/services/stamp-collection'

export const useCollectionForm = () => {
  const collectionForm = ref<Required<GenerateOptions>>({
    name: '',
    quantity: 1,
    funding: {
      value: 0,
      currency: 'BCH',
      funded: false
    },
    mnemonic: ''
  })

  const createCollection = async () => {
    const mnemonic = !app.stampCollection.value?.getFundingOptions()?.funded ? app.stampCollection.value?.getMnemonic() : undefined

    app.stampCollection.value = StampCollection.generate({ 
      quantity: collectionForm.value.quantity,
      name: collectionForm.value.name,
      mnemonic,
      funding: {
        value: collectionForm.value?.funding.value,
        currency: collectionForm.value?.funding.currency,
        funded: false
      }
    })
  }

  const clearCollection = () => {
    app.stampCollection.value = StampCollection.generate({ quantity: 0 })
  }

  // Watch for changes in the stamp collection, and update the form accordingly.
  watch(app.stampCollection, async () => {
    collectionForm.value = {
      name: app.stampCollection.value?.getName() || '',
      quantity: app.stampCollection.value?.getStamps().length || 1,
      funding: {
        value: app.stampCollection.value?.getFundingOptions()?.value || 0,
        currency: app.stampCollection.value?.getFundingOptions()?.currency || 'BCH',
        funded: app.stampCollection.value?.getFundingOptions()?.funded || false
      },
      mnemonic: ''
    }
  })

  return {
    collectionForm,
    createCollection,
    clearCollection
  }

}