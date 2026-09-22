declare module 'scoretrack' {
  import type { ReactNode } from 'react';
  import type { MetaLead } from './lib/metaTracking';
  export function configureMetaPixel(config: { PIXEL_ID: string; LOCAL_DRY_RUN: boolean; VERBOSE: boolean }): void;
  export function MetaPixelProvider(props: { children: ReactNode }): ReactNode;
  export function MetaPixel(props: { pixelId: string }): ReactNode;
  export function useMetaPixel(): {
    trackLead: (data: MetaLead) => Promise<void>;
    trackLeadQualificado: (data: MetaLead) => Promise<void>;
  };
}
