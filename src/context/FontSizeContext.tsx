import React, { createContext, useContext, useEffect, useState } from 'react';

export type FontSize = 'sm' | 'md' | 'lg' | 'xl';

export interface FontSizeContextType {
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
}

const FONT_SIZE_MAP: Record<FontSize, string> = {
  sm: '14px',
  md: '16px',
  lg: '18px',
  xl: '20px',
};

const FontSizeContext = createContext<FontSizeContextType | undefined>(undefined);

/**
 * Provider component for managing global font scale state.
 */
export function FontSizeProvider({ children }: { children: React.ReactNode }) {
  const [fontSize, setFontSize] = useState<FontSize>(() => {
    const saved = localStorage.getItem('taxshield_font_size') as FontSize;
    if (saved && ['sm', 'md', 'lg', 'xl'].includes(saved)) {
      return saved;
    }
    return 'md';
  });

  useEffect(() => {
    localStorage.setItem('taxshield_font_size', fontSize);
    const pxSize = FONT_SIZE_MAP[fontSize] || '16px';
    document.documentElement.style.fontSize = pxSize;
  }, [fontSize]);

  return (
    <FontSizeContext.Provider value={{ fontSize, setFontSize }}>
      {children}
    </FontSizeContext.Provider>
  );
}

/**
 * Custom hook to consume the FontSizeContext.
 */
export function useFontSize(): FontSizeContextType {
  const context = useContext(FontSizeContext);
  if (!context) {
    throw new Error('useFontSize must be used within a FontSizeProvider');
  }
  return context;
}
