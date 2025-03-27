export { default as PageTemplate } from './PageTemplate.html?raw';

// V2 Templates
import BasicSingleQRRFront from './V2/Basic-SingleQR/Front.html?raw';
import BasicSingleQRStyle from './V2/Basic-SingleQR/Style.html?raw';
import BizcardOneQRFront from './V2/Bizcard-OneQR/Front.html?raw';
import BizcardOneQRStyle from './V2/Bizcard-OneQR/Style.html?raw';
import BizcardTwoQRFront from './V2/Bizcard-TwoQR/Front.html?raw';
import BizcardTwoQRStyle from './V2/Bizcard-TwoQR/Style.html?raw';
import TrifoldMiniSatoshiFront from './V2/Trifold-Minisatoshi/Front.html?raw';
import TrifoldMiniSatoshiStyle from './V2/Trifold-Minisatoshi/Style.html?raw';

// V1 Templates
import SeleneGadsdenContent from './Generic/SeleneGadsden_content.html?raw';
import SeleneGadsdenStyle from './Generic/SeleneGadsden_style.html?raw';
import BizcardTwoQRContent from './Generic/Bizcard-TwoQR_content.html?raw';
import BizcardTwoQRStyleLetterLPTN from './Generic/Bizcard-TwoQR_style_letter_lptn.html?raw';
import Avery94104Content from './AveryLabels/Avery-94104_content.html?raw';
import Avery94104PaytacaContent from './AveryLabels/Avery-94104Paytaca_content.html?raw';
import Avery94104Style from './AveryLabels/Avery-94104_style.html?raw';
import BCHFest2024Content from './Special/BCHFest2024_content.html?raw';
import BCHFest2024Style from './Special/BCHFest2024_style.html?raw';
import ChristmasFloweeContent from './Special/ChristmasFlowee_content.html?raw';
import ChristmasFloweeStyle from './Special/ChristmasFlowee_style.html?raw';
import ChristmasPaytacaContent from './Special/ChristmasPaytaca_content.html?raw';
import ChristmasPaytacaStyle from './Special/ChristmasPaytaca_style.html?raw';
import ChristmasSeleneContent from './Special/ChristmasSelene_content.html?raw';
import ChristmasSeleneStyle from './Special/ChristmasSelene_style.html?raw';
import AFOGSeleneContent from './Special/AFOGSelene_content.html?raw';
import AFOGSeleneStyle from './Special/AFOGSelene_style.html?raw';
import ThanksgivingPaytacaContent from './Special/ThanksgivingPaytaca_content.html?raw';
import ThanksgivingPaytacaStyle from './Special/ThanksgivingPaytaca_style.html?raw';
import ThanksgivingFloweeContent from './Special/ThanksgivingFlowee_content.html?raw';
import ThanksgivingFloweeStyle from './Special/ThanksgivingFlowee_style.html?raw';
import HalloweenPaytacaContent from './Special/HalloweenPaytaca_content.html?raw';
import HalloweenPaytacaStyle from './Special/HalloweenPaytaca_style.html?raw';

import { Template } from 'src/types.js';

