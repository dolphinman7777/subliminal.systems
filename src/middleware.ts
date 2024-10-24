import { authMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default authMiddleware({
  publicRoutes: ["/", "/api/(.*)"],
  ignoredRoutes: ["/api/(.*)"],
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};

// Remove the middleware function as it's not needed when using Clerk's authMiddleware