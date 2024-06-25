<template>
  <div>
    <q-input v-model="numberOfWallets" type="number" label="Number of wallets to generate" />
    <q-btn @click="generateWallets" label="Generate Wallets" />
    
    <div v-for="wallet in wallets" :key="wallet.address">
      <h3>Wallet {{ wallet.index }}</h3>
      <p>Address: {{ wallet.address }}</p>
      <p>Private Key: {{ wallet.privateKey }}</p>
      <q-btn @click="() => printWallet(wallet)" label="Print" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineComponent, ref, Ref } from 'vue'
import { generateWallet, Wallet } from '../../lib/bchWallet'

interface WalletWithIndex extends Wallet {
  index: number;
}

const numberOfWallets: Ref<number> = ref(1);
const wallets: Ref<WalletWithIndex[]> = ref([]);
const isGenerating: Ref<boolean> = ref(false);

const generateWallets = async (): Promise<void> => {
  isGenerating.value = true;
  wallets.value = [];
  try {
    for (let i = 0; i < numberOfWallets.value; i++) {
      const newWallet = await generateWallet();
      wallets.value.push({
        index: i + 1,
        ...newWallet
      });
    }
  } catch (error) {
    console.error('Error generating wallets:', error);
    // Handle error appropriately
  } finally {
    isGenerating.value = false;
  }
};

const printWallet = (wallet: WalletWithIndex): void => {
  const printContent = `
    <h2>BCH Wallet</h2>
    <p>Address: ${wallet.address}</p>
    <p>Private Key: ${wallet.privateKey}</p>
  `;
  const printWindow = window.open('', '', 'width=600,height=600');
  if (printWindow) {
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  } else {
    console.error('Failed to open print window');
  }
};
</script>