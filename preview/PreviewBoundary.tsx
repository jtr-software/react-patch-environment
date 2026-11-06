import { Component, type PropsWithChildren } from "react";

export function PreviewFailure({ error }: { error: unknown }) {
  const message = error instanceof Error ? error.stack || error.message : String(error);

  return (
    <section className="crodox-host-error" role="alert">
      <h1>The component could not render</h1>
      <p>Check its imports, example props, providers, and browser setup.</p>
      <pre>{message}</pre>
      <button type="button" onClick={() => window.location.reload()}>
        Reload preview
      </button>
    </section>
  );
}

export class PreviewBoundary extends Component<
  PropsWithChildren,
  { error: unknown; failed: boolean }
> {
  state = { error: null as unknown, failed: false };

  static getDerivedStateFromError(error: unknown) {
    return { error, failed: true };
  }

  render() {
    return this.state.failed ? (
      <PreviewFailure error={this.state.error} />
    ) : (
      this.props.children
    );
  }
}
