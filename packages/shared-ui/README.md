# @caiji-games/shared-ui

A shared UI component library for Caiji Games workspace.

## Components

### DarkModeToggle

A toggle component that allows users to switch between light and dark themes. It automatically:
- Detects user's system preference on first load
- Saves theme preference to localStorage
- Applies appropriate CSS classes to the document root

#### Usage

```tsx
import { DarkModeToggle } from '@caiji-games/shared-ui';

function App() {
  return (
    <div>
      <DarkModeToggle />
      {/* Your app content */}
    </div>
  );
}
```

#### Requirements

- Tailwind CSS with dark mode support
- The component expects dark mode classes like `dark:bg-gray-800`, `dark:text-white`, etc.

## Development

### Building the package

```bash
pnpm run build
```

### Development mode (watch mode)

```bash
pnpm run dev
```

### Adding new components

1. Create your component in `src/components/`
2. Export it in `src/index.ts`
3. Build the package
4. The component will be available for import in other workspace packages

## Installation in workspace packages

Add to your package.json dependencies:

```json
{
  "dependencies": {
    "@caiji-games/shared-ui": "workspace:*"
  }
}
```

Then run `pnpm install` in your workspace root.
