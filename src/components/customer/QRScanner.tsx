"use client";
import { useEffect, useRef, useState } from "react";

export function QRScanner() {
  const [error, setError] = useState("");
  const [manualUrl, setManualUrl] = useState("");
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    let scannerInstance: { clear: () => Promise<void> } | null = null;

    async function startScanner() {
      const { Html5QrcodeScanner } = await import("html5-qrcode");
      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );
      scannerInstance = scanner;
      scanner.render(
        (result: string) => {
          try {
            const url = new URL(result);
            if (url.pathname.match(/^\/join\/[^/]+$/)) {
              window.location.href = result;
            } else {
              setError("無効なQRコードです。店舗のQRコードをスキャンしてください。");
            }
          } catch {
            setError("無効なQRコードです。");
          }
        },
        () => {}
      );
    }

    startScanner().catch(() => {
      setError("カメラにアクセスできませんでした。下の入力欄からURLを入力してください。");
    });

    return () => {
      scannerInstance?.clear().catch(() => {});
    };
  }, []);

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const url = new URL(manualUrl);
      if (url.pathname.match(/^\/join\/[^/]+$/)) {
        window.location.href = manualUrl;
      } else {
        setError("正しいQueueMakerのURLを入力してください。");
      }
    } catch {
      setError("有効なURLを入力してください。");
    }
  }

  return (
    <div className="space-y-4">
      <div id="qr-reader" className="rounded-xl overflow-hidden" />

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm">
          {error}
        </div>
      )}

      <div className="border-t pt-4">
        <p className="text-sm text-gray-500 mb-2">またはURLを直接入力:</p>
        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <input
            type="url"
            value={manualUrl}
            onChange={(e) => setManualUrl(e.target.value)}
            placeholder="https://..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
          >
            移動
          </button>
        </form>
      </div>
    </div>
  );
}
