"use client"

import HomePage from './home-page';
import { useEffect } from 'react';

export default function Page() {
  return (
    <>
      <HomePage>
        {/* Add content here that will be passed as children */}
        <div>Welcome to Subliminal Systems</div>
      </HomePage>
    </>
  );
}
