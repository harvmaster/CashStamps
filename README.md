# Cash Stamps

[Stamps.cash](https://stamps.cash) is a web app that allows you to create and reclaim BCH stamps/wallets. These can be used for gifting, sharing, or marketing your product with BCH, with an easy way to reclaim your stamps that go unclaimed past their expiry date. It leverages the browsers storage to store your stamps and nmemonics locally to ensure that your stamps are secure and private.

## Features

- Create stamps with a simple interface
- Reclaim stamps with a simple interface
- Stamps are stored locally in your browser
- Stamps are a simple QR code that can be scanned with a Bitcoin Cash wallet (e.g. Bitcoin.com Wallet)
- Premade templates for common use cases (e.g. A4, Letter, Avery Labels)
- Support for multiple stamp collections
- Support for multiple currencies (e.g. USD, EUR, AUD, INR, CNY) which are fetched from Oracles provided by [General Protocol](https://generalprotocols.com)

## Install the dependencies

```bash
yarn
# or
npm install
```

### Start the app in development mode (hot-code reloading, error reporting, etc.)

```bash
quasar dev
```

### Lint the files

```bash
yarn lint
# or
npm run lint
```

### Format the files

```bash
yarn format
# or
npm run format
```

### Build the app for production

```bash
quasar build
```

### Customize the configuration

See [Configuring quasar.config.js](https://v2.quasar.dev/quasar-cli-vite/quasar-config-js).
