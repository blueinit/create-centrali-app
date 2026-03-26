import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <nav className="border-b border-gray-100 bg-gray-50 px-6 py-2">
        <div className="mx-auto flex max-w-3xl gap-6">
          <Link
            href="/dashboard"
            className="text-sm text-gray-600 no-underline hover:text-gray-900"
          >
            Projects
          </Link>
          <Link
            href="/dashboard/settings"
            className="text-sm text-gray-600 no-underline hover:text-gray-900"
          >
            Settings
          </Link>
        </div>
      </nav>
      {children}
    </div>
  );
}
