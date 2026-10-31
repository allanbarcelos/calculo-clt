import { useServices } from '../../hooks/useServices.js';
import { fillTemplate, meetsRequirements } from '../../lib/template.js';
import DataTable from './DataTable.jsx';
import RichText from './RichText.jsx';
import SourcesInline from './SourcesInline.jsx';

function Item({ item, vars }) {
  return (
    <>
      {item.title && <strong>{fillTemplate(item.title, vars)}</strong>}
      {item.title && item.text && ' '}
      {item.text && <RichText text={item.text} vars={vars} />}
      {item.items && (
        <ul>
          {item.items.map((sub, i) => <li key={i}><RichText text={sub.text} vars={vars} /></li>)}
        </ul>
      )}
    </>
  );
}

// Collapsible "how does this rule work" block, entirely defined in content.json.
export default function Explainer({ id, vars }) {
  const explainer = useServices().repositories.content.explainer(id);
  if (!explainer) return null;
  const items = explainer.items.filter((item) => meetsRequirements(item, vars));

  return (
    <details className="explainer">
      <summary>{fillTemplate(explainer.title, vars)}</summary>
      {explainer.kind === 'terms' ? (
        <dl className="explainer__terms">
          {items.map((item, i) => (
            <div key={i}>
              <dt>{fillTemplate(item.title, vars)}</dt>
              <dd><RichText text={item.text} vars={vars} /></dd>
            </div>
          ))}
        </dl>
      ) : (
        <ol className="explainer__steps">
          {items.map((item, i) => <li key={i}><Item item={item} vars={vars} /></li>)}
        </ol>
      )}
      {explainer.table && <DataTable {...explainer.table} />}
      {explainer.footnote && <p className="hint"><RichText text={explainer.footnote} vars={vars} /></p>}
      <SourcesInline sources={explainer.sources} />
    </details>
  );
}
