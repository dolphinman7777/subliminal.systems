'use client' // Error components must be Client Components

import { useEffect } from 'react'
import { Button } from "@/components/ui/button"

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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <h2 className="text-4xl font-bold mb-4 text-gray-800 dark:text-gray-200">Something went wrong!</h2>
      <p className="text-xl mb-8 text-gray-600 dark:text-gray-400">We&apos;re sorry, but an error occurred while processing your request.</p>
      <Button
        onClick={reset}
        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
      >
        Try again
      </Button>
    </div>
  )
}
