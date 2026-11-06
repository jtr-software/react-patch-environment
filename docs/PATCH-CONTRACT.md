# Crodox patch output contract

Crodox creates the workbench from the environment repository and writes selected files at their original repository-relative paths. Choose `preview/entry.tsx` as the patch target that mounts the selection.

## Required output

| Output | Purpose |
| --- | --- |
| Original source paths, such as `src/components/Hero.tsx` | Selected module and its transitive source, asset, and type dependencies |
| `preview/entry.tsx` | Default-exported preview component that imports the selection and supplies fixture props/callbacks |
| Merged `package.json` | Source dependency versions plus the host's own build tools/scripts |
| Updated `package-lock.json` | Resolved combined dependency graph after installation |

The browser loads the host and selection in this order.

```text
index.html -> preview/main.tsx -> setupPreview() -> styles + providers + preview/entry.tsx
```

`preview/main.tsx` mounts the preview using React. This gives source entry files such as `src/main.tsx` their own paths in the workbench.

## Conditional output

| When the selection needs... | Patch/copy... |
| --- | --- |
| Source aliases or compiler options | Relevant options merged into the host's `tsconfig.json` |
| Global styles/fonts/theme | Imports in `preview/styles.css` and their dependency files |
| `/`-relative static assets | Required assets at their original paths under `public/` |
| Router/theme/query/store/auth context | `preview/Providers.tsx` and fixture state/routes |
| API mocks or browser globals | `preview/setup.ts` and mock handlers/fixtures |
| Public configuration | `.env.local` with only the values intended for the browser |
| Styling/compiler plugins or API proxies | `preview/vite.extensions.ts`, plugin configs, and packages |
| Workspace packages or generated code | Actual package sources/artifacts and adjusted package/config resolution |
| Portal target elements | Required containers in `index.html` |

For projects using `app/` or other source roots, preserve that layout and update the aliases. Merge required settings into host files such as `package.json` and `vite.config.ts` when source files share those paths.

## Suggested pipeline

1. Resolve the selected component's file, export name, and original repository-relative path.
2. Extract the needed declarations/imports plus their dependency closure. When declaration-level extraction is incomplete, retaining the relevant source modules is more reliable than emitting an isolated function body. Keep type dependencies for typechecking.
3. Keep the selected files at their original paths relative to the workbench root. Supply an export for the selected component if the source did not have one.
4. Generate `preview/entry.tsx` with an import and representative props. Use project fixtures or user-provided examples; prop types cannot determine valid auth state, meaningful data, or callback behavior.
5. Apply project adapter files for aliases, CSS, providers, mocks, and public assets. Include transitive dependencies from these adapter files too.
6. Merge external dependency declarations. Install after package changes. Preserve the host tooling rather than replacing the whole manifest with the original application's scripts.
7. Run `npm run typecheck` and `npm run build`. Open the preview and exercise interactions: successful bundling alone cannot verify provider requirements or API behavior.

When switching selections, update the entry and replace the prior extraction output as a unit. Remove stale files/dependency declarations no longer needed so they do not mask a missing extraction. The dependency importer only merges declarations; it does not remove stale packages.

## Minimal generated entry

```tsx
import SelectedComponent from "../src/components/SelectedComponent";

export default function Preview() {
  return <SelectedComponent />;
}
```

For a named export:

```tsx
import { Hero } from "@/components/Hero";

export default function Preview() {
  return <Hero />;
}
```

These are ordinary modules that Crodox can replace through its file-patch mechanism. This repository does not require a new Crodox template syntax.
