"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ja">
      <body style={{ fontFamily: "sans-serif", padding: "2rem", backgroundColor: "#fef2f2" }}>
        <h1 style={{ color: "#dc2626" }}>アプリの起動に失敗しました</h1>
        <pre style={{ background: "#fff", padding: "1rem", borderRadius: "8px", overflow: "auto", fontSize: "12px" }}>
          {error?.message}
          {"\n"}
          {error?.stack}
        </pre>
        <button
          onClick={reset}
          style={{ marginTop: "1rem", padding: "0.5rem 1rem", background: "#4f46e5", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer" }}
        >
          再試行
        </button>
      </body>
    </html>
  );
}
