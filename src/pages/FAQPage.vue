<template>
  <q-page>
    <div class="inner-page">
      <!-- If the language is NOT set to Spanish, use English -->
      <template v-if="language !== 'es'">
        <h1 class="text-center strong">FAQ</h1>
        <div>
          <section class="faq-section">
            <h2>What are CashStamps?</h2>
            <p>CashStamps are easily redeemable/reclaimable, printable/physical, BitcoinCash ‘paper wallets’ in the form of a QR Code that can be used for gifts, tips, promotions, and onboarding/adoption of BCH with the option to reclaim any unredeemed CashStamps so there's no fear of wasting your BitcoinCash.</p>
          </section>

          <section class="faq-section">
            <h2>Why CashStamps?</h2>
            <p>We saw the need for a quick/easy way to onboard new individuals and merchants to BitcoinCash by just handing them a printed, QR code ‘paper-wallet’ with simple instructions so they can easily redeem BCH into a non-custodial wallet without having to verbally walk them through the entire process, start-to-finish. If someone can read, you can hand them a CashStamp without saying anything and they can do the rest...hopefully.</p>
          </section>

          <section class="faq-section">
            <h2>What can I do with CashStamps?</h2>

            <p>Whatever you'd like! The entire purpose of CashStamps is to promote use, onboarding, and further adoption of BitcoinCash, so feel free to get creative with how, where and why you use CashStamps!</p>

            <p>Print as few or as many CashStamps as you'd like and fund them with as little or as much BCH as you'd like. Print them to a .pdf/.png/.jpeg image file and email them to friends, colleagues, clients. Print them on paper, thank-you, or biz cards and give them away as a tip when you go out to eat or get a haircut.</p>

            <p>Print them to stickers and put those CashStamp stickers on anything, including the back of other stickers for gifts or promotions. Leave them any/everywhere, since there’s no risk of losing the BCH if they go un-redeemed and you can simply reclaim the unredeemed CashStamps back to a BCH wallet of your choice.</p>

            <p>Create a BCH raffle or use them as door prizes; where a set of stamps have determined amounts and others have differing (higher) amounts. Hand out the CashStamps and let the end-users scan their QR codes to see who 'won' the most BCH. Get creative...promote adoption...use BCH!</p>

            <p>Although we do not recommend it; we have even seen some communities - where internet access is spotty/unreliable - use CashStamps as a physical Medium of Exchange when necessary. This type of transaction involves trusting the person giving you the CashStamp - if its balance cannot be immediately verified via a QR Code scan of the CashStamp - so be careful if you utilize CashStamps in this way.</p>
          </section>

          <section class="faq-section">
            <h2>Are there risks associated with CashStamps?</h2>

            <p>Yes...the end of fiat currency by furthering the adoption of BitcoinCash and its rise to Global Reserve Currency!</p>

            <p>There are no hackable/ruggable risks associated with CashStamps. You control the CashStamps you create. Once you 'Fund' the CashStamps you've created/printed, you will be given the Mnemonic ‘Seedphrase’ for the Electron Cash Wallet where those BCH funds are located. Only you know that “Seedphrase’, so protect it just like you would any other wallet ‘Seedphrase’.</p>

            <p>The only real risk associated with CashStamps is; <strong>if you fail to record/keep/write-down your funded CashStamps’ ‘Seedphrase’ AND you clear your browser's cache, you will NOT be able to reclaim any unused/unredeemed CashStamps easily.</strong> If you haven't cleared your browser's cache, you can find your funded CashStamps Seedphrase in the creation tool...just choose the CashStamp collection you created and then click on 'View Mnemonic' from the three-dot-menu to the right to reveal the specific ‘Seedphrase’ for that specific CashStamps’ collection/print-run.</p>

            <div class="flex row justify-center q-py-md">
              <img src="/img/faq-mnemonic-button.png" style="max-width: 100%" />
            </div>

            <p>If you have cleared your browser's cache and can no longer 'View Mnemonic' for a CashStamp collection you've previously created on the tool, but you DID write down your Seedphrase elsewhere, simply click on the + button to the left of the CashStamp collection drop down and click on 'Import Mnemonic' and continue with the 'Reclaim Stamps' button/process.</p>

            <p>If you have cleared your browser's cache AND you didn't write down your ‘Seedphrase’ for the CashStamps you created/printed and funded...shame on you! There is no way to recover those funds quickly - with a simple/single ‘Reclaim’ sweep function on the tool - but you can scan each created CashStamp(s) QR code still in your possession, individually (one-by-one), if you haven't already given those CashStamps away. This is simple enough (although time-consuming). If you've given any of those printed/funded CashStamps away, the best you can hope for is that the end-user(s) redeem their CashStamp, so that your BCH isn’t completely wasted (locked-up in an orphaned paper-wallet).</p>
          </section>

          <section class="faq-section">
            <h2>What Wallets Work with CashStamps?</h2>

            <p>Due to the 'Sweep' feature (BCH-Wif Protocol) built into the unique QR code(s) generated when you 'Fund' your CashStamp(s); CashStamps will not work with every BCH wallet in the market as not every BCH wallet supports this BCH-Wife Protocol 'Sweep' feature.</p>

            <p>For the end-user's 'Redeeming' process; the current iteration of CashStamps works with the following BCH Wallets and only these wallets are choosable for the “Step 1- Wallet Install” QR code implementation on the left side of the CashStamp:</p>

            <ul>
              <li><a href="https://selene.cash/" target="_blank">Selene Wallet</a> (iOS &amp; Android)</li>
              <li><a href="https://flowee.org/products/pay/#dl" target="_blank">Flowee Pay Wallet</a> (Android Only)</li>
              <li><a href="https://www.paytaca.com/applications/wallet" target="_blank">Paytaca Wallet</a> (iOS &amp; Android)</li>
              <li><a href="https://zapit.io/" target="_blank">Zapit Wallet</a> (iOS &amp; Android, Desktop and Web)</li>
            </ul>

            <p>For the CashStamp creator; the 'Funding' process should work with any wallet that supports either BIP70 or JSON Payment Protocol: Selene Wallet, ElectronCash Wallet, Flowee Pay, Paytaca Wallet and Bitcoin.com Wallet all support this feature.</p>

            <p>Anyone that has access to any specific CashStamp collection’s mnemonic ‘Seedphrase’ can 'Reclaim [unredeemed] CashStamps' to any BCH wallet/address of their choice by simply using the 'Reclaim Stamps' button in the CashStamps tool and entering in their wallet address. Keep your funded CashStamps ‘Seedphrase’ and access to your computer’s browser safe at all times.</p>
          </section>

          <section class="faq-section">
            <h2>Can the text on the stamps be customized or edited?</h2>

            <p>Yes, somewhat. Click on the edit button next to the [drop-down] template of your choice and feel free to edit the HTML code and 'Save' the template there for printing to a .pdf file or directly to your printer of choice. We hope to make this an easier 'editable field' process in the future, but for now, the HTML editor works for basic changes to text. Pay close attention to the highlighted warning in red at the top of the HTML editor before proceeding. You can also export a .JSON file if you want to be able to custom edit in Adobe Illustrator or other editing programs. There will be a route to get the list of WIFs, addresses, etc via the JSON file.</p>

            <div class="flex row justify-center">
              <img
                src="/img/faq-template-editing.png"
                style="max-width: 100%; width: 30em"
              />
            </div>
          </section>

          <section class="faq-section">
            <h2>Do I have to enter an expiration date on my CashStamps?</h2>

            <p>Technically, no, but you'll need to remove the “Valid Until” line in the Template HTML editor, after you've created the CashStamps, if you don't want an expiration date or the “Valid Until” text to show on the CashStamp.</p>

            <p>We believe it’s a good idea to include an expiration date on any/all printed/funded CashStamps as it promotes a sense of urgency for the receiver to use/redeem the CashStamp, sooner than later.</p>

            <p>Technically, as the issuer/creator of the CashStamp(s), you can reclaim any unredeemed CashStamp(s) at any time as the “Reclaim Stamps” button/process on the tool is manual and NOT automatic. Just don’t be greedy and reclaim your disbursed CashStamp(s) before their listed expiration dates as that would create a poor, first-impression to BitcoinCash for someone that might not redeem their CashStamp immediately after you give it to them. Once the expiration date has arrived/passed, feel free to load your specific CashStamps collection in the tool - if it’s already cached there or simply load the collection’s mnemonic ‘Seedphrase’ - and click the “Reclaim Stamps” button for full reclaiming of any unused/unredeemed CashStamps by their printed expiration date.</p>
          </section>

          <section class="faq-section">
            <h2>What Labels do you recommend?</h2>

            <p>It depends on what you're wanting to print your CashStamp(s) on, really. Letter sizes, labels, biz cards and templates can vary by geographic region.</p>

            <p>For normie/noob onboarding/adoption, we find that the 2-QR Code “Biz Card” CashStamps work best as it first prompts the receiver to install a wallet (Step 1), then scan the second QR to redeem the BCH (Step 2). The noob/receiver can scan either QR with their phone’s stock camera and they work well, but it is important that they have a BCH wallet installed first (Step 1). If you want a higher-quality, professional look, it’s worth the extra cost to have these printed at a professional printer if you don’t have access to one personally. We recommend printing to a .pdf file, then taking it to be printed/cut to size at your local Kinkos/FedEx or printing outfit of your choice.</p>

            <p>If you do want to print from your home/office using your own printer, any of these <a href="https://www.avery.com/templates/category/business-cards?filters=itemsPerSheet_10" target="_blank">Avery Templates that provide 10 Biz-Cards to a sheet</a> will work well. They’re all card-stock but have different template numbers depending on whether you’re choosing gloss/matte, laser/ink-jet, etc… Keep in mind that individual printers can be tricky/wonky and you might not get a perfect print every time. It’s very hard to get the coding to line up perfectly with every printer on the market and printing software/settings can vary drastically by printer, so don’t expect perfection when printing on your own. You can get them “good enough”, but if you want a better quality CashStamp…print to .pdf, save it to a USB, and take it to your local print shop for a much higher quality CashStamp.</p>

            <p>For sticker-type labels in the United States, we find the 2.5" x 2.5” <a href="https://www.avery.com/blank/labels/94104" target="_blank">Avery 94104</a> single QR-Code sticker labels to be a good size that work well for multiple purposes. These are single QR-Code CashStamps that work well for people that already have a wallet installed and know to scan a QR with their respective in-wallet scanning option to simply ‘sweep/redeem’ the loaded BCH funds. There is an <a href="https://www.avery.com/blank/labels/94104" target="_blank">Avery 94104</a> template already loaded in the CashStamp creation tool, you just have to buy the labels, of course. We’ve found that these type of CashStamps DO NOT work well for noobs/normies that are not privy to Crypto/BCH as they don’t have a clue how these things work and don’t even have a BCH wallet installed yet…hence the “Step-1 Wallet Install” on the 2QR Code CashStamp Biz-Cards…they’re a much better noob/normie first-time experience to BCH onboarding.</p>

            <p>It's always a good idea to print to a .pdf file first, then print to a regular-paper/test-page to make sure all looks well, then print to the actual label. Sticker labels aren't exactly cheap, so save yourself the $ and frustration by test printing first. We plan on adding more label templates for different CashStamp sizes in the future. If you have a specific/custom label or template you'd like to use, feel free to get in touch via our <a href="https://t.me/cashstamps" target="_blank">Telegram</a> (@cashstamps) and we'll consider adding it to the pre-loaded template list. We like, and have recently, added the <a href="https://minisatoshi.cash/" target="_blank">MiniSatoshi</a> Tri-Fold CashStamps to the tool. These are great to simply print to normal/standard paper, cut and fold accordingly. These are actually the cheapest/easiest way to disseminate CashStamps, so feel free to use them as you see fit. Coding the formatting/parameters for these various labels/templates to integrate with the CashStamps creation tool and print properly is a pretty big PITA, unfortunately.</p>
          </section>

          <section class="faq-section">
            <h2>What are STAMP tokens?</h2>

            <p>STAMP is a BCH ‘<a href="https://bitcoincashpodcast.com/faqs/Tech/what-is-cashtokens" target="_blank">CashToken</a>omics’ attempt to offset the cost of future CashStamp campaign endeavors (printing/funding of CashStamps) for onboarding and promoting BCH adoption around the globe.</p>

            <p>STAMP was created on <a href="https://bchpump.cash/pump/about" target="_blank">BCHPump</a> with a 1,000,000,000 (1BB) total supply. We immediately purchased 66% of the supply and the broader BCH community purchased the other 14%, completing the <a href="https://bchpump.cash/pump/about" target="_blank">BCHPump</a> ‘Bonding Curve’ process in less than three hours after launch.</p>

            <p>In an effort to keep STAMP a [majority] BCH community project like CashStamps, 33% [of our 66% purchased supply of STAMP] was air-dropped to all 2024 (ABLA Upgrade) and 2025 (VELMA Upgrade) <a href="https://bliss.cash" target="_blank">BCH Bliss</a> conference/NFT ticket holders at the 2025 <a href="https://bliss.cash" target="_blank">BCH Bliss</a> conference in Ljubljana, Slovenia on May 15th, 2025. This consisted of over 120 individual air-drops at once, shortly after STAMP Bonded out of <a href="https://bchpump.cash/pump/about" target="_blank">BCHPump</a> and auto-migrated to BCH’s premier, decentralized exchange, <a href="https://app.cauldron.quest/" target="_blank">Cauldron</a>.</p>

            <p>The remaining 30+% supply of STAMP can be swapped-for/purchased on BCH’s DEX, <a href="https://app.cauldron.quest/" target="_blank">Cauldron</a>, where you can also earn yield by creating a liquidity pool with your STAMP, if you so choose.</p>

            <p>We will be conducting a routine ‘token-burn’ of STAMP that coincides with the scheduled <a href="https://x.com/TheBCHPodcast/status/1929086967163032012" target="_blank">BCH Bank-Runs</a> on the 1st and 15th of every month for the foreseeable future. 1,000,000 (1MM) STAMP will be burned on these dates, monthly, using the <a href="https://www.tokenburner.cash/" target="_blank">CashToken Burner Contract</a>.</p>

            <p>It is important to note that STAMP is <strong>NOT</strong> the main focus of the CashStamps project! STAMP is merely a fun memecoin (AKA ‘shitcoin’) that we hope will help with print-costs and BCH funding of CashStamps as-needed. We make absolutely zero guarantees of the STAMP price/performance or how the market will use or react to STAMP, we just know how we plan to utilize it and hope that the free-market will reward us with offsetting some of the expenses of printing/funding CashStamps. In short…we may sell some of our STAMP supply for BCH on an as-needed basis to supplement printing/funding of future CashStamp campaigns.</p>

            <p>The STAMP Token ID: 963dbc7d3e3b0e9aab4b34c4fc84f5d03a899b6a53ca831bb26665cc992bab0f</p>
          </section>
        </div>
      </template>

      <!-- Spanish FAQ -->
      <!-- NOTE: Copy and paste the section you modify into ChatGPT or something to have it translate to Spanish and then copy over the relevant section below. -->
      <template v-else>
        <h1 class="text-center strong">Preguntas Frecuentes</h1>
        <div>
          <section class="faq-section">
            <h2>¿Qué son los CashStamps?</h2>
            <p>Los CashStamps son 'billeteras de papel' de BitcoinCash fácilmente canjeables/reclamables, imprimibles/físicas en forma de código QR que pueden ser utilizadas para regalos, propinas, promociones y adopción/incorporación de BCH con la opción de reclamar cualquier CashStamp no canjeado para que no haya temor de desperdiciar tu BitcoinCash.</p>
          </section>

          <section class="faq-section">
            <h2>¿Por qué CashStamps?</h2>
            <p>Vimos la necesidad de una forma rápida/fácil de incorporar nuevos individuos y comerciantes a BitcoinCash simplemente entregándoles una 'billetera de papel' impresa con código QR con instrucciones simples para que puedan canjear fácilmente BCH en una billetera no custodial sin tener que explicarles verbalmente todo el proceso de principio a fin. Si alguien puede leer, puedes entregarle un CashStamp sin decir nada y ellos pueden hacer el resto... esperemos.</p>
          </section>

          <section class="faq-section">
            <h2>¿Qué puedo hacer con los CashStamps?</h2>

            <p>¡Lo que quieras! Todo el propósito de los CashStamps es promover el uso, incorporación y mayor adopción de BitcoinCash, así que siéntete libre de ser creativo con cómo, dónde y por qué usas los CashStamps.</p>

            <p>Imprime tan pocos o tantos CashStamps como quieras y financia con tan poco o tanto BCH como desees. Imprímelos a un archivo .pdf/.png/.jpeg y envíalos por correo electrónico a amigos, colegas, clientes. Imprímelos en papel, tarjetas de agradecimiento o tarjetas de presentación y regálalos como propina cuando salgas a comer o te cortes el cabello.</p>

            <p>Imprímelos en calcomanías y pon esas calcomanías de CashStamp en cualquier cosa, incluyendo la parte trasera de otras calcomanías para regalos o promociones. Déjalos en cualquier lugar/en todas partes, ya que no hay riesgo de perder el BCH si no se canjean y simplemente puedes reclamar los CashStamps no canjeados de vuelta a una billetera BCH de tu elección.</p>

            <p>Crea una rifa de BCH o úsalos como premios; donde un conjunto de sellos tiene cantidades determinadas y otros tienen cantidades diferentes (más altas). Reparte los CashStamps y deja que los usuarios finales escaneen sus códigos QR para ver quién 'ganó' más BCH. Sé creativo... promueve la adopción... ¡usa BCH!</p>

            <p>Aunque no lo recomendamos; hemos visto incluso algunas comunidades - donde el acceso a internet es irregular/poco confiable - usar CashStamps como un Medio de Intercambio físico cuando es necesario. Este tipo de transacción implica confiar en la persona que te da el CashStamp - si su saldo no puede ser verificado inmediatamente a través de un escaneo del código QR del CashStamp - así que ten cuidado si utilizas los CashStamps de esta manera.</p>
          </section>

          <section class="faq-section">
            <h2>¿Hay riesgos asociados con los CashStamps?</h2>

            <p>¡Sí... el fin de la moneda fiduciaria al promover la adopción de BitcoinCash y su ascenso a Moneda de Reserva Global!</p>

            <p>No hay riesgos hackeables/estafables asociados con los CashStamps. Tú controlas los CashStamps que creas. Una vez que 'Financias' los CashStamps que has creado/impreso, se te dará la 'Frase Semilla' Mnemónica para la Billetera Electron Cash donde se encuentran esos fondos BCH. Solo tú conoces esa "Frase Semilla", así que protégela igual que protegerías cualquier otra 'Frase Semilla' de billetera.</p>

            <p>El único riesgo real asociado con los CashStamps es; <strong>si fallas en registrar/guardar/anotar la 'Frase Semilla' de tus CashStamps financiados Y borras la caché de tu navegador, NO podrás reclamar fácilmente ningún CashStamp no usado/no canjeado.</strong> Si no has borrado la caché de tu navegador, puedes encontrar la Frase Semilla de tus CashStamps financiados en la herramienta de creación... solo elige la colección de CashStamp que creaste y luego haz clic en 'Ver Mnemónico' desde el menú de tres puntos a la derecha para revelar la 'Frase Semilla' específica para esa colección/tirada de impresión específica de CashStamps.</p>

            <div class="flex row justify-center q-py-md">
              <img src="/img/faq-mnemonic-button.png" style="max-width: 100%" />
            </div>

            <p>Si has borrado la caché de tu navegador y ya no puedes 'Ver Mnemónico' para una colección de CashStamp que creaste previamente en la herramienta, pero SÍ anotaste tu Frase Semilla en otro lugar, simplemente haz clic en el botón + a la izquierda del menú desplegable de la colección de CashStamp y haz clic en 'Importar Mnemónico' y continúa con el proceso del botón 'Reclamar Sellos'.</p>

            <p>Si has borrado la caché de tu navegador Y no anotaste tu 'Frase Semilla' para los CashStamps que creaste/imprimiste y financiaste... ¡qué pena! No hay forma de recuperar esos fondos rápidamente - con una función simple/única de 'Reclamación' de barrido en la herramienta - pero puedes escanear cada código QR de CashStamp(s) creado que todavía tengas en tu posesión, individualmente (uno por uno), si aún no has regalado esos CashStamps. Esto es bastante simple (aunque consume tiempo). Si has regalado alguno de esos CashStamps impresos/financiados, lo mejor que puedes esperar es que el(los) usuario(s) final(es) canjeen su CashStamp, para que tu BCH no se desperdicie completamente (bloqueado en una billetera de papel huérfana).</p>
          </section>

          <section class="faq-section">
            <h2>¿Qué Billeteras Funcionan con CashStamps?</h2>

            <p>Debido a la función 'Barrido' (Protocolo BCH-Wif) incorporada en el(los) código(s) QR único(s) generado(s) cuando 'Financias' tu(s) CashStamp(s); los CashStamps no funcionarán con todas las billeteras BCH en el mercado ya que no todas las billeteras BCH soportan esta función 'Barrido' del Protocolo BCH-Wife.</p>

            <p>Para el proceso de 'Canje' del usuario final; la iteración actual de CashStamps funciona con las siguientes Billeteras BCH y solo estas billeteras son seleccionables para la implementación del código QR "Paso 1- Instalación de Billetera" en el lado izquierdo del CashStamp:</p>

            <ul>
              <li><a href="https://selene.cash/" target="_blank">Selene Wallet</a> (iOS y Android)</li>
              <li><a href="https://flowee.org/products/pay/#dl" target="_blank">Flowee Pay Wallet</a> (Solo Android)</li>
              <li><a href="https://www.paytaca.com/applications/wallet" target="_blank">Paytaca Wallet</a> (iOS y Android)</li>
              <li><a href="https://zapit.io/" target="_blank">Zapit Wallet</a> (iOS y Android, Escritorio y Web)</li>
            </ul>

            <p>Para el creador de CashStamp; el proceso de 'Financiamiento' debería funcionar con cualquier billetera que soporte BIP70 o Protocolo de Pago JSON: Selene Wallet, ElectronCash Wallet, Flowee Pay, Paytaca Wallet y Bitcoin.com Wallet todas soportan esta función.</p>

            <p>Cualquiera que tenga acceso a la 'Frase Semilla' mnemónica de cualquier colección específica de CashStamp puede 'Reclamar CashStamps [no canjeados]' a cualquier billetera/dirección BCH de su elección simplemente usando el botón 'Reclamar Sellos' en la herramienta CashStamps e ingresando la dirección de su billetera. Mantén tu 'Frase Semilla' de CashStamps financiados y el acceso al navegador de tu computadora seguros en todo momento.</p>
          </section>

          <section class="faq-section">
            <h2>¿Se puede personalizar o editar el texto en los sellos?</h2>

            <p>Sí, de alguna manera. Haz clic en el botón editar junto a la plantilla [desplegable] de tu elección y siéntete libre de editar el código HTML y 'Guardar' la plantilla allí para imprimir a un archivo .pdf o directamente a tu impresora de elección. Esperamos hacer esto un proceso de 'campo editable' más fácil en el futuro, pero por ahora, el editor HTML funciona para cambios básicos de texto. Presta mucha atención a la advertencia resaltada en rojo en la parte superior del editor HTML antes de proceder. También puedes exportar un archivo .JSON si quieres poder editar personalizadamente en Adobe Illustrator u otros programas de edición. Habrá una ruta para obtener la lista de WIFs, direcciones, etc. a través del archivo JSON.</p>

            <div class="flex row justify-center">
              <img
                src="/img/faq-template-editing.png"
                style="max-width: 100%; width: 30em"
              />
            </div>
          </section>

          <section class="faq-section">
            <h2>¿Tengo que ingresar una fecha de expiración en mis CashStamps?</h2>

            <p>Técnicamente, no, pero necesitarás eliminar la línea "Válido Hasta" en el editor HTML de Plantilla, después de que hayas creado los CashStamps, si no quieres una fecha de expiración o que el texto "Válido Hasta" aparezca en el CashStamp.</p>

            <p>Creemos que es una buena idea incluir una fecha de expiración en cualquier/todos los CashStamps impresos/financiados ya que promueve un sentido de urgencia para que el receptor use/canjee el CashStamp, más temprano que tarde.</p>

            <p>Técnicamente, como emisor/creador del(los) CashStamp(s), puedes reclamar cualquier CashStamp(s) no canjeado(s) en cualquier momento ya que el botón/proceso "Reclamar Sellos" en la herramienta es manual y NO automático. Solo no seas codicioso y reclames tus CashStamp(s) distribuidos antes de sus fechas de expiración listadas ya que eso crearía una mala primera impresión de BitcoinCash para alguien que podría no canjear su CashStamp inmediatamente después de que se lo des. Una vez que la fecha de expiración haya llegado/pasado, siéntete libre de cargar tu colección específica de CashStamps en la herramienta - si ya está en caché allí o simplemente carga la 'Frase Semilla' mnemónica de la colección - y haz clic en el botón "Reclamar Sellos" para la reclamación completa de cualquier CashStamp no usado/no canjeado por su fecha de expiración impresa.</p>
          </section>

          <section class="faq-section">
            <h2>¿Qué Etiquetas recomiendan?</h2>

            <p>Depende de en qué quieras imprimir tus CashStamp(s), realmente. Los tamaños de carta, etiquetas, tarjetas de presentación y plantillas pueden variar por región geográfica.</p>

            <p>Para la incorporación/adopción de principiantes/novatos, encontramos que los CashStamps "Tarjeta de Presentación" de 2 códigos QR funcionan mejor ya que primero le pide al receptor que instale una billetera (Paso 1), luego escanee el segundo QR para canjear el BCH (Paso 2). El novato/receptor puede escanear cualquier QR con la cámara estándar de su teléfono y funcionan bien, pero es importante que tengan una billetera BCH instalada primero (Paso 1). Si quieres una apariencia profesional de mayor calidad, vale la pena el costo extra tenerlas impresas en una imprenta profesional si no tienes acceso a una personalmente. Recomendamos imprimir a un archivo .pdf, luego llevarlo para que sea impreso/cortado al tamaño en tu Kinkos/FedEx local o imprenta de tu elección.</p>

            <p>Si quieres imprimir desde tu casa/oficina usando tu propia impresora, cualquiera de estas <a href="https://www.avery.com/templates/category/business-cards?filters=itemsPerSheet_10" target="_blank">Plantillas Avery que proporcionan 10 Tarjetas de Presentación por hoja</a> funcionarán bien. Todas son cartulina pero tienen diferentes números de plantilla dependiendo de si estás eligiendo brillante/mate, láser/inyección de tinta, etc... Ten en cuenta que las impresoras individuales pueden ser complicadas/problemáticas y podrías no obtener una impresión perfecta cada vez. Es muy difícil hacer que la codificación se alinee perfectamente con cada impresora en el mercado y el software/configuraciones de impresión pueden variar drásticamente por impresora, así que no esperes perfección cuando imprimas por tu cuenta. Puedes hacerlas "suficientemente buenas", pero si quieres un CashStamp de mejor calidad... imprime a .pdf, guárdalo en un USB, y llévalo a tu imprenta local para un CashStamp de mucha mayor calidad.</p>

            <p>Para etiquetas tipo calcomanía en Estados Unidos, encontramos que las etiquetas de calcomanía de código QR único de 2.5" x 2.5" <a href="https://www.avery.com/blank/labels/94104" target="_blank">Avery 94104</a> son de buen tamaño que funcionan bien para múltiples propósitos. Estos son CashStamps de código QR único que funcionan bien para personas que ya tienen una billetera instalada y saben escanear un QR con su respectiva opción de escaneo en billetera para simplemente 'barrer/canjear' los fondos BCH cargados. Ya hay una plantilla <a href="https://www.avery.com/blank/labels/94104" target="_blank">Avery 94104</a> cargada en la herramienta de creación de CashStamp, solo tienes que comprar las etiquetas, por supuesto. Hemos encontrado que este tipo de CashStamps NO funcionan bien para novatos/principiantes que no están familiarizados con Crypto/BCH ya que no tienen idea de cómo funcionan estas cosas y ni siquiera tienen una billetera BCH instalada todavía... de ahí el "Paso-1 Instalación de Billetera" en las Tarjetas de Presentación de CashStamp de 2 códigos QR... son una experiencia mucho mejor para principiantes/novatos en la incorporación de BCH por primera vez.</p>

            <p>Siempre es una buena idea imprimir primero a un archivo .pdf, luego imprimir a una página de papel normal/prueba para asegurarte de que todo se vea bien, luego imprimir a la etiqueta real. Las etiquetas de calcomanía no son exactamente baratas, así que ahórrate el dinero y la frustración probando primero la impresión. Planeamos agregar más plantillas de etiquetas para diferentes tamaños de CashStamp en el futuro. Si tienes una etiqueta específica/personalizada o plantilla que te gustaría usar, siéntete libre de contactarnos a través de nuestro <a href="https://t.me/cashstamps" target="_blank">Telegram</a> (@cashstamps) y consideraremos agregarla a la lista de plantillas pre-cargadas. Nos gusta, y recientemente hemos agregado, los CashStamps Tri-Fold <a href="https://minisatoshi.cash/" target="_blank">MiniSatoshi</a> a la herramienta. Estos son excelentes para simplemente imprimir en papel normal/estándar, cortar y doblar apropiadamente. Estos son realmente la forma más barata/fácil de diseminar CashStamps, así que siéntete libre de usarlos como consideres apropiado. Codificar el formato/parámetros para estas varias etiquetas/plantillas para integrar con la herramienta de creación de CashStamps e imprimir apropiadamente es una gran molestia, desafortunadamente.</p>
          </section>

          <section class="faq-section">
            <h2>¿Qué son los tokens STAMP?</h2>

            <p>STAMP es un intento de '<a href="https://bitcoincashpodcast.com/faqs/Tech/what-is-cashtokens" target="_blank">CashToken</a>omics' de BCH para compensar el costo de futuros esfuerzos de campañas CashStamp (impresión/financiamiento de CashStamps) para incorporación y promoción de adopción de BCH alrededor del mundo.</p>

            <p>STAMP fue creado en <a href="https://bchpump.cash/pump/about" target="_blank">BCHPump</a> con un suministro total de 1,000,000,000 (1BB). Inmediatamente compramos el 66% del suministro y la comunidad BCH más amplia compró el otro 14%, completando el proceso de 'Curva de Vinculación' de <a href="https://bchpump.cash/pump/about" target="_blank">BCHPump</a> en menos de tres horas después del lanzamiento.</p>

            <p>En un esfuerzo por mantener STAMP como un proyecto [mayoritariamente] de la comunidad BCH como CashStamps, el 33% [de nuestro 66% del suministro comprado de STAMP] fue enviado por airdrop a todos los portadores de boletos de conferencia/NFT de <a href="https://bliss.cash" target="_blank">BCH Bliss</a> 2024 (Actualización ABLA) y 2025 (Actualización VELMA) en la conferencia <a href="https://bliss.cash" target="_blank">BCH Bliss</a> 2025 en Ljubljana, Eslovenia el 15 de mayo de 2025. Esto consistió en más de 120 airdrops individuales a la vez, poco después de que STAMP se vinculara fuera de <a href="https://bchpump.cash/pump/about" target="_blank">BCHPump</a> y auto-migrara al intercambio descentralizado premier de BCH, <a href="https://app.cauldron.quest/" target="_blank">Cauldron</a>.</p>

            <p>El suministro restante del 30+% de STAMP puede ser intercambiado/comprado en el DEX de BCH, <a href="https://app.cauldron.quest/" target="_blank">Cauldron</a>, donde también puedes ganar rendimiento creando un pool de liquidez con tu STAMP, si así lo eliges.</p>

            <p>Estaremos conduciendo una 'quema de tokens' rutinaria de STAMP que coincide con las <a href="https://x.com/TheBCHPodcast/status/1929086967163032012" target="_blank">Corridas Bancarias de BCH</a> programadas el 1 y 15 de cada mes en el futuro previsible. 1,000,000 (1MM) STAMP serán quemados en estas fechas, mensualmente, usando el <a href="https://www.tokenburner.cash/" target="_blank">Contrato Quemador de CashToken</a>.</p>

            <p>Es importante notar que STAMP NO es el enfoque principal del proyecto CashStamps! STAMP es meramente una memecoin divertida (AKA 'shitcoin') que esperamos ayudará con los costos de impresión y financiamiento BCH de CashStamps según sea necesario. No hacemos absolutamente ninguna garantía del precio/rendimiento de STAMP o cómo el mercado usará o reaccionará a STAMP, solo sabemos cómo planeamos utilizarlo y esperamos que el mercado libre nos recompense compensando algunos de los gastos de imprimir/financiar CashStamps. En resumen... podríamos vender algo de nuestro suministro de STAMP por BCH según sea necesario para suplementar la impresión/financiamiento de futuras campañas de CashStamp.</p>

            <p>El ID del Token STAMP: 963dbc7d3e3b0e9aab4b34c4fc84f5d03a899b6a53ca831bb26665cc992bab0f</p>
          </section>
        </div>
      </template>
    </div>
  </q-page>
</template>

<style lang="scss" scoped>
h1 {
  font-size: 2.5em;
  color: var(--q-primary);
}

h2 {
  font-size: 2em;
  color: var(--q-primary);
}
.faq-section {
  margin-bottom: 2.5em;
}
</style>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { locale } = useI18n({
  inheritLocale: true,
  useScope: 'local',
});

const language = computed(() => {
  // Get the main locale (e.g. "en" as opposed to "en-GB")
  return locale.value.substring(0, 2);
});
</script>
