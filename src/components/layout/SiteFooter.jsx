import { useServices } from '../../hooks/useServices.js';

export default function SiteFooter() {
  const text = useServices().repositories.content.footer();
  return (
    <footer className="site-footer">
      <div className="container"><p>{text}</p></div>
    </footer>
  );
}
