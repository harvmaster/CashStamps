export { default as PageTemplate } from './PageTemplate.html?raw';
import A4BasicContent from './Generic/A4-Basic_content.html?raw';
import A4BasicPaytacaContent from './Generic/A4-BasicPaytaca_content.html?raw';
import A4BasicStyle from './Generic/A4-Basic_style.html?raw';
import FloweeContent from './Generic/Flowee_content.html?raw';
import FloweeStyle from './Generic/Flowee_style.html?raw';
import PaytacaContent from './Generic/Paytaca_content.html?raw';
import PaytacaStyle from './Generic/Paytaca_style.html?raw';
import SeleneContent from './Generic/Selene_content.html?raw';
import SeleneStyle from './Generic/Selene_style.html?raw';
import LetterBasicContent from './Generic/Letter-Basic_content.html?raw';
import LetterBasicPaytacaContent from './Generic/Letter-BasicPaytaca_content.html?raw';
import LetterBasicStyle from './Generic/Letter-Basic_style.html?raw';
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
import ThanksgivingPaytacaContent from './Special/ThanksgivingPaytaca_content.html?raw';
import ThanksgivingPaytacaStyle from './Special/ThanksgivingPaytaca_style.html?raw';
import ThanksgivingFloweeContent from './Special/ThanksgivingFlowee_content.html?raw';
import ThanksgivingFloweeStyle from './Special/ThanksgivingFlowee_style.html?raw';
import HalloweenPaytacaContent from './Special/HalloweenPaytaca_content.html?raw';
import HalloweenPaytacaStyle from './Special/HalloweenPaytaca_style.html?raw';

import { Template } from 'src/types.js';

export const builtInTemplates: { [uuid: string]: Template } = {
  '6259722c-452c-441a-be48-d8c7c282f9a2': {
    version: 1,
    uuid: '6259722c-452c-441a-be48-d8c7c282f9a2',
    label: 'A4 - Basic',
    template: A4BasicContent,
    style: A4BasicStyle,
    readonly: true,
  },
  'a8702429-f56a-46fb-bf50-2f5dc05b7c79': {
    version: 1,
    uuid: 'a8702429-f56a-46fb-bf50-2f5dc05b7c79',
    label: 'Bizcard (Flowee)',
    template: FloweeContent,
    style: FloweeStyle,
    readonly: true,
  },
  '68236ba6-a092-4927-90b1-409851ce5973': {
    version: 1,
    uuid: '68236ba6-a092-4927-90b1-409851ce5973',
    label: 'Bizcard (Paytaca)',
    template: PaytacaContent,
    style: PaytacaStyle,
    readonly: true,
  },
  '92d3fa79-bbbb-42ed-8d7e-6ad588584371': {
    version: 1,
    uuid: '92d3fa79-bbbb-42ed-8d7e-6ad588584371',
    label: 'Bizcard (Selene)',
    template: SeleneContent,
    style: SeleneStyle,
    readonly: true,
  },
  '2858c961-fff8-4a9f-8ca3-8697a1928af8': {
    version: 1,
    uuid: '2858c961-fff8-4a9f-8ca3-8697a1928af8',
    label: 'Bizcard - Christmas (Flowee)',
    template: ChristmasFloweeContent,
    style: ChristmasFloweeStyle,
    readonly: true,
  },
  '8d16785e-2440-44ad-9a06-7b05117f22d9': {
    version: 1,
    uuid: '8d16785e-2440-44ad-9a06-7b05117f22d9',
    label: 'Bizcard - Christmas (Paytaca)',
    template: ChristmasPaytacaContent,
    style: ChristmasPaytacaStyle,
    readonly: true,
  },
  '8d4eb862-db90-49c3-89f6-8a15e93fcf51': {
    version: 1,
    uuid: '8d4eb862-db90-49c3-89f6-8a15e93fcf51',
    label: 'Bizcard - Christmas (Selene)',
    template: ChristmasSeleneContent,
    style: ChristmasSeleneStyle,
    readonly: true,
  },
  '2ac69926-b494-440a-b45d-346dca269183': {
    version: 1,
    uuid: '2ac69926-b494-440a-b45d-346dca269183',
    label: 'Bizcard - Thanksgiving (Flowee)',
    template: ThanksgivingFloweeContent,
    style: ThanksgivingFloweeStyle,
    readonly: true,
  },
  'e99ed564-4106-4f3e-96ef-7f6c58ed9e8c': {
    version: 1,
    uuid: 'e99ed564-4106-4f3e-96ef-7f6c58ed9e8c',
    label: 'Bizcard - Thanksgiving (Paytaca)',
    template: ThanksgivingPaytacaContent,
    style: ThanksgivingPaytacaStyle,
    readonly: true,
  },
  '1962b0dd-9857-464c-a435-8262d0cfe91a': {
    version: 1,
    uuid: '1962b0dd-9857-464c-a435-8262d0cfe91a',
    label: 'A4 - Basic (Paytaca)',
    template: A4BasicPaytacaContent,
    style: A4BasicStyle,
    readonly: true,
  },
  '2f739f8e-bd27-4ec8-a89d-9c829c8e0c74': {
    version: 1,
    uuid: '2f739f8e-bd27-4ec8-a89d-9c829c8e0c74',
    label: 'Letter - Basic',
    template: LetterBasicContent,
    style: LetterBasicStyle,
    readonly: true,
  },
  'c20672ba-22cc-4c3a-9bf1-526e71f51990': {
    version: 1,
    uuid: 'c20672ba-22cc-4c3a-9bf1-526e71f51990',
    label: 'Letter - Basic (Paytaca)',
    template: LetterBasicPaytacaContent,
    style: LetterBasicStyle,
    readonly: true,
  },
  '0a7533d1-6df5-44a9-a000-d5485d75c907': {
    version: 1,
    uuid: '0a7533d1-6df5-44a9-a000-d5485d75c907',
    label: 'Avery 94104 (2.5")',
    template: Avery94104Content,
    style: Avery94104Style,
    readonly: true,
  },
  'f08f503a-a37e-4c5c-99b5-ccb7e21140a3': {
    version: 1,
    uuid: 'f08f503a-a37e-4c5c-99b5-ccb7e21140a3',
    label: 'Avery 94104 (2.5") (Paytaca)',
    template: Avery94104PaytacaContent,
    style: Avery94104Style,
    readonly: true,
  },
  'fb71b38d-cb02-4c52-b761-5732a8d7c53c': {
    version: 1,
    uuid: 'fb71b38d-cb02-4c52-b761-5732a8d7c53c',
    label: 'BCH Fest 2024 (Paytaca)',
    template: BCHFest2024Content,
    style: BCHFest2024Style,
    readonly: true,
  },
  '20604326-745f-4e09-ac05-bce4df85906a': {
    version: 1,
    uuid: '20604326-745f-4e09-ac05-bce4df85906a',
    label: 'Halloween (Paytaca)',
    template: HalloweenPaytacaContent,
    style: HalloweenPaytacaStyle,
    readonly: true,
  },
};
