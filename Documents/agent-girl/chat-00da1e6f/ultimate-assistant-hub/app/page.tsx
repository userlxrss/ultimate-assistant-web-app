import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Ultimate Assistant Hub API
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Complete productivity and personal management system
        </p>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              📊 Dashboard
            </h2>
            <p className="text-gray-600 mb-4">
              Real-time metrics and productivity insights
            </p>
            <Link
              href="/api/dashboard/metrics"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              View API →
            </Link>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              📔 Journal
            </h2>
            <p className="text-gray-600 mb-4">
              Personal journaling with AI-powered reflections
            </p>
            <Link
              href="/api/journal"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              View API →
            </Link>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              ✅ Tasks
            </h2>
            <p className="text-gray-600 mb-4">
              Task management with Motion.so integration
            </p>
            <Link
              href="/api/tasks"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              View API →
            </Link>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              📅 Calendar
            </h2>
            <p className="text-gray-600 mb-4">
              Event scheduling with Google Calendar sync
            </p>
            <Link
              href="/api/calendar"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              View API →
            </Link>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              📧 Email
            </h2>
            <p className="text-gray-600 mb-4">
              Email management with Gmail integration
            </p>
            <Link
              href="/api/emails"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              View API →
            </Link>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              👥 Contacts
            </h2>
            <p className="text-gray-600 mb-4">
              Contact management with Google Contacts sync
            </p>
            <Link
              href="/api/contacts"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              View API →
            </Link>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              📈 Analytics
            </h2>
            <p className="text-gray-600 mb-4">
              Advanced productivity insights and recommendations
            </p>
            <Link
              href="/api/analytics/metrics"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              View API →
            </Link>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              🔍 Search
            </h2>
            <p className="text-gray-600 mb-4">
              Global search across all modules
            </p>
            <Link
              href="/api/search"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              View API →
            </Link>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              📚 Documentation
            </h2>
            <p className="text-gray-600 mb-4">
              Complete OpenAPI/Swagger documentation
            </p>
            <Link
              href="/api/docs"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              View Docs →
            </Link>
          </div>
        </div>

        <div className="mt-12 p-6 bg-blue-50 rounded-lg">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            🔐 Authentication
          </h2>
          <p className="text-gray-600 mb-4">
            Most API endpoints require authentication. Start by registering or logging in:
          </p>
          <div className="flex gap-4">
            <Link
              href="/api/auth/register"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Register →
            </Link>
            <Link
              href="/api/auth/login"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Login →
            </Link>
          </div>
        </div>

        <div className="mt-8 text-center text-gray-500">
          <p>
            Built with Next.js 15, TypeScript, Prisma, and ❤️
          </p>
        </div>
      </div>
    </main>
  )
}