import type { ReactNode } from "react";

export const metadata = {
  title: "Kard",
  description: "Universal loyalty platform",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily:
            "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
          margin: 0,
          background: "#0b0b0d",
          color: "#f4f4f5",
        }}
      >
        {children}
      </body>
    </html>
  );
}
