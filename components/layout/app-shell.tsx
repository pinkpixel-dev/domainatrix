import Image from "next/image";
import Link from "next/link";
import { ChartNoAxesCombined, Globe2, Settings, ShieldCheck } from "lucide-react";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { getNotifications, getUnreadNotificationCount } from "@/lib/notifications/notification-service";

const navItems = [
  { href: "/", label: "Dashboard", icon: ChartNoAxesCombined },
  { href: "/domains", label: "Domains", icon: Globe2 },
  { href: "/domains/new", label: "Add", icon: ShieldCheck },
  { href: "/settings", label: "Settings", icon: Settings },
];

export async function AppShell({ children }: { children: React.ReactNode }) {
  const [notifications, unreadCount] = await Promise.all([
    getNotifications({ limit: 6 }),
    getUnreadNotificationCount(),
  ]);

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-border bg-background/92 px-4 py-5 backdrop-blur md:block">
        <Link href="/" className="flex items-center gap-3 ml-1">
          <Image
            src="/logo.png"
            alt="Domainatrix logo"
            width={60}
            height={60}
            loading="eager"
            className="rounded-md drop-shadow-[0_0_5px_rgba(255,255,255,0.25)]"
          />
          <span>
            <span className="rounded-md drop-shadow-[0_0_5px_rgba(255,255,255,0.25)] block text-[20px] font-bold text-gray-300">Domainatrix</span>
          </span>
        </Link>

        <nav className="mt-8 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex h-10 items-center gap-3 rounded-md px-3 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <Icon className="size-4" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="md:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/86 px-4 backdrop-blur md:px-8">
          <Link href="/" className="font-semibold md:hidden">
            Domainatrix
          </Link>
          <div className="hidden text-sm text-muted-foreground md:block">
            Domain portfolio management
          </div>
          <NotificationBell notifications={notifications} unreadCount={unreadCount} />
        </header>
        <div className="px-4 py-8 md:px-8">{children}</div>
      </div>
    </div>
  );
}
