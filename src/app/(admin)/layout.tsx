export const dynamic = "force-dynamic";

import { AdminGuard } from "@/components/admin/AdminGuard";
import { Sidebar } from "@/components/admin/Sidebar";
import { SelectedStoreProvider } from "@/contexts/SelectedStoreContext";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
      <SelectedStoreProvider>
        <div className="flex min-h-screen">
          <Sidebar />
          {/* モバイルでは上部バーの高さ(56px)分だけ押し下げる */}
          <main className="flex-1 overflow-auto pt-14 md:pt-0">{children}</main>
        </div>
      </SelectedStoreProvider>
    </AdminGuard>
  );
}
