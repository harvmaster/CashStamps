export { default as PageTemplate } from './PageTemplate.html?raw';
import A4BasicContent from './Generic/A4-Basic_content.html?raw';
import A4BasicStyle from './Generic/A4-Basic_style.html?raw';
import LetterBasicContent from './Generic/Letter-Basic_content.html?raw';
import LetterBasicStyle from './Generic/Letter-Basic_style.html?raw';
import A4Horizontal3StepContent from './Generic/A4-Horizontal3Step_content.html?raw';
import A4Horizontal3StepStyle from './Generic/A4-Horizontal3Step_style.html?raw';
import Avery94104Content from './AveryLabels/Avery-94104_content.html?raw';
import Avery94104Style from './AveryLabels/Avery-94104_style.html?raw';

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
  '2f739f8e-bd27-4ec8-a89d-9c829c8e0c74': {
    version: 1,
    uuid: '2f739f8e-bd27-4ec8-a89d-9c829c8e0c74',
    label: 'Letter - Basic',
    template: LetterBasicContent,
    style: LetterBasicStyle,
    readonly: true,
  },
  '8187b105-c778-4496-8d8f-080c74445e88': {
    version: 1,
    uuid: '8187b105-c778-4496-8d8f-080c74445e88',
    label: 'A4 - Horizontal - 3 Step',
    template: A4Horizontal3StepContent,
    style: A4Horizontal3StepStyle,
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
};
