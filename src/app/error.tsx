'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <main className="container error-page">
      <h1>Something went wrong!</h1>
      <p>An unexpected error occurred. Please try again.</p>
      <Button onClick={reset}>Try again</Button>
    </main>
  );
}
