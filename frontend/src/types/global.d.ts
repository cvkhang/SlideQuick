import React from 'react';

// Vite environment variables
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_SUPABASE_BUCKET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare global {
  namespace JSX {
    // map JSX.Element to React's element type
    type Element = React.ReactElement<any, any>;
    // allow any intrinsic elements (simple fallback)
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

export { };
