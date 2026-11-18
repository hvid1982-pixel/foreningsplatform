import Link from "next/link";
import { da } from "@/messages/da";

const links = [
  { href: "/forening", label: da.nav.associationHome },
  { href: "/forening/opsaetning", label: da.nav.associationProfile },
  { href: "/forening/produkter", label: da.nav.associationOfferings },
];

/**
 * Association area. The navigation is static; every page checks the session
 * and the association membership itself.
 */
export default function AssociationLayout({ children }: LayoutProps<"/forening">) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <nav aria-label={da.nav.associationNav} className="mb-8 flex flex-wrap gap-1 border-b pb-3">
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
    </div>
  );
}
