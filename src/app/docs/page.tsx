import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import LogoutButton from "@/components/LogoutButton";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default async function DocsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [owned, sharedRaw] = await Promise.all([
    prisma.document.findMany({
      where: { ownerId: user.id },
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true, updatedAt: true },
    }),
    prisma.document.findMany({
      where: { shares: { some: { userId: user.id } } },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        updatedAt: true,
        owner: { select: { name: true } },
        shares: { where: { userId: user.id }, select: { role: true } },
      },
    }),
  ]);

  const shared = sharedRaw.map((d) => ({
    id: d.id,
    title: d.title,
    updatedAt: d.updatedAt.toISOString(),
    ownerName: d.owner.name,
    role: d.shares[0]?.role ?? "viewer",
  }));

  const ownedSerialized = owned.map((d) => ({
    ...d,
    updatedAt: d.updatedAt.toISOString(),
  }));

  return (
    <>
      <header className="topbar">
        <div className="topbar-left">
          <span className="brand">
            <span className="brand-mark">A</span> Ajaia Docs
          </span>
        </div>
        <div className="row">
          <span className="muted" style={{ fontSize: 13 }}>
            {user.name}
          </span>
          <span className="avatar" title={user.email}>
            {initials(user.name)}
          </span>
          <LogoutButton />
        </div>
      </header>

      <main className="container">
        <DashboardClient owned={ownedSerialized} shared={shared} />
      </main>
    </>
  );
}
