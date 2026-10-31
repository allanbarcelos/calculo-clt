import Hero from './components/layout/Hero.jsx';
import MethodSection from './components/layout/MethodSection.jsx';
import SiteFooter from './components/layout/SiteFooter.jsx';
import SiteHeader from './components/layout/SiteHeader.jsx';
import SourcesSection from './components/layout/SourcesSection.jsx';
import Wizard from './features/wizard/Wizard.jsx';
import { useServices } from './hooks/useServices.js';

export default function App() {
  const { meta } = useServices();
  return (
    <>
      <SiteHeader siteName={meta.siteName} />
      <main id="topo">
        <Hero />
        <Wizard />
        <MethodSection />
        <SourcesSection />
      </main>
      <SiteFooter />
    </>
  );
}
