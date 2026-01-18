# Feature: Next.js Demo App

> **Status:** Draft
> **Author:** Claude
> **Created:** 2026-01-18

## Goal

Transform the minimal placeholder into a full-featured Next.js demo app that showcases modern patterns (Tailwind CSS, Server Actions, next-themes, React Hook Form + Zod) and serves as a practical starting point for real projects.

## User Stories

- As a developer, I can clone this template and have a working app with common patterns already implemented.
- As a developer, I can toggle between light and dark themes with the preference persisted.
- As a developer, I can see examples of data fetching, forms, and server actions.
- As a developer, I can reference this code to understand Next.js 15 best practices.

## Success Criteria

- [ ] SC-1: App has 4+ pages with shared navigation
- [ ] SC-2: Theme toggle works and persists across page refreshes
- [ ] SC-3: Form validation shows errors and submits via Server Action
- [ ] SC-4: Data fetching demonstrates loading and error states
- [ ] SC-5: All existing tests pass + new tests for new features
- [ ] SC-6: E2E tests cover all major user flows
- [ ] SC-7: Lighthouse accessibility score >= 90

## Technical Constraints

| Constraint      | Value                                  |
| --------------- | -------------------------------------- |
| Styling         | Tailwind CSS                           |
| Theme           | next-themes with Tailwind dark mode    |
| Forms           | React Hook Form + Zod                  |
| Icons           | Lucide React                           |
| Data            | Local JSON + Server Actions            |
| Browser support | Chrome, Firefox, Safari, Edge (latest) |

---

## Requirements

### Navigation & Layout

- [ ] REQ-1: Shared header with logo, navigation links, and theme toggle
- [ ] REQ-2: Navigation highlights current active page
- [ ] REQ-3: Mobile-responsive navigation (hamburger menu on small screens)
- [ ] REQ-4: Shared footer with links and copyright

### Pages

- [ ] REQ-5: Home page (`/`) - Hero section, feature highlights, CTA
- [ ] REQ-6: About page (`/about`) - Project description, tech stack list
- [ ] REQ-7: Posts page (`/posts`) - List of posts with loading state
- [ ] REQ-8: Post detail page (`/posts/[id]`) - Single post view with comments
- [ ] REQ-9: Contact page (`/contact`) - Contact form with validation

### Theme System

- [ ] REQ-10: Light/dark theme toggle in header
- [ ] REQ-11: Theme preference persists in localStorage
- [ ] REQ-12: No flash of wrong theme on page load (SSR-safe)
- [ ] REQ-13: System preference detection (prefers-color-scheme)

### Data Layer

- [ ] REQ-14: Posts data stored in local JSON file
- [ ] REQ-15: Server Action to fetch posts list
- [ ] REQ-16: Server Action to fetch single post with comments
- [ ] REQ-17: Loading states shown during data fetches
- [ ] REQ-18: Error boundary handles fetch failures gracefully

### Contact Form

- [ ] REQ-19: Form fields: name, email, subject, message
- [ ] REQ-20: Client-side validation with Zod schema
- [ ] REQ-21: Error messages displayed inline per field
- [ ] REQ-22: Server Action to handle form submission
- [ ] REQ-23: Success/error toast notification after submit

### Components

- [ ] REQ-24: Button component with variants (primary, secondary, outline, ghost)
- [ ] REQ-25: Input component with label, error state, and helper text
- [ ] REQ-26: Textarea component matching Input styling
- [ ] REQ-27: Card component for posts and feature highlights
- [ ] REQ-28: Toast/notification component for feedback
- [ ] REQ-29: Skeleton loader component for loading states

---

## Design

### Pages Structure

```
src/app/
├── layout.tsx          # Root layout with ThemeProvider, Header, Footer
├── page.tsx            # Home page
├── about/
│   └── page.tsx        # About page
├── posts/
│   ├── page.tsx        # Posts list
│   ├── loading.tsx     # Posts loading state
│   └── [id]/
│       ├── page.tsx    # Post detail
│       └── loading.tsx # Post detail loading
└── contact/
    └── page.tsx        # Contact form
```

### Components Structure

```
src/components/
├── ui/
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Textarea.tsx
│   ├── Card.tsx
│   ├── Toast.tsx
│   └── Skeleton.tsx
├── layout/
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── Navigation.tsx
│   └── ThemeToggle.tsx
└── features/
    ├── PostCard.tsx
    ├── PostList.tsx
    ├── CommentList.tsx
    └── ContactForm.tsx
```

### Data Structure

```typescript
// src/types/index.ts
interface Post {
  id: number;
  title: string;
  body: string;
  authorId: number;
  createdAt: string;
}

interface Comment {
  id: number;
  postId: number;
  name: string;
  email: string;
  body: string;
}

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}
```

### Data Flow

1. **Posts List**: Page (Server Component) → Server Action → JSON file → Render
2. **Post Detail**: Page (Server Component) → Server Action → JSON file → Render with comments
3. **Contact Form**: Client Component → React Hook Form → Zod validation → Server Action → Toast feedback

---

## Tasks

### Phase 1: Setup & Dependencies

1. [ ] Install Tailwind CSS and configure
2. [ ] Install next-themes and configure ThemeProvider
3. [ ] Install React Hook Form and Zod
4. [ ] Install Lucide React icons
5. [ ] Create base Tailwind config with custom colors

### Phase 2: Layout Components

6. [ ] Create Header component with navigation
7. [ ] Create ThemeToggle component
8. [ ] Create Footer component
9. [ ] Create mobile navigation (hamburger menu)
10. [ ] Update RootLayout to include Header/Footer

### Phase 3: UI Components

11. [ ] Refactor Button component to use Tailwind
12. [ ] Create Input component
13. [ ] Create Textarea component
14. [ ] Create Card component
15. [ ] Create Skeleton component
16. [ ] Create Toast component and context

### Phase 4: Data Layer

17. [ ] Create posts.json with sample data (10 posts)
18. [ ] Create comments.json with sample data
19. [ ] Create Server Actions for fetching posts
20. [ ] Create Server Action for single post with comments
21. [ ] Update types/index.ts with Post, Comment types

### Phase 5: Pages

22. [ ] Redesign Home page with hero and features
23. [ ] Create About page
24. [ ] Create Posts list page with loading state
25. [ ] Create Post detail page with comments
26. [ ] Create Contact page with form

### Phase 6: Contact Form

27. [ ] Create Zod schema for contact form
28. [ ] Build ContactForm component with React Hook Form
29. [ ] Create Server Action for form submission
30. [ ] Integrate Toast for success/error feedback

### Phase 7: Testing

31. [ ] Write unit tests for new UI components
32. [ ] Write unit tests for Server Actions
33. [ ] Update E2E tests for new pages and flows
34. [ ] Verify all tests pass

### Phase 8: Polish

35. [ ] Accessibility audit and fixes
36. [ ] Responsive design verification
37. [ ] Performance check (Lighthouse)
38. [ ] Update README with new features

---

## Out of Scope

- Database integration (using local JSON only)
- User authentication
- Real email sending from contact form
- Internationalization (i18n)
- Analytics integration
- SEO meta tags beyond basics
- PWA features
- Image optimization beyond Next.js defaults

## Open Questions

- [x] Styling approach? **Tailwind CSS**
- [x] Data source? **Local JSON + Server Actions**
- [x] Theme library? **next-themes**
- [x] Form library? **React Hook Form + Zod**

## Dependencies

- None (greenfield)

## Enables

- Future specs for authentication, database integration, etc.
