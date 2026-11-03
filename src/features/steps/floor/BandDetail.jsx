import { RichText, SourcesInline } from '../../../components/ui';
import { formatMoney } from '../../../lib/format.js';

export default function BandDetail({ band }) {
  if (!band) return null;
  return (
    <div className="band-detail" aria-live="polite">
      <p><strong>{band.label}</strong> — {formatMoney(band.value)}</p>
      <p><RichText text={band.categories ?? band.note} /></p>
      {band.source && <SourcesInline sources={[{ id: band.source }]} />}
    </div>
  );
}
