"use client";
import dynamic from "next/dynamic";
import Link from "next/link";

const QRScanner = dynamic(
  () => import("@/components/customer/QRScanner").then((m) => m.QRScanner),
  { ssr: false }
);

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-600">QueueMaker</h1>
          <p className="text-gray-500 text-sm mt-2">
            店舗のQRコードをスキャンして順番待ちに登録
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6">
          <QRScanner />
        </div>

        <div className="text-center mt-6">
          <Link href="/login" className="text-sm text-gray-400 hover:text-indigo-600 hover:underline">
            店舗管理者の方はこちら
          </Link>
        </div>
      </div>
    </div>
  );
}
