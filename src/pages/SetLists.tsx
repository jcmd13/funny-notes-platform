/**
 * SetLists page - for managing performance set lists
 * This will be fully implemented in later tasks
 */
export function SetLists() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-yellow-400">
          Set Lists 🎭
        </h1>
        <button className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 px-4 py-2 rounded-md font-medium transition-colors">
          Create Set List
        </button>
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <div className="text-center py-12 text-gray-400">
          <div className="text-6xl mb-4">🎪</div>
          <h2 className="text-xl font-semibold mb-2">No Set Lists Yet</h2>
          <p>Create your first set list to organize material for performances.</p>
          <p className="text-sm mt-2">
            Drag and drop notes to build the perfect lineup.
          </p>
        </div>
      </div>
    </div>
  )
}