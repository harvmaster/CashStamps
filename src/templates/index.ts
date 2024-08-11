export { default as PrintTemplate } from './_PrintTemplate.html?raw';
import Horizontal3StepTemplate from './Generic/Horizontal3Step_content.html?raw';
import Horizontal3StepStyle from './Generic/Horizontal3Step_style.html?raw';
import Avery94104Content from './AveryLabels/Avery-94104_content.html?raw';
import Avery94104Style from './AveryLabels/Avery-94104_style.html?raw';

import { Template } from 'src/types.js';

export const builtInTemplates: { [uuid: string]: Template } = {
  '8187b105-c778-4496-8d8f-080c74445e88': {
    version: 1,
    uuid: '8187b105-c778-4496-8d8f-080c74445e88',
    label: 'Horizontal - 3 Step',
    template: Horizontal3StepTemplate,
    style: Horizontal3StepStyle,
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
