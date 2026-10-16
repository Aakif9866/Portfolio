/**
 * The site_config keys the public site actually reads. Admin → Settings shows
 * these as editable; any other stored key is listed read-only as unused, and
 * the server refuses to write keys that are not in this list.
 */
export const SITE_KEYS = [
  { key: "about_md", label: "About page text", group: "about", multiline: true, usedOn: "About page", help: "Markdown. Leave empty to show the built-in text." },
  { key: "contact.email", label: "Contact email", group: "contact", multiline: false, usedOn: "Navigation menu, home page, About page, footer", help: "Leave empty to use aakif9866@gmail.com." },
  { key: "social.github", label: "GitHub profile link", group: "social", multiline: false, usedOn: "Navigation, home page, About page, footer", help: "Full URL, e.g. https://github.com/you" },
  { key: "social.linkedin", label: "LinkedIn profile link", group: "social", multiline: false, usedOn: "Navigation menu, home page, About page, footer", help: "Full URL. Leave empty to hide the LinkedIn link." },
] as const;

export const isSiteKey = (k: unknown) => SITE_KEYS.some((s) => s.key === k);
