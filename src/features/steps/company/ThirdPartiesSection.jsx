import { Explainer, NumberField, SelectField } from '../../../components/ui';
import { useFormText } from '../../../hooks/useFormText.js';
import { useServices } from '../../../hooks/useServices.js';

const CUSTOM = 'custom';

// Third-party contributions follow the FPAS code; picking one fills the rate.
export default function ThirdPartiesSection({ data, set }) {
  const { repositories } = useServices();
  const t = useFormText();
  const rules = repositories.regimes.thirdParties();
  const table = repositories.regimes.fpas();
  // A rate saved before FPAS existed (or typed by hand) shows as "other code".
  const selected = table.codes.find((c) => c.code === data.fpas && c.total === data.thirdParties) ?? null;
  const parts = selected
    ? Object.entries(selected.breakdown).map(([k, v]) => `${table.entities[k] ?? k} ${String(v).replace('.', ',')}%`).join(', ')
    : '';

  return (
    <>
      <SelectField
        {...t.field('fpas')}
        value={selected ? selected.code : CUSTOM}
        onChange={(code) => {
          const fpas = table.codes.find((c) => c.code === code);
          set(fpas ? { fpas: code, thirdParties: fpas.total } : { fpas: CUSTOM });
        }}
        options={[
          ...table.codes.map((c) => ({ value: c.code, label: `${c.label} (${String(c.total).replace('.', ',')}%)` })),
          { value: CUSTOM, label: t.text('fpas', 'custom') },
        ]}
      />
      {selected
        ? <p className="hint">{t.text('fpas', 'breakdown', { total: selected.total, parts })}</p>
        : <NumberField {...t.field('thirdParties')} value={data.thirdParties} max={rules.max} onChange={(v) => set({ thirdParties: v })} />}
      <Explainer id="thirdParties" />
    </>
  );
}
