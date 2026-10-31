import { useServices } from '../../hooks/useServices.js';
import { fillTemplate } from '../../lib/template.js';
import Callout from './Callout.jsx';
import RichText from './RichText.jsx';

// Callout whose text lives in content.json.
export default function ContentCallout({ id, vars }) {
  const callout = useServices().repositories.content.callout(id);
  if (!callout) return null;
  return (
    <Callout tone={callout.tone} title={callout.title && fillTemplate(callout.title, vars)}>
      {callout.text && <p><RichText text={callout.text} vars={vars} /></p>}
      {callout.items && (
        <ul>
          {callout.items.map((item, i) => <li key={i}><RichText text={item.text} vars={vars} /></li>)}
        </ul>
      )}
    </Callout>
  );
}
