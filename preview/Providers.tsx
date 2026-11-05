import type { PropsWithChildren } from "react";

// Wrap children with the selected component's router, theme, query client,
// store, authentication fixtures, or other context providers as required.
export function PreviewProviders({ children }: PropsWithChildren) {
  return <>{children}</>;
}
