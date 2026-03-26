import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-6 text-center">
      <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
        {"{{projectName}}"}
      </h1>
      <p className="mt-4 max-w-md text-lg text-gray-600">
        A full-stack SaaS starter with authentication, multi-tenant data, and
        background jobs — powered by Centrali.
      </p>
      <div className="mt-8 flex gap-4">
        <Link
          href="/sign-up"
          className="rounded-lg bg-gray-900 px-6 py-3 text-sm font-medium text-white no-underline hover:bg-gray-800"
        >
          Get started
        </Link>
        <Link
          href="/sign-in"
          className="rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 no-underline hover:bg-gray-50"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}
