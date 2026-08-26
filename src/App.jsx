import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold text-blue-600 mb-4">
        React + Tailwind CSS
      </h1>
      <p className="text-gray-700 mb-6">
        Edit <code className="bg-gray-200 px-2 py-1 rounded">src/App.jsx</code> and save to test HMR.
      </p>
      <button
        onClick={() => setCount((count) => count + 1)}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
      >
        Count is {count}
      </button>
    </div>
  )
}

export default App
