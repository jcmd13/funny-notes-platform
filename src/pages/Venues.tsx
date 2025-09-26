/**
 * Venues page - for managing performance venues
 * This will be fully implemented in later tasks
 */
export function Venues() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-yellow-400">
          Venues 🏢
        </h1>
        <button className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 px-4 py-2 rounded-md font-medium transition-colors">
          Add Venue
        </button>
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <div className="text-center py-12 text-gray-400">
          <div className="text-6xl mb-4">🎪</div>
          <h2 className="text-xl font-semibold mb-2">No Venues Yet</h2>
          <p>Add venues where you perform to track your gig history.</p>
          <p className="text-sm mt-2">
            Store venue details, contacts, and performance notes.
          </p>
        </div>
      </div>
    </div>
  )
}