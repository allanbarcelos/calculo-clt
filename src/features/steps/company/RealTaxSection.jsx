import { Explainer, SelectField, Toggle } from '../../../components/ui';
import { useFormText } from '../../../hooks/useFormText.js';
import { useServices } from '../../../hooks/useServices.js';
import { PROFIT_BRACKETS } from '../../../services/TaxAdvantageService.js';

const OPTION_KEYS = { surcharge: 'optionSurcharge', basic: 'optionBasic', loss: 'optionLoss' };

// Lucro Real only: what the company needs to tell us to estimate its tax savings.
export default function RealTaxSection({ data, set }) {
  const { taxAdvantages } = useServices();
  const t = useFormText();
  const pisCofins = taxAdvantages.pisCofinsRate();
  return (
    <>
      <SelectField
        {...t.field('realProfitBracket')}
        value={data.realProfitBracket}
        onChange={(v) => set({ realProfitBracket: v })}
        options={PROFIT_BRACKETS.map((b) => ({ value: b, label: t.text('realProfitBracket', OPTION_KEYS[b], { rate: taxAdvantages.incomeTaxRate(b) }) }))}
      />
      <Toggle {...t.field('patRegistered')} checked={data.patRegistered} onChange={(v) => set({ patRegistered: v })} />
      {pisCofins !== null && (
        <Toggle
          {...t.field('cleaningServicesCompany', { rate: pisCofins })}
          checked={data.cleaningServicesCompany}
          onChange={(v) => set({ cleaningServicesCompany: v })}
        />
      )}
      <Explainer id="taxAdvantages" />
    </>
  );
}
