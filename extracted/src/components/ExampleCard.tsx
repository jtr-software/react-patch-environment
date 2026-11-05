import { useState } from "react";
import { formatCount } from "../lib/formatCount";
import styles from "./ExampleCard.module.css";

export type ExampleCardProps = {
  title: string;
  description: string;
  initialCount?: number;
};

export function ExampleCard({ title, description, initialCount = 0 }: ExampleCardProps) {
  const [count, setCount] = useState(initialCount);

  return (
    <main className={styles.stage}>
      <article className={styles.card}>
        <img className={styles.mark} src="/preview-mark.svg" alt="" width="48" height="48" />
        <p className={styles.eyebrow}>CRODOX / COMPONENT PREVIEW</p>
        <h1>{title}</h1>
        <p className={styles.description}>{description}</p>
        <div className={styles.controls}>
          <button type="button" onClick={() => setCount((current) => current + 1)}>
            Try an interaction <span aria-hidden="true">&rarr;</span>
          </button>
          <output aria-live="polite">{formatCount(count)}</output>
        </div>
        <p className={styles.footer}>React + TypeScript + Vite &middot; Ready for a patch</p>
      </article>
    </main>
  );
}
