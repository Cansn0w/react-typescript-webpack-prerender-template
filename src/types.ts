declare global {
  interface Window {
    bootstrap: Bootstrap | undefined;
  }
}

export enum RenderMode {
  CLIENT = "c",
  SERVER = "s",
}

export type AppData = { content: string };

/**
 * Data object to share state between server side and client side
 */
export type Bootstrap = {
  data: AppData;
  mode: RenderMode;
};
