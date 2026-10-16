"use client";

/**
 * Last resort when the root layout itself fails (its search index or contact
 * query). It replaces <html>, so styles are inline.
 */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: "100vh", display: "grid", placeItems: "center", background: "#000", color: "#f2f2f5", fontFamily: "system-ui, sans-serif", textAlign: "center", padding: 24 }}>
        <div role="alert">
          <h1 style={{ fontSize: 28, fontWeight: 600, margin: 0 }}>The site couldn&apos;t load</h1>
          <p style={{ color: "#9494a1", marginTop: 12 }}>The database didn&apos;t respond in time. Please try again in a moment.</p>
          <button onClick={reset} style={{ marginTop: 20, padding: "10px 20px", borderRadius: 999, border: 0, background: "#f2f2f5", color: "#000", fontSize: 14, cursor: "pointer" }}>
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
