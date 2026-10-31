import { useMemo } from 'react';
import { Explainer, SelectField } from '../../../components/ui';
import { useFormText } from '../../../hooks/useFormText.js';
import { useServices } from '../../../hooks/useServices.js';
import AgreementDetail from './AgreementDetail.jsx';

// Lets the user pick a registered collective agreement and role; the choice pre-fills the form.
export default function AgreementSection({ data, set }) {
  const { agreements, formDefaults } = useServices();
  const t = useFormText();
  const defaults = useMemo(() => formDefaults.defaults(), [formDefaults]);
  const available = agreements.forState(data.uf);
  const selection = agreements.selection(data);

  // Undo what the previous choice filled in, then apply the new one.
  const choose = (agreementId, roleId) => {
    const revert = agreements.revertPatch(data, defaults);
    set(agreementId ? { ...revert, ...agreements.applyPatch(agreementId, roleId) } : revert);
  };

  if (available.length === 0) return <p className="hint">{t.text('agreement', 'noneForState')}</p>;

  return (
    <>
      <SelectField
        {...t.field('agreement')}
        value={selection ? data.agreementId : ''}
        onChange={(id) => choose(id, '')}
        options={[
          { value: '', label: t.text('agreement', 'emptyOption') },
          ...available.map((a) => ({ value: a.id, label: t.text('agreement', 'option', a) })),
        ]}
      />
      {selection && (
        <>
          <SelectField
            {...t.field('agreementRole')}
            value={selection.role?.id ?? ''}
            onChange={(roleId) => choose(data.agreementId, roleId)}
            options={[
              { value: '', label: t.text('agreementRole', 'emptyOption') },
              ...selection.agreement.roles.map((r) => ({ value: r.id, label: t.text('agreementRole', 'option', r) })),
            ]}
          />
          <AgreementDetail agreement={selection.agreement} />
        </>
      )}
      <Explainer id="collectiveAgreements" />
    </>
  );
}
