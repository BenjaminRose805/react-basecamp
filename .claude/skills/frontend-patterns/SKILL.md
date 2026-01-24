---
name: frontend-patterns
description: Frontend development patterns for React, Next.js 15, state management, performance optimization, and UI best practices.
---

# Frontend Development Patterns

Modern frontend patterns for React and Next.js 15 applications.

## Component Patterns

### Composition Over Inheritance

```typescript
interface CardProps {
  children: React.ReactNode
  variant?: 'default' | 'outlined'
  className?: string
}

export function Card({ children, variant = 'default', className }: CardProps) {
  return (
    <div className={cn('card', `card-${variant}`, className)}>
      {children}
    </div>
  )
}

export function CardHeader({ children }: { children: React.ReactNode }) {
  return <div className="card-header">{children}</div>
}

export function CardBody({ children }: { children: React.ReactNode }) {
  return <div className="card-body">{children}</div>
}

// Usage
<Card variant="outlined">
  <CardHeader>Title</CardHeader>
  <CardBody>Content</CardBody>
</Card>
```

### Compound Components

```typescript
interface TabsContextValue {
  activeTab: string
  setActiveTab: (tab: string) => void
}

const TabsContext = createContext<TabsContextValue | undefined>(undefined)

export function Tabs({ children, defaultTab }: {
  children: React.ReactNode
  defaultTab: string
}) {
  const [activeTab, setActiveTab] = useState(defaultTab)

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </TabsContext.Provider>
  )
}

export function TabList({ children }: { children: React.ReactNode }) {
  return <div className="tab-list" role="tablist">{children}</div>
}

export function Tab({ id, children }: { id: string; children: React.ReactNode }) {
  const context = useContext(TabsContext)
  if (!context) throw new Error('Tab must be used within Tabs')

  return (
    <button
      role="tab"
      aria-selected={context.activeTab === id}
      className={context.activeTab === id ? 'active' : ''}
      onClick={() => context.setActiveTab(id)}
    >
      {children}
    </button>
  )
}

export function TabPanel({ id, children }: { id: string; children: React.ReactNode }) {
  const context = useContext(TabsContext)
  if (!context) throw new Error('TabPanel must be used within Tabs')

  if (context.activeTab !== id) return null

  return <div role="tabpanel">{children}</div>
}
```

### Render Props Pattern

```typescript
interface DataLoaderProps<T> {
  fetcher: () => Promise<T>
  children: (data: T | null, loading: boolean, error: Error | null) => React.ReactNode
}

export function DataLoader<T>({ fetcher, children }: DataLoaderProps<T>) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    fetcher()
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [fetcher])

  return <>{children(data, loading, error)}</>
}

// Usage
<DataLoader fetcher={() => api.workItems.list.query({})}>
  {(items, loading, error) => {
    if (loading) return <Spinner />
    if (error) return <ErrorMessage error={error} />
    return <WorkItemList items={items!} />
  }}
</DataLoader>
```

## Custom Hooks Patterns

### Toggle Hook

```typescript
export function useToggle(initialValue = false): [boolean, () => void] {
  const [value, setValue] = useState(initialValue);

  const toggle = useCallback(() => {
    setValue((v) => !v);
  }, []);

  return [value, toggle];
}

// Usage
const [isOpen, toggleOpen] = useToggle();
```

### Debounce Hook

```typescript
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

// Usage
const [searchQuery, setSearchQuery] = useState("");
const debouncedQuery = useDebounce(searchQuery, 500);

useEffect(() => {
  if (debouncedQuery) {
    performSearch(debouncedQuery);
  }
}, [debouncedQuery]);
```

### Local Storage Hook

```typescript
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;

    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const valueToStore = value instanceof Function ? value(prev) : value;
        if (typeof window !== "undefined") {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
        return valueToStore;
      });
    },
    [key]
  );

  return [storedValue, setValue];
}
```

## State Management

### Context + Reducer Pattern

```typescript
interface State {
  items: WorkItem[]
  selectedId: string | null
  loading: boolean
}

type Action =
  | { type: 'SET_ITEMS'; payload: WorkItem[] }
  | { type: 'SELECT_ITEM'; payload: string | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'ADD_ITEM'; payload: WorkItem }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_ITEMS':
      return { ...state, items: action.payload, loading: false }
    case 'SELECT_ITEM':
      return { ...state, selectedId: action.payload }
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    case 'ADD_ITEM':
      return { ...state, items: [...state.items, action.payload] }
    default:
      return state
  }
}

const WorkItemContext = createContext<{
  state: State
  dispatch: Dispatch<Action>
} | undefined>(undefined)

export function WorkItemProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    items: [],
    selectedId: null,
    loading: true
  })

  return (
    <WorkItemContext.Provider value={{ state, dispatch }}>
      {children}
    </WorkItemContext.Provider>
  )
}

export function useWorkItems() {
  const context = useContext(WorkItemContext)
  if (!context) throw new Error('useWorkItems must be used within WorkItemProvider')
  return context
}
```

