import { useFormText } from '../../../hooks/useFormText.js';
import { formatMoney } from '../../../lib/format.js';

const ORIGIN_KEY = { agreementRole: 'originAgreementRole', agreement: 'originAgreement', band: 'originBand', national: 'originNational' };

export default function FloorSummary({ floor, salaryAdjusted }) {
  const t = useFormText();
  return (
    <div className="floor-summary" role="status">
      <span>{t.text('floorSummary', 'title')}</span>
      <strong>{formatMoney(floor.value)}</strong>
      {salaryAdjusted && <span className="hint">{t.text('floorSummary', 'adjusted')}</span>}
      <span className="hint">{t.text('floorSummary', ORIGIN_KEY[floor.origin], { band: floor.band?.label, agreement: floor.agreement?.name, role: floor.role?.label })}</span>
    </div>
  );
}
