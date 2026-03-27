import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <nav className="border-b border-gray-100 bg-gray-50 px-6 py-2">
        <div className="mx-auto flex max-w-5xl gap-6">
          <Link
            href="/dashboard"
            className="text-sm text-gray-600 no-underline hover:text-gray-900"
          >
            Overview
          </Link>
          <Link
            href="/dashboard/trigger"
            className="text-sm text-gray-600 no-underline hover:text-gray-900"
          >
            Trigger
          </Link>
        </div>
      </nav>
      {children}
    </div>
  );
}
