import { computed, ref } from 'vue'
import { app } from 'boot/app'

const cache = ref<{ [key: string]: number }>({})

export const useCurrencyConverter = () => {
  const convert = async (currencyPublicKey: string, amount: number, timestamp?: number) => {
    if (!timestamp) {
      const rate = app.oracles.getOraclePriceCommonUnits(currencyPublicKey)
      console.log('No timestamp provided, returning: ', amount, rate, amount / rate)
      return amount * rate
    }

    timestamp = Math.floor(timestamp / 1000)
    if (currencyPublicKey === 'BCH') return amount

    console.log('Converting: ', currencyPublicKey, amount, timestamp)
    const key = `${currencyPublicKey}-${timestamp}`

    if (cache.value[key]) return amount * cache.value[key]
    
    // Fetch the conversion rate from the Oracle
    const rate = await app.oracles.getPrice(currencyPublicKey, timestamp)
    if (!rate) throw new Error('Failed to fetch conversion rate')

    console.log('Conversion rate: ', rate)

    cache.value[key] = rate
    return amount * rate
  }

  return {
    convert,
    cache: computed(() => cache.value)
  }
}