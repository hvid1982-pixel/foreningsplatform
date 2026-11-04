import Link from "next/link";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import { da } from "@/messages/da";
import { requirePlatformAdmin } from "@/server/session";

const links = [
  { href: "/admin", label: da.nav.dashboard },
  { href: "/admin/godkendelser", label: da.nav.reviews },
  { href: "/admin/organisationer", label: da.nav.organizations },
  { href: "/admin/katalog", label: da.nav.catalog },
  { href: "/admin/regler", label: da.nav.configuration },
  { href: "/admin/log", label: da.nav.auditLog },
];

/**
 * The admin area is never prefetched for instant navigation: its content is
 * per-user and non-admins are redirected away. Opting out silences dev-time
 * instant-navigation validation for this segment.
 */
export const instant = false;

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <Suspense fallback={<PageSkeleton />}>
        <AdminGate>{children}</AdminGate>
      </Suspense>
    </div>
  );
}

/**
 * Hides the admin chrome from non-admins. Each admin page ALSO checks
 * `requirePlatformAdmin()` itself, because layouts are not re-rendered on every
 * client navigation and must not be the only check.
 */
async function AdminGate({ children }: { children: React.ReactNode }) {
  await requirePlatformAdmin();
  return (
    <>
      <nav aria-label={da.nav.admin} className="mb-8 flex flex-wrap gap-1 border-b pb-3">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            {link.label}
          </Link>
        ))}
      </nav>
      {children}
    </>
  );
}
