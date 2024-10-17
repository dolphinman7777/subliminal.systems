'use client'

import { useRouter } from 'next/navigation'

export default function PaymentCancelled() {
  const router = useRouter()

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Payment Cancelled</h1>
      <p className="mb-4">Your payment was cancelled. Please try again if you wish to complete your purchase.</p>
      <button
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        onClick={() => router.push('/')}
      >
        Return to Home
      </button>
    </div>
  )
}