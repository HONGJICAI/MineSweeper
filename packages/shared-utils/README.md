# @caiji-games/shared-utils

Shared utility functions for Caiji Games workspace.

## Functions

### Math Utilities

```typescript
import { formatTime, randomBetween, shuffleArray, clamp, isDefined } from '@caiji-games/shared-utils';

// Format time duration
formatTime(65000); // "1:05"
formatTime(3661000); // "1:01:01"

// Generate random numbers
randomBetween(1, 10); // Random number between 1 and 10

// Shuffle arrays
shuffleArray([1, 2, 3, 4, 5]); // [3, 1, 5, 2, 4]

// Type guards
isDefined(value); // true if value is not null/undefined
```

### Function Utilities

```typescript
import { debounce, throttle, deepClone } from '@caiji-games/shared-utils';

// Debounce function calls
const debouncedSearch = debounce((query: string) => {
  console.log('Searching for:', query);
}, 300);

// Deep clone objects
const cloned = deepClone(originalObject);
```

## Installation

Add to your package.json:

```json
{
  "dependencies": {
    "@caiji-games/shared-utils": "workspace:*"
  }
}
```

## Development

```bash
# Build
pnpm run build

# Watch mode
pnpm run dev
```
