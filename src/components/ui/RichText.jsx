import { fillTemplate } from '../../lib/template.js';
import SourceLink from './SourceLink.jsx';

// Minimal markup used in content.json:
//   **bold**   [label](source:id)   {{var}} / {{var|money}}
const TOKEN = /(\*\*[^*]+\*\*|\[[^\]]+\]\(source:[\w-]+\))/g;
const LINK = /^\[([^\]]+)\]\(source:([\w-]+)\)$/;

export default function RichText({ text, vars }) {
  const filled = fillTemplate(text, vars);
  return filled.split(TOKEN).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>;
    const link = part.match(LINK);
    if (link) return <SourceLink key={i} id={link[2]}>{link[1]}</SourceLink>;
    return part;
  });
}
