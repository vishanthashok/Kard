// Customer QR landing page.
//
// The QR encodes `${NEXT_PUBLIC_APP_URL}/c/{token}`. When a merchant staff
// device is signed in and scans the code, this page shows the customer
// context. For the MVP we render a lightweight page — the real work happens
// via the /api/merchant/customers/[token] endpoint from the tester.

interface Props {
  params: Promise<{ token: string }>;
}

export default async function CustomerScanPage({ params }: Props) {
  const { token } = await params;
  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "48px 20px" }}>
      <h1>Kard — customer scan</h1>
      <p style={{ opacity: 0.7 }}>
        Merchant staff should paste the token below into the tester or POS.
      </p>
      <pre
        style={{
          background: "#18181b",
          padding: 16,
          borderRadius: 8,
          overflowX: "auto",
        }}
      >
        {token}
      </pre>
      <p>
        <a href="/tester" style={{ color: "#7dd3fc" }}>
          Open tester
        </a>
      </p>
    </main>
  );
}
