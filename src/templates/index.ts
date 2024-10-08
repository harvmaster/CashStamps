export { default as PageTemplate } from './PageTemplate.html?raw';
import A4BasicContent from './Generic/A4-Basic_content.html?raw';
import A4BasicPaytacaContent from './Generic/A4-BasicPaytaca_content.html?raw';
import A4BasicStyle from './Generic/A4-Basic_style.html?raw';
import LetterBasicContent from './Generic/Letter-Basic_content.html?raw';
import LetterBasicPaytacaContent from './Generic/Letter-BasicPaytaca_content.html?raw';
import LetterBasicStyle from './Generic/Letter-Basic_style.html?raw';
import A4Horizontal3StepContent from './Generic/A4-Horizontal3Step_content.html?raw';
import A4Horizontal3StepStyle from './Generic/A4-Horizontal3Step_style.html?raw';
import Avery94104Content from './AveryLabels/Avery-94104_content.html?raw';
import Avery94104PaytacaContent from './AveryLabels/Avery-94104Paytaca_content.html?raw';
import Avery94104Style from './AveryLabels/Avery-94104_style.html?raw';
import ArgentinaConferenceContent from './Special/ArgentinaConference_content.html?raw';
import ArgentinaConferenceStyle from './Special/ArgentinaConference_style.html?raw';

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
  '4c1724f3-c9b6-41b6-b8c9-38de7b4ba99a': {
    version: 1,
    uuid: '4c1724f3-c9b6-41b6-b8c9-38de7b4ba99a',
    label: 'Argentina Conference',
    template: ArgentinaConferenceContent,
    style: ArgentinaConferenceStyle,
    readonly: true,
  },
  // NOTE: Disabling for now as this won't be needed in newer flows.
  /*
  '8187b105-c778-4496-8d8f-080c74445e88': {
    version: 1,
    uuid: '8187b105-c778-4496-8d8f-080c74445e88',
    label: 'A4 - Horizontal - 3 Step',
    template: A4Horizontal3StepContent,
    style: A4Horizontal3StepStyle,
    readonly: true,
  },
  */
};
