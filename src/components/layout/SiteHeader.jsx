function scrollToSection(event) {
  event.preventDefault()
  const target = document.getElementById(event.currentTarget.hash.slice(1))
  target?.scrollIntoView({ behavior: 'smooth' })
}

export default function SiteHeader({ siteName }) {
  return (
    <>
      <a className="skip-link" href="#calculadora" onClick={scrollToSection}>Pular para a calculadora</a>
      <header className="site-header">
        <div className="container site-header__inner">
          <a className="brand" href="#topo" onClick={scrollToSection} aria-label={`${siteName}, início`}>
            <svg viewBox="0 0 32 32" width="32" height="32" aria-hidden="true">
              <rect width="32" height="32" rx="8" fill="currentColor" />
              <path d="M21.5 11.2A7 7 0 1 0 21.5 20.8" fill="none" stroke="var(--bg)" strokeWidth="3" strokeLinecap="round" />
            </svg>
            <span>{siteName}</span>
          </a>
          <nav aria-label="Seções da página">
            <ul>
              <li><a href="#calculadora" onClick={scrollToSection}>Calculadora</a></li>
              <li><a href="#como-calculamos" onClick={scrollToSection}>Como calculamos</a></li>
              <li><a href="#fontes" onClick={scrollToSection}>Fontes</a></li>
            </ul>
          </nav>
        </div>
      </header>
    </>
  );
}
