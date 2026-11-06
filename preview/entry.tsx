import { ExampleCard } from "./example/ExampleCard";

// CRODOX PATCH TARGET: replace this module's import and JSX with the selection.
// Keep one default export that returns the component with valid example props.
export default function Preview() {
  return (
    <ExampleCard
      title="Your component, in its own environment."
      description="This example has typed props, React state, an imported helper, a CSS module, and a public asset. Replace it through preview/entry.tsx."
      initialCount={3}
    />
  );
}
