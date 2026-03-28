"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { useSelectedStore } from "@/contexts/SelectedStoreContext";

export function Sidebar() {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const router = useRouter();

  // モバイルドロワー開閉
  const [open, setOpen] = useState(false);
  // PC/タブレット折りたたみ（localStorage に永続化）
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("sidebar_collapsed");
    if (saved === "true") setCollapsed(true);
  }, []);

  function toggleCollapsed() {
    setCollapsed((v) => {
      localStorage.setItem("sidebar_collapsed", String(!v));
      return !v;
    });
  }

  const { stores, selectedStore, setSelectedStoreId, loading } = useSelectedStore();

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
  }

  const storeNavItems = selectedStore
    ? [
        { href: `/stores/${selectedStore.id}`, label: "フロア管理", icon: "🪑" },
        { href: `/queue/${selectedStore.id}`, label: "キュー管理", icon: "📋" },
        { href: `/stores/${selectedStore.id}/qr`, label: "QRコード", icon: "📲" },
        { href: `/stores/${selectedStore.id}/settings`, label: "店舗設定", icon: "⚙️" },
      ]
    : [];

  const globalNavItems = [
    { href: "/stores", label: "店舗一覧", icon: "🏪", exact: true },
  ];

  function isActive(href: string, exact = false) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  }

  // ── ナビリンク（expanded / collapsed 共通） ──────────────
  function NavLink({
    href,
    icon,
    label,
    onClick,
    exact,
  }: {
    href: string;
    icon: string;
    label: string;
    onClick?: () => void;
    exact?: boolean;
  }) {
    const active = isActive(href, exact);
    return (
      <Link
        href={href}
        onClick={onClick}
        title={collapsed ? label : undefined}
        className={`flex items-center rounded-lg text-sm transition-colors ${
          collapsed
            ? "justify-center px-0 py-2.5 mx-1"
            : "gap-3 px-3 py-2"
        } ${
          active
            ? "bg-indigo-600 text-white"
            : "text-gray-300 hover:bg-gray-800"
        }`}
      >
        <span className="text-lg leading-none shrink-0">{icon}</span>
        {!collapsed && <span className="truncate">{label}</span>}
      </Link>
    );
  }

  // ── デスクトップサイドバーの内容 ────────────────────────
  const desktopContent = (
    <>
      {/* ヘッダー + トグルボタン */}
      <div
        className={`flex items-center border-b border-gray-700 h-14 shrink-0 ${
          collapsed ? "justify-center px-2" : "justify-between px-4"
        }`}
      >
        {!collapsed && (
          <div>
            <h1 className="text-lg font-bold text-indigo-400 leading-tight">QueueMaker</h1>
            <p className="text-xs text-gray-400">管理画面</p>
          </div>
        )}
        <button
          onClick={toggleCollapsed}
          aria-label={collapsed ? "メニューを展開" : "メニューを折りたたむ"}
          className="text-gray-400 hover:text-white hover:bg-gray-800 p-1.5 rounded-lg transition-colors"
        >
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${collapsed ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* 店舗セレクター */}
      <div
        className={`border-b border-gray-700 shrink-0 ${
          collapsed ? "py-2 px-2" : "px-4 py-3"
        }`}
      >
        {collapsed ? (
          // 折りたたみ時: 店舗の頭文字 or アイコン
          <div
            title={selectedStore?.name ?? "店舗"}
            className="flex items-center justify-center w-9 h-9 mx-auto bg-gray-800 rounded-lg text-sm font-bold text-indigo-300 cursor-default"
          >
            {selectedStore?.name?.charAt(0) ?? "🏪"}
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-400 mb-1.5">店舗</p>
            {loading ? (
              <div className="h-8 bg-gray-800 rounded animate-pulse" />
            ) : stores.length === 0 ? (
              <Link
                href="/stores/new"
                className="block text-xs text-indigo-400 hover:text-indigo-300"
              >
                + 店舗を追加
              </Link>
            ) : (
              <select
                value={selectedStore?.id ?? ""}
                onChange={(e) => {
                  setSelectedStoreId(e.target.value);
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
          </>
        )}
      </div>

      {/* ナビゲーション */}
      <nav
        className={`flex-1 overflow-y-auto space-y-0.5 ${
          collapsed ? "py-3 px-0" : "p-4"
        }`}
      >
        {storeNavItems.map((item) => (
          <NavLink key={item.href} {...item} />
        ))}

        {storeNavItems.length > 0 && (
          <div className={`border-t border-gray-700 ${collapsed ? "my-2 mx-2" : "my-2"}`} />
        )}

        {globalNavItems.map((item) => (
          <NavLink key={item.href} {...item} />
        ))}
      </nav>

      {/* フッター */}
      <div className={`border-t border-gray-700 shrink-0 ${collapsed ? "py-3 px-0" : "p-4"}`}>
        <button
          onClick={handleSignOut}
          title={collapsed ? "ログアウト" : undefined}
          className={`flex items-center rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors w-full ${
            collapsed ? "justify-center px-0 py-2.5 mx-1" : "gap-3 px-3 py-2"
          }`}
        >
          <span className="text-lg leading-none shrink-0">🚪</span>
          {!collapsed && <span>ログアウト</span>}
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
        <div className="flex items-center justify-between px-4 h-14 border-b border-gray-700 shrink-0">
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

        <div className="px-4 py-3 border-b border-gray-700 shrink-0">
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
          {storeNavItems.length > 0 && <div className="border-t border-gray-700 my-2" />}
          {globalNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive(item.href, item.exact)
                  ? "bg-indigo-600 text-white"
                  : "text-gray-300 hover:bg-gray-800"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-700 shrink-0">
          <button
            onClick={handleSignOut}
            className="w-full text-left text-sm text-gray-400 hover:text-white px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            ログアウト
          </button>
        </div>
      </aside>

      {/* ── Desktop sidebar（折りたたみ対応） ── */}
      <aside
        className={`hidden md:flex flex-col min-h-screen bg-gray-900 text-white shrink-0 transition-all duration-200 ${
          collapsed ? "w-14" : "w-64"
        }`}
      >
        {desktopContent}
      </aside>
    </>
  );
}
