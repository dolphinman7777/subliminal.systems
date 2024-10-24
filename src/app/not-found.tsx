import Link from 'next/link'
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <h1 className="text-4xl font-bold mb-4 text-gray-800 dark:text-gray-200">404 - Page Not Found</h1>
      <p className="text-xl mb-8 text-gray-600 dark:text-gray-400">Oops! The page you&apos;re looking for doesn&apos;t exist.</p>
      <Link href="/">
        <Button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
          Go Back Home
        </Button>
      </Link>
    </div>
  )
}
