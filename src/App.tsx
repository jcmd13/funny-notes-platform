import './App.css'

function App() {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-yellow-400 mb-2">
            🎤 Funny Notes
          </h1>
          <p className="text-lg text-gray-300">
            Your comedy material management platform
          </p>
        </header>
        
        <div className="max-w-md mx-auto bg-gray-800 rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Welcome to the stage!</h2>
          <p className="text-gray-300 mb-6">
            Ready to organize your comedy gold? Let's get started building your material library.
          </p>
          
          <div className="space-y-3">
            <button className="btn-primary w-full">
              Start Capturing Ideas
            </button>
            <button className="btn-secondary w-full">
              Browse Features
            </button>
          </div>
        </div>
        
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>Project initialized with React + TypeScript + Tailwind CSS + PWA</p>
        </div>
      </div>
    </div>
  )
}

export default App
