import Horizontal3StepTemplate from 'src/templates/Horizontal3Step.html?raw';
import Vertical3StepTemplate from 'src/templates/Vertical3Step.html?raw';
import RectangleSingeStep from 'src/templates/RectangleSingleStep.html?raw';
import StaticSingleStep from 'src/templates/StaticSingleStep.html?raw';
import TwoHalfInchSquare from 'src/templates/AveryLabels/2_5_Square.html?raw';

// Built-in Templates.
export const predefinedTemplates = [
  {
    label: 'Avery: 2.5 Inch Square',
    value: 'TwoHalfInchSquare',
    html: TwoHalfInchSquare,
  },
  {
    label: 'Flex Stamps',
    value: 'RectangleSingeStep',
    html: RectangleSingeStep,
  },
  { label: 'Static Stamps', value: 'StaticSingleStep', html: StaticSingleStep },
  {
    label: 'Horizontal - 3 Step',
    value: 'Horizontal3StepTemplate',
    html: Horizontal3StepTemplate,
  },
  {
    label: 'Vertical - 3 Step',
    value: 'Vertical3StepTemplate',
    html: Vertical3StepTemplate,
  },
];
