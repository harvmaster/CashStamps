<template>
  <q-page>
    <div class="inner-page">
    <h1 class="text-center strong">FAQ</h1>
    <ol>
      <li>
        <h2>What are CashStamps?</h2>
        <p>
          CashStamps are easily redeemable/reclaimable BitcoinCash wallets in
          the form of a QR Code that can be used for gifts, promotions and
          adoption of BCH with the option to reclaim any unused CashStamps so
          there's no fear of wasting BitcoinCash that's not redeemed.
        </p>
      </li>
      <li>
        <h2>Why CashStamps?</h2>
        <p>
          We wanted a quick/easy way to onboard new individuals to BitcoinCash
          by just handing them a QR code with simple instructions so they can
          easily claim BCH into a non-custodial wallet without having to walk
          them through the entire process, start-to-finish. If someone can read,
          you can hand them a CashStamp without saying anything and they can do
          the rest...hopefully.
        </p>
      </li>
      <li>
        <h2>What can I do with CashStamps?</h2>
        <p>
          Whatever you'd like! The entire purpose of CashStamps is to promote
          use and further adoption of BitcoinCash, so feel free to get creative
          with how, where and why you use CashStamps! Print as few or as many
          CashStamps as you'd like with as little or as much BCH as you'd like.
          Print them to a .pdf/.png/.jpeg image file and email them to friends,
          colleagues, clients. Print them to paper or biz cards and give them
          away as a tip when you go out to eat or get a haircut. Print them to
          stickers and put those CashStamp stickers on anything, including the
          back of other stickers for gifts or promotions. Create a BCH raffle or
          use them as door prizes; where a set of stamps have determined amounts
          and others have differing (higher) amounts. Hand out the CashStamps
          and let the end-users scan their QR codes to see who "won" the most
          BCH. Get creative...promote adoption...use BCH!
        </p>
      </li>
      <li>
        <h2>Are there risks associated with CashStamps?</h2>
        <p>
          Yes...the end of fiat by furthering the adoption of BitcoinCash and
          its rise to Global Reserve Currency! There are no hackable/ruggable
          risks associated with CashStamps. You control the CashStamps you
          create. Once you "Fund" the CashStamps you've created, you will be
          given the Seedphrase for the Electron Cash Wallet where those BCH
          funds are located. The only real risk associated with CashStamps is;
          if you fail to record/keep your funded CashStamps Seedphrase AND you
          clear your browser's cache, you will NOT be able to reclaim any
          unused/unredeemed CashStamps easily. If you haven't cleared your
          browser's cache, you can find your funded CashStamps Seedphrase in the
          creation tool...just choose the CashStamp collection you created and
          then click on "View Mnemonic" from the three-dot-menu to the right to
          reveal the specific Seedphrase for that collection.
        </p>
        <p>
          If you've cleared your browser's cache and can no longer "View
          Mnemonic" for a CashStamp collection you've previously created on the
          tool, but you DID write down your Seedphrase elsewhere, simply click
          on the + button to the left of the CashStamp collection drop down and
          click on "Import Mnemonic" and continue with the "Reclaim Stamps"
          button/process. If you've cleared your browser's cache AND you didn't
          write down your Seedphrase for the stamps you created/funded...shame
          on you! There is no way to recover those funds unless you indivudually
          scan each created CashStamp(s) QR code still in your posession. If you
          haven't given those CashStamps away, this is simple enough (although
          time-consuming), but if you've given them away, the best you can hope
          for is that the end-user claims those funds so that BCH isn't
          completely wasted.
        </p>
      </li>
      <li>
        <h2>What Wallets Work with CashStamps?</h2>
        <p>
          Due to the "Sweep" feature built into the unique QR code(s) generated
          when you "Fund" your CashStamp(s); CashStamps will not work with every
          BCH wallet in the market as not every BCH wallet supports this "Sweep"
          feature.
        </p>
        <p>
          For the end-user's "Redeeming" process; the current iteration of
          CashStamps only works with the Bitcoin.com Wallet (hence the "Step 1"
          instruction to download/install the Bitcoin.com wallet when end-user's
          go to stamps.cash to "Redeem" their CashStamp). We are currently
          working with Selene Wallet on integrating this "Sweep" feature, so
          stay tuned.
        </p>
        <p>
          For the CashStamp creator; the "Funding" process should work with any
          wallet that supports either BIP70 or JSONPaymentProto. Off the top of
          my head: Bitcoin.com Wallet, ElectronCash Wallet and Paytaca Wallet
          all support this feature.
        </p>
        <p>
          However, anyone that creates CashStamp(s) can "Reclaim [unused]
          Stamps" to any BCH wallet/address of their choice by using the
          "Reclaim Stamps" button in the CashStamps tool.
        </p>
      </li>
      <li>
        <h2>Can the text on the stamps be customized or edited?</h2>
        <p>
          Yes, somewhat. Click on the edit button next to the [drop-down]
          template of your choice and feel free to edit the HTML code and "Save"
          the template there for printing to a .pdf file or directly to your
          printer of choice. We hope to make this an easier "editable field"
          process in the future, but for now, the HTML editor works for basic
          changes to text. Pay close attention to the highlighted warning in red
          at the top of the HTML editor before proceeding. You can also export a
          JSON file if you want to be able to custom edit in Adobe Illustrator
          or other editing programs. There will be a route to get the list of
          WIFs, addresses, etc via the JSON file.
        </p>
      </li>
      <li>
        <h2>Do I have to enter an expiration date on my CashStamps?</h2>
        <p>
          Technically, no, but you'll need to remove the "Valid Until" line in
          the Template HMTL editor, after you've created the CashStamps, if you
          don't want an expiration date or the "Valid Until" text to show on the
          stamp.
        </p>
      </li>
      <li>
        <h2>What Labels do you recommend?</h2>
        <p>
          It depends on what you're wanting to print your CashStamps on, really.
          Letter sizes, labels, and templates can vary by geographic region. For
          sticker-type labels in the United States, we find the 2.5" 'Avery
          94104' sticker labels to be a good size that work well for multiple
          purposes. There is an Avery 94104 template already loaded in the
          CashStamp creation tool, you just have to buy the labels, of course
          (<a
            href="https://www.avery.com/templates/presta-94104"
            target="_blank"
            >https://www.avery.com/templates/presta-94104</a
          >).
        </p>
        <p>
          It's always a good idea to print to .pdf file FIRST, then print to a
          paper, test-page to make sure all looks well, then print to the actual
          label. Sticker labels aren't exactly cheap, so save yourself the $ and
          frustration by test printing first.
        </p>
        <p>
          We plan on adding more label templates for different CashStamp sizes
          in the near future. If you have a specific/custom label or template
          you'd like to use, feel free to get in touch via our Telegram
          (https://t.me/stampscash) and we'll consider adding it to the
          pre-loaded template list. Coding the formatting/parameters for these
          labels to integrate with the CashStamps creation tool and print
          properly is a pretty big PITA, unfortunately.
        </p>
      </li>
    </ol>
    </div>
  </q-page>
</template>

<style lang="scss" scoped>
  h1 {
    font-size: 2.5em;
    color: var(--q-primary)
  }

  h2 {
    font-size: 2em;
    color: var(--q-primary)
  }
</style>