### Zustand Store

```typescript
import { create } from "zustand";

interface WorkItemStore {
  selectedId: string | null;
  filters: { status?: string; search?: string };
  setSelected: (id: string | null) => void;
  setFilters: (filters: Partial<WorkItemStore["filters"]>) => void;
  resetFilters: () => void;
}

export const useWorkItemStore = create<WorkItemStore>((set) => ({
  selectedId: null,
  filters: {},
  setSelected: (id) => set({ selectedId: id }),
  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),
  resetFilters: () => set({ filters: {} }),
}));
```

## Performance Optimization

### Memoization

```typescript
// useMemo for expensive computations
const sortedItems = useMemo(() => {
  return [...items].sort((a, b) => b.priority - a.priority)
}, [items])

// useCallback for functions passed to children
const handleSelect = useCallback((id: string) => {
  setSelectedId(id)
}, [])

// React.memo for pure components
export const WorkItemCard = memo<WorkItemCardProps>(({ item, onSelect }) => {
  return (
    <div className="work-item-card" onClick={() => onSelect(item.id)}>
      <h3>{item.title}</h3>
      <p>{item.description}</p>
    </div>
  )
})
```

### Code Splitting & Lazy Loading

```typescript
import { lazy, Suspense } from 'react'

// Lazy load heavy components
const WorkflowDesigner = lazy(() => import('./WorkflowDesigner'))
const AnalyticsDashboard = lazy(() => import('./AnalyticsDashboard'))

export function App() {
  return (
    <div>
      <Suspense fallback={<LoadingSkeleton />}>
        <WorkflowDesigner />
      </Suspense>

      <Suspense fallback={<ChartPlaceholder />}>
        <AnalyticsDashboard />
      </Suspense>
    </div>
  )
}
```

### Virtualization for Long Lists

```typescript
import { useVirtualizer } from '@tanstack/react-virtual'

export function VirtualList({ items }: { items: WorkItem[] }) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    overscan: 5
  })

  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
        {virtualizer.getVirtualItems().map(virtualRow => (
          <div
            key={virtualRow.index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`
            }}
          >
            <WorkItemCard item={items[virtualRow.index]} />
          </div>
        ))}
      </div>
    </div>
  )
}
```

## Form Handling

### Controlled Form with Validation

```typescript
import { z } from 'zod'

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high'])
})

type FormData = z.infer<typeof schema>

export function CreateWorkItemForm({ onSubmit }: { onSubmit: (data: FormData) => void }) {
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    priority: 'medium'
  })
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const result = schema.safeParse(formData)

    if (!result.success) {
      const fieldErrors: typeof errors = {}
      result.error.issues.forEach(issue => {
        const field = issue.path[0] as keyof FormData
        fieldErrors[field] = issue.message
      })
      setErrors(fieldErrors)
      return
    }

    setErrors({})
    onSubmit(result.data)
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={formData.title}
        onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
        placeholder="Title"
      />
      {errors.title && <span className="error">{errors.title}</span>}

      <button type="submit">Create</button>
    </form>
  )
}
```

## Error Boundary

```typescript
interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error boundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="error-fallback">
          <h2>Something went wrong</h2>
          <button onClick={() => this.setState({ hasError: false })}>
            Try again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
```

## Accessibility Patterns

### Keyboard Navigation

```typescript
export function Dropdown({ options, onSelect }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActiveIndex(i => Math.min(i + 1, options.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setActiveIndex(i => Math.max(i - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        onSelect(options[activeIndex])
        setIsOpen(false)
        break
      case 'Escape':
        setIsOpen(false)
        break
    }
  }

  return (
    <div
      role="combobox"
      aria-expanded={isOpen}
      aria-haspopup="listbox"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Implementation */}
    </div>
  )
}
```

### Focus Management

```typescript
export function Modal({ isOpen, onClose, children }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement
      modalRef.current?.focus()
    } else {
      previousFocusRef.current?.focus()
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
      onKeyDown={e => e.key === 'Escape' && onClose()}
    >
      {children}
    </div>
  )
}
```

## Best Practices

1. **Composition over inheritance** - Build with small, composable components
2. **Custom hooks** - Extract reusable logic
3. **Memoization** - useMemo, useCallback, React.memo where needed
4. **Lazy loading** - Code split heavy components
5. **Virtualization** - For long lists
6. **Proper form handling** - Controlled components with validation
7. **Error boundaries** - Catch and handle errors gracefully
8. **Accessibility** - Keyboard navigation, ARIA attributes
