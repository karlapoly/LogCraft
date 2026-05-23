import { lazy, Suspense } from "react";

const PhaserGameHost = lazy(() =>
  import("./PhaserGameHost").then((module) => ({ default: module.PhaserGameHost }))
);

export function App() {
  return (
    <main className="app-shell">
      <Suspense fallback={<div className="phaser-host" />}>
        <PhaserGameHost />
      </Suspense>
    </main>
  );
}
