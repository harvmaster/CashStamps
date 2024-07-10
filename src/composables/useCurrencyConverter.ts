import { computed, ref } from 'vue';
import { app } from 'boot/app';

const cache = ref<{ [key: string]: number }>({});

export const useCurrencyConverter = () => {
  const convert = async (
    currencyPublicKey: string,
    amount: number,
    timestamp?: number
  ) => {
    // Return the amount if the currency is BCH (its already in BCH)
    if (currencyPublicKey === 'BCH') return amount;

    // Return the latest conversion rate if no timestamp is provided
    if (!timestamp) {
      const rate = app.oracles.getOraclePriceCommonUnits(currencyPublicKey);
      return amount * rate;
    }

    // Convert the timestamp to seconds
    timestamp = Math.floor(timestamp / 1000);

    // Check the cache for the conversion rate
    const key = `${currencyPublicKey}-${timestamp}`;
    if (cache.value[key]) return amount * cache.value[key];

    // Fetch the conversion rate from the Oracle
    const rate = await app.oracles.getPrice(currencyPublicKey, timestamp);
    if (!rate) throw new Error('Failed to fetch conversion rate');

    // Store the conversion rate in the cache
    cache.value[key] = rate;

    // Return the converted amount
    return amount * rate;
  };

  return {
    convert,
    cache: computed(() => cache.value),
  };
};
