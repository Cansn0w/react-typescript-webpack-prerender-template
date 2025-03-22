import * as React from "react";
import { AppData } from "types";

/**
 * Important: ensure this function has no side effect for server side rendering.
 */
export function createApp(data: AppData) {
  return (
    <React.StrictMode>
      <h1>{data.content}</h1>
    </React.StrictMode>
  );
}
