import { Fragment } from "react";
import { href, inlineRuns, isUrl, shortUrl, type ResumeDoc } from "@/lib/resume";

/**
 * One resume, laid out like Jake's Resume: centred name, a contact line, small-caps section
 * rules, and two-line entries with dates and places on the right. Plain HTML with real text,
 * so a browser "Save as PDF" stays selectable and readable by applicant-tracking systems.
 * No hooks: the live preview (client) and the print page (server) both render it.
 */
function Inline({ text }: { text: string }) {
  const parts = inlineRuns(text).map((r, i) => {
    // [placeholders] are highlighted on screen and left visible in print, so nothing ships half-done unnoticed.
    const chunks = r.text.split(/(\[[^\]\n]{2,80}\])/).map((c, j) =>
      /^\[.*\]$/.test(c) ? <mark key={j} className="resume-todo">{c}</mark> : <Fragment key={j}>{c}</Fragment>);
    return r.bold ? <strong key={i}>{chunks}</strong> : <Fragment key={i}>{chunks}</Fragment>;
  });
  return <>{parts}</>;
}

function Field({ text }: { text: string }) {
  if (!text) return null;
  return isUrl(text) ? <a href={href(text)}>{shortUrl(text)}</a> : <Inline text={text} />;
}

export function ResumeView({ doc }: { doc: ResumeDoc }) {
  return (
    <article className="resume">
      <header>
        <h1><Inline text={doc.name || "[Your full name]"} /></h1>
        {doc.contact.length > 0 && (
          <p className="resume-contact">
            {doc.contact.map((c, i) => <Fragment key={i}>{i > 0 && <span aria-hidden> | </span>}<Field text={c} /></Fragment>)}
          </p>
        )}
      </header>
      {doc.sections.map((s, si) => (
        <section key={si}>
          <h2>{s.title}</h2>
          {s.blocks.some((b) => b.type === "bullet") && (
            <ul className="resume-loose">
              {s.blocks.filter((b) => b.type === "bullet").map((b, i) => {
                const text = (b as { text: string }).text;
                const kv = text.match(/^([^:]{1,40}):\s*(.+)$/);
                return <li key={i}>{kv ? <><strong>{kv[1]}</strong>: <Inline text={kv[2]} /></> : <Inline text={text} />}</li>;
              })}
            </ul>
          )}
          {s.blocks.map((b, i) => {
            if (b.type === "p") return <p key={i}><Inline text={b.text} /></p>;
            if (b.type !== "entry") return null;
            const [a = "", sub = "", place = "", when = ""] = b.fields;
            return (
              <div key={i} className="resume-entry">
                <div className="resume-row"><strong><Field text={a} /></strong><span><Field text={when} /></span></div>
                {(sub || place) && <div className="resume-row resume-sub"><em><Field text={sub} /></em><em><Field text={place} /></em></div>}
                {b.bullets.length > 0 && <ul>{b.bullets.map((x, j) => <li key={j}><Inline text={x} /></li>)}</ul>}
              </div>
            );
          })}
        </section>
      ))}
    </article>
  );
}
