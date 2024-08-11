import { AddressNotification, ElectrumRequest } from './electrum-types.js';

import { ElectrumClient } from '@electrum-cash/network';

export type AddressCallback = (status: string | null) => void;

export class ElectrumService {
  electrumClient!: ElectrumClient;

  // Address subscriptions.
  addressSubscriptions: { [address: string]: AddressCallback } = {};

  constructor(
    public readonly servers: string[],
    public readonly application = 'BCHApp',
    public readonly version = '1.5'
  ) {}

  async start(): Promise<void> {
    // TODO: We want to use a Cluster instead of a Client, but as of 2022-07-07 there are issues with Subscriptions on Cluster.
    //       See: https://gitlab.com/GeneralProtocols/anyhedge/whitelabel/frontend/-/issues/76

    // Iterate over each server in our list of servers.
    // NOTE: We are still using an Electrum Client due to the above bug.
    //       But, if we cannot connect to the first server, we will try the second (and third if given, etc) as a fallback.
    for (const electrumServer of this.servers) {
      // Initialize an Electrum client using the given server.
      const electrum = new ElectrumClient(
        this.application,
        this.version,
        electrumServer,
        50004,
        'wss'
      );

      // Attempt to connect to this Electrum Server.
      try {
        await electrum.connect();
      } catch (error) {
        console.warn(error);

        // If it fails to connect, try the next server in our list.
        continue;
      }

      // Save the client.
      this.electrumClient = electrum;

      // Setup notification handler.
      this.electrumClient.on('notification', this.onNotification.bind(this));

      // Return to prevent further execution.
      return;
    }

    // Throw an error if we failed to connect to any of our Electrum Servers.
    throw new Error(
      'Failed to connect to Electrum. Please try restarting your browser and ensure you are currently connected to the internet.'
    );
  }

  async request<T extends ElectrumRequest>(
    endpoint: T['method'],
    ...params: T['params']
  ): Promise<T['response']> {
    const response = await this.electrumClient.request(endpoint, ...params);

    if (response instanceof Error) {
      throw response;
    }

    return response;
  }

  async subscribeAddress(address: string, callback: AddressCallback) {
    await this.electrumClient.subscribe(
      'blockchain.address.subscribe',
      address
    );

    this.addressSubscriptions[address] = callback;
  }

  async unsubscribeAddress(address: string, _callback: AddressCallback) {
    if (!this.addressSubscriptions[address]) {
      return;
    }

    delete this.addressSubscriptions[address];

    try {
      await this.electrumClient.unsubscribe(
        'blockchain.address.unsubscribe',
        address
      );
    } catch (error) {
      console.warn(`${error}`);
    }
  }

  onNotification(data: AddressNotification) {
    // Handle Address notification.
    if (data.method === 'blockchain.address.subscribe') {
      const address = data.params[0];
      const status = data.params[1];
      const subscription = this.addressSubscriptions[address];

      if (!subscription) {
        console.warn(
          `Notification for address ${address} subscribed to, but has no handler`
        );
        return;
      }

      // Trigger the subscription's callback.
      subscription(status);
    }
  }
}
