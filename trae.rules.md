# TRAE Project Rules & Guidelines

## 📋 Table of Contents

- [Component Architecture](#component-architecture)
- [Code Quality Standards](#code-quality-standards)
- [File Structure Guidelines](#file-structure-guidelines)
- [Naming Conventions](#naming-conventions)
- [TypeScript Best Practices](#typescript-best-practices)
- [React/Next.js Patterns](#reactnextjs-patterns)
- [Styling Guidelines](#styling-guidelines)
- [Performance Guidelines](#performance-guidelines)
- [Testing Requirements](#testing-requirements)
- [Git Workflow](#git-workflow)

## 🏗️ Component Architecture

### Component Size Limit

- **Maximum 300 lines per component file** (including imports and exports)
- Split components when they exceed this limit
- Use composition over inheritance

### Component Responsibilities

- **Single Responsibility Principle**: Each component should have one primary purpose.
- **UI vs. Logic Separation**: Strictly separate presentation (UI) from business logic. Extract complex logic, state management, and side effects into custom hooks (`use...`) to keep components lean and focused on rendering.
- **Props Interface**: Define clear TypeScript interfaces for all component props
- **State Management**: Use local state for component-specific data, global state for shared data
- **Event Handling**: Keep event handlers in the component or lift them up when necessary

### Component Structure

```typescript
// Component file structure
createComponent/
├── index.ts           // Main export
├── Component.tsx      // Main component
├── Component.types.ts // TypeScript interfaces
├── Component.utils.ts // Utility functions
├── Component.test.tsx // Unit tests
└── Component.stories.tsx // Storybook stories (if applicable)
```

## 🎯 Code Quality Standards

### ESLint Rules (Enforced)

- **No console.log** (except warn/error)
- **No unused variables** (with \_ prefix exception)
- **No explicit any** (TypeScript)
- **Consistent imports** (ordered and grouped)
- **Accessibility rules** (alt text, ARIA attributes)
- **Max line length**: 120 characters

### Code Formatting

- **Indentation**: 2 spaces
- **Quotes**: Double quotes
- **Semicolons**: Always required
- **Trailing commas**: Always in multiline
- **Arrow functions**: Always use parentheses for parameters

### Code Comments

- **Minimal comments**: Write self-documenting code
- **JSDoc**: Use for public APIs and complex functions
- **TODO/FIXME**: Use sparingly and track in project management tool

### Continuous Integration

- **Run linter after changes**: After adding or modifying code, always run `npm run lint` to ensure code style consistency and catch potential errors early. This is also enforced via pre-commit hooks.

## 📁 File Structure Guidelines

### Directory Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Route groups
│   ├── (dashboard)/
│   ├── api/               # API routes
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── components/             # Reusable UI components
│   ├── ui/                # Base UI components
│   ├── forms/             # Form components
│   ├── layouts/           # Layout components
│   └── shared/            # Shared components
├── hooks/                  # Custom React hooks
├── lib/                    # Utility libraries
│   ├── utils/             # Utility functions
│   ├── api/               # API utilities
│   └── constants/         # App constants
├── types/                  # TypeScript type definitions
├── styles/                 # CSS modules and styles
└── public/                 # Static assets
```

### File Naming

- **Components**: PascalCase (e.g., `UserProfile.tsx`)
- **Utilities**: camelCase (e.g., `formatDate.ts`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_ENDPOINTS.ts`)
- **Test files**: `.test.tsx` or `.spec.tsx`
- **Type files**: `.types.ts`

## 🏷️ Naming Conventions

### Variables & Functions

```typescript
// Good
const userName = "John Doe";
const isLoading = true;
const handleSubmit = () => {};
const getUserData = async () => {};

// Bad
const username = "John Doe"; // Not camelCase
const loading = true; // Not descriptive
const submit = () => {}; // Not descriptive
const userData = async () => {}; // Not action-oriented
```

### Components

```typescript
// Good
interface UserProfileProps {
  userId: string;
  showDetails?: boolean;
}

export const UserProfile: React.FC<UserProfileProps> = ({ userId, showDetails = false }) => {
  // Component logic
};

// Bad
interface Props {
  // Too generic
  id: string; // Not descriptive
  show?: boolean; // Not descriptive
}

export default function UserProfileComponent(props: Props) {
  // Don't use 'Component' suffix
  // Component logic
}
```

## 🔧 TypeScript Best Practices

### Type Definitions

- **Strict `no-any` Policy**: The use of the `any` type is strictly forbidden. Use `unknown` for values with an unknown type and perform type checking. This is enforced by ESLint (`@typescript-eslint/no-explicit-any`).
- **Interface vs Type**: Use interface for object shapes, type for unions/primitives
- **Generic constraints**: Use meaningful constraints
- **Return types**: Explicitly define function return types

### Example

```typescript
// Good
interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

type UserRole = "admin" | "user" | "guest";

interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
}

const fetchUser = async (id: string): Promise<ApiResponse<User>> => {
  // Implementation
};

// Bad
type User = any; // Don't use any
interface UserData {
  // Too generic
  id: any;
  name: string;
}
```

## ⚛️ React/Next.js Patterns

### Hooks

```typescript
// Good - Custom hook with clear purpose
export const useUser = (userId: string) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await getUser(userId);
        setUser(data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  return { user, isLoading, error };
};

// Bad - Hook doing too much
export const useApp = () => {
  // Handles user, auth, theme, notifications, etc.
  // Too many responsibilities
};
```

### Server Components (Next.js 13+)

```typescript
// Good - Server component for data fetching
export default async function UserProfile({ params }: { params: { id: string } }) {
  const user = await getUser(params.id);

  return (
    <div>
      <h1>{user.name}</h1>
      <ClientComponent userId={user.id} />
    </div>
  );
}

// Bad - Fetching data in client component unnecessarily
"use client";

export default function UserProfile({ params }: { params: { id: string } }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchUser(params.id).then(setUser);
  }, [params.id]);

  // ...
}
```

## 🎨 Styling Guidelines

### Tailwind CSS

- **Utility-first**: Use Tailwind utilities over custom CSS
- **Responsive design**: Mobile-first approach
- **Custom components**: Create reusable Tailwind component classes
- **Dark mode**: Support dark mode variants

### Example

```typescript
// Good
<div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Title</h2>
  <Button variant="primary" size="sm">Action</Button>
</div>

// Bad
<div style={{ display: "flex", alignItems: "center" }}> // Don't use inline styles
  <h2 className="text-lg">Title</h2> // Missing responsive and dark mode classes
</div>
```

## ⚡ Performance Guidelines

### Optimization Techniques

- **Code splitting**: Use dynamic imports for large components
- **Image optimization**: Use Next.js Image component
- **Memoization**: Use React.memo, useMemo, useCallback appropriately
- **Bundle size**: Monitor and optimize bundle size
- **Lazy loading**: Implement lazy loading for images and components

### Example

```typescript
// Good - Optimized component
const HeavyComponent = dynamic(() => import("./HeavyComponent"), {
  loading: () => <Skeleton />,
  ssr: false,
});

const ExpensiveList = React.memo(({ items }: { items: Item[] }) => {
  const processedItems = useMemo(() =>
    items.map(item => processItem(item)),
    [items]
  );

  return (
    <ul>
      {processedItems.map(item => (
        <ListItem key={item.id} item={item} />
      ))}
    </ul>
  );
});

// Bad - No optimization
function ExpensiveList({ items }: { items: Item[] }) {
  const processedItems = items.map(item => processItem(item)); // No memoization

  return (
    <ul>
      {processedItems.map((item, index) => ( // Using index as key
        <ListItem item={item} />
      ))}
    </ul>
  );
}
```

## 🧪 Testing Requirements

### Test Structure

- **Unit tests**: Test individual functions and components
- **Integration tests**: Test component interactions
- **E2E tests**: Test critical user flows
- **Coverage**: Aim for >80% code coverage

### Testing Patterns

```typescript
// Good - Comprehensive component test
describe("UserProfile", () => {
  it("renders user information correctly", () => {
    const user = { id: "1", name: "John Doe", email: "john@example.com" };
    render(<UserProfile user={user} />);

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("john@example.com")).toBeInTheDocument();
  });

  it("handles loading state", () => {
    render(<UserProfile user={null} isLoading={true} />);
    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
  });

  it("handles error state", () => {
    render(<UserProfile user={null} error={new Error("User not found")} />);
    expect(screen.getByText("User not found")).toBeInTheDocument();
  });
});

// Bad - Incomplete test
describe("UserProfile", () => {
  it("works", () => {
    render(<UserProfile />);
    expect(true).toBe(true); // Not testing actual behavior
  });
});
```

## 🔄 Git Workflow

### Commit Messages

Follow conventional commits specification:

```
feat: add user authentication
fix: resolve navigation bug
docs: update API documentation
style: format code with prettier
refactor: reorganize component structure
test: add unit tests for user service
chore: update dependencies
```

### Branch Naming

```
feature/user-authentication
bugfix/navigation-issue
hotfix/critical-security-patch
docs/api-documentation
refactor/component-architecture
```

### Pre-commit Hooks (Enforced)

1. **ESLint**: Code linting and formatting
2. **TypeScript**: Type checking
3. **Tests**: Run unit tests
4. **Build**: Verify build succeeds

### Pre-push Hooks (Enforced)

1. **Lint**: Full linting check
2. **TypeScript**: Type checking
3. **Build**: Full build verification
4. **Tests**: Complete test suite

## 📏 Quality Metrics

### Code Quality Goals

- **ESLint**: Zero warnings/errors
- **TypeScript**: Zero type errors
- **Test Coverage**: >80%
- **Component Size**: <300 lines
- **Bundle Size**: Monitor and optimize
- **Performance**: Lighthouse score >90

### Review Checklist

- [ ] Code follows project conventions
- [ ] Components are under 300 lines
- [ ] TypeScript types are properly defined
- [ ] Tests are written and passing
- [ ] No console.log statements
- [ ] Responsive design implemented
- [ ] Accessibility standards met
- [ ] Performance optimized
- [ ] Documentation updated

## 🚨 Error Handling

### Error Boundaries

```typescript
// Good - Proper error boundary
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
    // Send to error monitoring service
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <ErrorFallback />;
    }

    return this.props.children;
  }
}
```

### API Error Handling

```typescript
// Good - Comprehensive error handling
const fetchUser = async (id: string): Promise<ApiResponse<User>> => {
  try {
    const response = await fetch(`/api/users/${id}`);

    if (!response.ok) {
      throw new ApiError(`HTTP ${response.status}`, response.status);
    }

    const data = await response.json();
    return { data, status: response.status, message: "Success" };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError("Network error", 0);
  }
};
```

---

**Remember**: These rules are enforced through ESLint, Prettier, and Husky hooks. Breaking these rules will prevent commits and pushes. When in doubt, refer to existing code patterns in the codebase.

## 🤖 TRAE Environment & Tooling

### Terminal Management

- **Reuse Terminals**: Prioritize reusing existing terminals for sequential tasks to avoid unnecessary resource allocation.
- **Parallel Tasks**: It is acceptable to use a new terminal for parallel tasks, especially for long-running processes like a development server (`npm run dev`), to avoid interrupting ongoing workflows.
