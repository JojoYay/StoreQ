"use client";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import Link from "next/link";
import { getStore } from "@/lib/firebase/firestore";
import { buildJoinUrl } from "@/lib/utils/qr";
import type { Store } from "@/lib/types";

export default function QRPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const [store, setStore] = useState<Store | null>(null);
  const joinUrl = buildJoinUrl(storeId);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getStore(storeId).then(setStore);
  }, [storeId]);

  function handlePrint() {
    window.print();
  }

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-8">
        <Link href={`/stores/${storeId}`} className="text-gray-400 hover:text-gray-600 text-sm">
          ← フロア管理
        </Link>
        <h1 className="text-2xl font-bold">QRコード</h1>
      </div>

      <div ref={printRef} className="max-w-sm mx-auto">
        <div className="bg-white rounded-2xl shadow-md p-8 text-center border border-gray-100 print:shadow-none print:border-0">
          <h2 className="text-xl font-bold mb-2">{store?.name}</h2>
          <p className="text-gray-500 text-sm mb-6">
            QRコードを読み取って順番待ち登録
          </p>
          <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-xl">
            <QRCodeSVG
              value={joinUrl}
              size={220}
              level="M"
              includeMargin
            />
          </div>
          <p className="text-xs text-gray-400 mt-6 break-all">{joinUrl}</p>
        </div>
      </div>

      <div className="flex justify-center gap-3 mt-6 print:hidden">
        <button
          onClick={handlePrint}
          className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
        >
          印刷する
        </button>
        <button
          onClick={() => navigator.clipboard.writeText(joinUrl)}
          className="border border-gray-300 text-gray-700 px-6 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-colors"
        >
          URLをコピー
        </button>
      </div>

      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          .print\\:shadow-none, .print\\:shadow-none * { visibility: visible; }
          .print\\:shadow-none { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}
