import { Button } from '@/components/ui/Button';

export default function HomePage() {
  return (
    <main className="container">
      <h1>Welcome to My App</h1>
      <p>
        This project is configured with{' '}
        <a
          href="https://github.com/benjaminrose/react-basecamp"
          target="_blank"
          rel="noopener noreferrer"
        >
          react-basecamp
        </a>{' '}
        tooling.
      </p>

      <section>
        <h2>Features</h2>
        <ul>
          <li>Next.js 15 with App Router</li>
          <li>TypeScript with strict mode</li>
          <li>ESLint + Prettier pre-configured</li>
          <li>Vitest for unit testing</li>
          <li>Playwright for E2E testing</li>
          <li>Husky git hooks</li>
          <li>Claude Code integration</li>
        </ul>
      </section>

      <section>
        <h2>Example Component</h2>
        <Button>Click me</Button>
      </section>
    </main>
  );
}
