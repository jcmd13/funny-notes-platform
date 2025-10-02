/**
 * Contacts page - for managing industry contacts
 * This will be fully implemented in later tasks
 */
export function Contacts() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-yellow-400">
          Contacts 👥
        </h1>
        <button className="bg-yellow-500 text-gray-900 px-4 py-2 rounded-md font-medium inline-flex items-center space-x-2 transition-colors hover:bg-yellow-400">
          <span className="text-lg">+</span>
          <span>Create Contact</span>
        </button>
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <div className="text-center py-12 text-gray-400">
          <div className="text-6xl mb-4">📇</div>
          <h2 className="text-xl font-semibold mb-2">No Contacts Yet</h2>
          <p>Build your network of venue owners, bookers, and fellow comedians.</p>
          <p className="text-sm mt-2">
            Track interactions, reminders, and relationship history.
          </p>
        </div>
      </div>
    </div>
  )
}