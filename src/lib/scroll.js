// In-page links scroll smoothly to their section instead of jumping.
export function scrollToSection(event) {
  event.preventDefault();
  const target = document.getElementById(event.currentTarget.hash.slice(1));
  target?.scrollIntoView({ behavior: 'smooth' });
}
