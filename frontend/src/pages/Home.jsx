import { Link } from 'react-router-dom';

export default function Home() {
    return (
        <div className="max-w-4xl mx-auto space-y-8">
          <h1 className="text-3xl font-bold">Welcome to LogQR</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link
              to="/create-log"
              className="p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <h2 className="text-xl font-semibold mb-2">Create New Log</h2>
              <p className="text-gray-600">
                Create a new QR code for collecting feedback and reviews.
              </p>
            </Link>
            <Link
              to="/view-logs"
              className="p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <h2 className="text-xl font-semibold mb-2">See Old Logs</h2>
              <p className="text-gray-600">
                View and manage your existing QR code logs and reviews.
              </p>
            </Link>
          </div>
        </div>
      );
}