'use client' // Error components must be Client Components

import React from 'react'
import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="text-center">
        <h2 className="text-4xl font-bold mb-4 text-gray-800 dark:text-gray-200">Something went wrong!</h2>
        <p className="text-xl mb-8 text-gray-600 dark:text-gray-400">We&apos;re sorry, but an error occurred while processing your request.</p>
        <button
          onClick={reset}
          type="button"
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
