// Minimal landing page + link to the tester UI.
export default function HomePage() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "48px 20px" }}>
      <h1 style={{ fontSize: 36, margin: 0 }}>KARD</h1>
      <p style={{ opacity: 0.7 }}>Universal loyalty backend — MVP.</p>
      <ul style={{ lineHeight: 1.8 }}>
        <li>
          <a href="/tester" style={{ color: "#7dd3fc" }}>
            /tester
          </a>{" "}
          — minimal browser flow for scan → earn → redeem
        </li>
        <li>
          <code>/api/*</code> — see README for the full route map
        </li>
      </ul>
    </main>
  );
}
