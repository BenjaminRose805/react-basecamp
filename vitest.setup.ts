import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia (required for components using media queries)
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver (required for lazy loading, infinite scroll, etc.)
class MockIntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = "";
  readonly thresholds: ReadonlyArray<number> = [];

  disconnect(): void {
    // Mock implementation - no action needed
  }
  observe(): void {
    // Mock implementation - no action needed
  }
  unobserve(): void {
    // Mock implementation - no action needed
  }
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

Object.defineProperty(window, "IntersectionObserver", {
  writable: true,
  value: MockIntersectionObserver,
});

// Mock ResizeObserver (required for components that observe size changes)
class MockResizeObserver {
  disconnect(): void {
    // Mock implementation - no action needed
  }
  observe(): void {
    // Mock implementation - no action needed
  }
  unobserve(): void {
    // Mock implementation - no action needed
  }
}

Object.defineProperty(window, "ResizeObserver", {
  writable: true,
  value: MockResizeObserver,
});

// Mock scrollTo (prevents errors in components that scroll)
Object.defineProperty(window, "scrollTo", {
  writable: true,
  value: vi.fn(),
});
