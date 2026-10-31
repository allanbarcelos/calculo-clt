import { ContentCallout } from '../../../components/ui';
import { useFormText } from '../../../hooks/useFormText.js';
import MealSection from './MealSection.jsx';
import OtherBenefitsSection from './OtherBenefitsSection.jsx';
import PlrSection from './PlrSection.jsx';
import TransportSection from './TransportSection.jsx';

export default function BenefitsStep(props) {
  const t = useFormText();
  return (
    <>
      <ContentCallout id="benefitsNoCharges" vars={{ costPerReal: props.result.costPerReal }} />
      <TransportSection {...props} />
      <MealSection {...props} />
      <fieldset className="subsection">
        <legend>{t.section('otherBenefits')}</legend>
        <OtherBenefitsSection {...props} />
        <PlrSection {...props} />
      </fieldset>
    </>
  );
}
