import * as React from "react";

/**
 * Important: ensure this function has no side effect for server side rendering.
 */
export function createApp({ content }: { content: string }) {
  return (
    <React.StrictMode>
      <h1>{content}</h1>
    </React.StrictMode>
  );
}
