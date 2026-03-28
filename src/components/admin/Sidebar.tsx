"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { useSelectedStore } from "@/contexts/SelectedStoreContext";

export function Sidebar() {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { stores, selectedStore, setSelectedStoreId, loading } = useSelectedStore();

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
  }

  // 店舗固有のナビゲーション
  const storeNavItems = selectedStore
    ? [
        { href: `/stores/${selectedStore.id}`, label: "フロア管理", icon: "🪑" },
        { href: `/queue/${selectedStore.id}`, label: "キュー管理", icon: "📋" },
        { href: `/stores/${selectedStore.id}/qr`, label: "QRコード", icon: "📲" },
      ]
    : [];

  // 店舗非依存のナビゲーション
  const globalNavItems = [
    { href: "/stores", label: "店舗設定", icon: "⚙️" },
  ];

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  const navContent = (
    <>
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-xl font-bold text-indigo-400">QueueMaker</h1>
        <p className="text-xs text-gray-400 mt-1">管理画面</p>
      </div>

      {/* 店舗セレクター */}
      <div className="px-4 py-3 border-b border-gray-700">
        <p className="text-xs text-gray-400 mb-1.5">店舗</p>
        {loading ? (
          <div className="h-8 bg-gray-800 rounded animate-pulse" />
        ) : stores.length === 0 ? (
          <Link
            href="/stores/new"
            onClick={() => setOpen(false)}
            className="block text-xs text-indigo-400 hover:text-indigo-300"
          >
            + 店舗を追加
          </Link>
        ) : (
          <select
            value={selectedStore?.id ?? ""}
            onChange={(e) => {
              setSelectedStoreId(e.target.value);
              // ダッシュボードにいる場合は選択した店舗のフロアへ遷移
              if (pathname === "/dashboard" || pathname === "/") {
                router.push(`/stores/${e.target.value}`);
              }
            }}
            className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-1.5 border border-gray-600 focus:outline-none focus:border-indigo-500"
          >
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-0.5 overflow-y-auto">
        {/* 店舗固有メニュー */}
        {storeNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              isActive(item.href)
                ? "bg-indigo-600 text-white"
                : "text-gray-300 hover:bg-gray-800"
            }`}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}

        {storeNavItems.length > 0 && (
          <div className="border-t border-gray-700 my-2" />
        )}

        {/* グローバルメニュー */}
        {globalNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              isActive(item.href)
                ? "bg-indigo-600 text-white"
                : "text-gray-300 hover:bg-gray-800"
            }`}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-700">
        <button
          onClick={handleSignOut}
          className="w-full text-left text-sm text-gray-400 hover:text-white px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors"
        >
          ログアウト
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* ── Mobile top bar ── */}
      <header className="md:hidden fixed top-0 inset-x-0 z-30 h-14 bg-gray-900 flex items-center px-4 gap-3">
        <button
          onClick={() => setOpen(true)}
          aria-label="メニューを開く"
          className="text-white p-1"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="text-indigo-400 font-bold text-lg">QueueMaker</span>
        {selectedStore && (
          <span className="text-gray-300 text-sm truncate">{selectedStore.name}</span>
        )}
      </header>

      {/* ── Mobile drawer overlay ── */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Mobile drawer ── */}
      <aside
        className={`md:hidden fixed top-0 left-0 z-50 h-full w-64 bg-gray-900 text-white flex flex-col transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 h-14 border-b border-gray-700">
          <h1 className="text-xl font-bold text-indigo-400">QueueMaker</h1>
          <button
            onClick={() => setOpen(false)}
            aria-label="メニューを閉じる"
            className="text-gray-400 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 店舗セレクター（モバイル） */}
        <div className="px-4 py-3 border-b border-gray-700">
          <p className="text-xs text-gray-400 mb-1.5">店舗</p>
          {!loading && stores.length > 0 && (
            <select
              value={selectedStore?.id ?? ""}
              onChange={(e) => {
                setSelectedStoreId(e.target.value);
                setOpen(false);
                if (pathname === "/dashboard" || pathname === "/") {
                  router.push(`/stores/${e.target.value}`);
                }
              }}
              className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-1.5 border border-gray-600 focus:outline-none focus:border-indigo-500"
            >
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-0.5 overflow-y-auto">
          {storeNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive(item.href)
                  ? "bg-indigo-600 text-white"
                  : "text-gray-300 hover:bg-gray-800"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}

          {storeNavItems.length > 0 && (
            <div className="border-t border-gray-700 my-2" />
          )}

          {globalNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive(item.href)
                  ? "bg-indigo-600 text-white"
                  : "text-gray-300 hover:bg-gray-800"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-700">
          <button
            onClick={handleSignOut}
            className="w-full text-left text-sm text-gray-400 hover:text-white px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            ログアウト
          </button>
        </div>
      </aside>

      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex w-64 min-h-screen bg-gray-900 text-white flex-col shrink-0">
        {navContent}
      </aside>
    </>
  );
}
