import { Button } from "@/components/ui/button";

const features = [
  "Next.js 15 with App Router",
  "TypeScript with strict mode",
  "ESLint + Prettier pre-configured",
  "Vitest for unit testing",
  "Playwright for E2E testing",
  "Husky git hooks",
  "Claude Code integration",
];

export default function HomePage() {
  return (
    <main className="container">
      <h1>Welcome to My App</h1>
      <p>
        This project uses{" "}
        <a
          href="https://github.com/benjaminrose/react-basecamp"
          target="_blank"
          rel="noopener noreferrer"
        >
          react-basecamp
        </a>{" "}
        tooling.
      </p>
      <section>
        <h2>Features</h2>
        <ul>
          {features.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>
      </section>
      <section>
        <h2>Example Component</h2>
        <Button>Click me</Button>
      </section>
    </main>
  );
}
