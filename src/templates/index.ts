export { default as PageTemplate } from './PageTemplate.html?raw';

// Built-in Templates.
import BizcardHappyCoins from './BizCard.Happy_Coins.json';
import BizcardMoon from './BizCard.Moon.json';
import BizcardOriginalBlack from './BizCard.Original_Black.json';
import BizcardSeethingDollar from './BizCard.Seething_Dollar.json';
import BizcardCryingFed from './BizCard.Crying_Fed.json';
import BizcardSpace from './BizCard.Space.json';
import TrifoldMinisatoshi from './Trifold.Minisatoshi.json';

import { Template } from 'src/types.js';

const templateList = [BizcardHappyCoins, BizcardMoon, BizcardCryingFed, BizcardSeethingDollar, BizcardSpace, BizcardOriginalBlack, TrifoldMinisatoshi];

export const builtInTemplates: { [uuid: string]: Template } =
  Object.fromEntries(
    templateList.map((template) => [
      template.uuid,
      {
        ...template,
        readonly: true,
      } as Template, // 👈 Force TypeScript to evaluate it as a 'Template' right here
    ])
  );
