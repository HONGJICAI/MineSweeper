# @caiji-games/shared-hooks

Shared React hooks for Caiji Games workspace.

## Hooks

### useInterval

Clean interval management with automatic cleanup.

```typescript
import { useInterval } from '@caiji-games/shared-hooks';

function Timer() {
  const [count, setCount] = useState(0);
  
  useInterval(() => {
    setCount(count + 1);
  }, 1000); // Update every second

  // Pass null to pause
  useInterval(() => {
    console.log('This won\'t run');
  }, null);

  return <div>Count: {count}</div>;
}
```

### useIdle

Detect when user is idle (no mouse/keyboard activity).

```typescript
import { useIdle } from '@caiji-games/shared-hooks';

function Game() {
  const isIdle = useIdle(10000); // 10 seconds

  return (
    <div>
      {isIdle && <div>Game paused - you seem idle</div>}
    </div>
  );
}
```

## Installation

Add to your package.json:

```json
{
  "dependencies": {
    "@caiji-games/shared-hooks": "workspace:*"
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
