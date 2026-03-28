"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";

const navItems = [
  { href: "/dashboard", label: "ダッシュボード", icon: "📊" },
  { href: "/stores", label: "店舗一覧", icon: "🏪" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
  }

  const navContent = (
    <>
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-xl font-bold text-indigo-400">QueueMaker</h1>
        <p className="text-xs text-gray-400 mt-1">管理画面</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              pathname.startsWith(item.href)
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
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                pathname.startsWith(item.href)
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
