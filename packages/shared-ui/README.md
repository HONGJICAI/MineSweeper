# @caiji-games/shared-ui

Shared Svelte 5 UI components for Caiji Games workspace.

## Components

- `Button` — variant/size aware button
- `EmojiBtn` — emoji-only button (light wrapper around the gray secondary style)
- `Modal` — overlay dialog with optional title
- `DarkModeToggle` — system-aware light/dark switch (persists to localStorage, toggles `.dark` on `<html>`)

## Usage

```svelte
<script lang="ts">
  import { Button, DarkModeToggle, Modal } from '@caiji-games/shared-ui';
</script>

<DarkModeToggle />
<Button onclick={() => alert('hi')}>Click</Button>
```

## Requirements

- Svelte 5 (uses runes)
- Tailwind CSS with a `dark` variant configured. Consumers should add the
  shared-ui source to their Tailwind `@source` so utility classes are scanned:

  ```css
  @import "tailwindcss";
  @source "../../shared-ui/src/";
  ```

## Adding components

1. Create the component in `src/components/Foo.svelte`
2. Re-export it from `src/index.ts`