export const builtInTemplates: { [uuid: string]: Template } = {
  '5e24043e-47aa-4cc1-ab05-7a548a18a8fd': {
    version: 2,
    uuid: '5e24043e-47aa-4cc1-ab05-7a548a18a8fd',
    label: 'Bizcard - Two QR',
    front: BizcardTwoQRFront,
    back: '',
    style: BizcardTwoQRStyle,
    readonly: true,
  },
  'e8df206c-fd3c-4c66-a4f9-d9631f32ed02': {
    version: 2,
    uuid: 'e8df206c-fd3c-4c66-a4f9-d9631f32ed02',
    label: 'Bizcard - One QR',
    front: BizcardOneQRFront,
    back: '',
    style: BizcardOneQRStyle,
    readonly: true,
  },
  'c2c22dd6-760f-47c3-b57d-33bfa6616178': {
    version: 2,
    uuid: 'c2c22dd6-760f-47c3-b57d-33bfa6616178',
    label: 'Basic - Single QR',
    front: BasicSingleQRRFront,
    back: '',
    style: BasicSingleQRStyle,
    readonly: true,
  },
  'ce702692-6070-4b4d-97d8-db4b940ab4de': {
    version: 2,
    uuid: 'ce702692-6070-4b4d-97d8-db4b940ab4de',
    label: 'Trifold - Minisatoshi',
    front: TrifoldMiniSatoshiFront,
    back: '',
    style: TrifoldMiniSatoshiStyle,
    readonly: true,
  },
  'e652a61a-c6f5-45af-8f4e-fab344e823fc': {
    version: 1,
    uuid: 'e652a61a-c6f5-45af-8f4e-fab344e823fc',
    label: 'Bizcard (Selene - Gadsden)',
    front: SeleneGadsdenContent,
    back: '',
    style: SeleneGadsdenStyle,
    readonly: true,
  },
  '2858c961-fff8-4a9f-8ca3-8697a1928af8': {
    version: 1,
    uuid: '2858c961-fff8-4a9f-8ca3-8697a1928af8',
    label: 'Bizcard - Christmas (Flowee)',
    front: ChristmasFloweeContent,
    back: '',
    style: ChristmasFloweeStyle,
    readonly: true,
  },
  '8d16785e-2440-44ad-9a06-7b05117f22d9': {
    version: 1,
    uuid: '8d16785e-2440-44ad-9a06-7b05117f22d9',
    label: 'Bizcard - Christmas (Paytaca)',
    front: ChristmasPaytacaContent,
    back: '',
    style: ChristmasPaytacaStyle,
    readonly: true,
  },
  '8d4eb862-db90-49c3-89f6-8a15e93fcf51': {
    version: 1,
    uuid: '8d4eb862-db90-49c3-89f6-8a15e93fcf51',
    label: 'Bizcard - Christmas (Selene)',
    front: ChristmasSeleneContent,
    back: '',
    style: ChristmasSeleneStyle,
    readonly: true,
  },
  '7a3c5f31-fca6-4734-bb42-53adbe3b81dd': {
    version: 1,
    uuid: '7a3c5f31-fca6-4734-bb42-53adbe3b81dd',
    label: 'Bizcard - A Fifth of Gaming (Selene)',
    front: AFOGSeleneContent,
    back: '',
    style: AFOGSeleneStyle,
    readonly: true,
  },
  '2ac69926-b494-440a-b45d-346dca269183': {
    version: 1,
    uuid: '2ac69926-b494-440a-b45d-346dca269183',
    label: 'Bizcard - Thanksgiving (Flowee)',
    front: ThanksgivingFloweeContent,
    back: '',
    style: ThanksgivingFloweeStyle,
    readonly: true,
  },
  'e99ed564-4106-4f3e-96ef-7f6c58ed9e8c': {
    version: 1,
    uuid: 'e99ed564-4106-4f3e-96ef-7f6c58ed9e8c',
    label: 'Bizcard - Thanksgiving (Paytaca)',
    front: ThanksgivingPaytacaContent,
    back: '',
    style: ThanksgivingPaytacaStyle,
    readonly: true,
  },
  '0a7533d1-6df5-44a9-a000-d5485d75c907': {
    version: 1,
    uuid: '0a7533d1-6df5-44a9-a000-d5485d75c907',
    label: 'Avery 94104 (2.5")',
    front: Avery94104Content,
    back: '',
    style: Avery94104Style,
    readonly: true,
  },
  'f08f503a-a37e-4c5c-99b5-ccb7e21140a3': {
    version: 1,
    uuid: 'f08f503a-a37e-4c5c-99b5-ccb7e21140a3',
    label: 'Avery 94104 (2.5") (Paytaca)',
    front: Avery94104PaytacaContent,
    back: '',
    style: Avery94104Style,
    readonly: true,
  },
  'fb71b38d-cb02-4c52-b761-5732a8d7c53c': {
    version: 1,
    uuid: 'fb71b38d-cb02-4c52-b761-5732a8d7c53c',
    label: 'BCH Fest 2024 (Paytaca)',
    front: BCHFest2024Content,
    back: '',
    style: BCHFest2024Style,
    readonly: true,
  },
  '20604326-745f-4e09-ac05-bce4df85906a': {
    version: 1,
    uuid: '20604326-745f-4e09-ac05-bce4df85906a',
    label: 'Halloween (Paytaca)',
    front: HalloweenPaytacaContent,
    back: '',
    style: HalloweenPaytacaStyle,
    readonly: true,
  },
  'c77c7ea4-974f-4cdc-8771-7b9bfdd8ef09': {
    version: 1,
    uuid: 'c77c7ea4-974f-4cdc-8771-7b9bfdd8ef09',
    label: 'Bizcard (Two QR) (Letter) (LPTN)',
    front: BizcardTwoQRContent,
    back: '',
    style: BizcardTwoQRStyleLetterLPTN,
    readonly: true,
  },
};
