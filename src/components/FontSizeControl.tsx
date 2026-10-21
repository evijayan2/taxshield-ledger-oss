import React, { useState, useRef, useEffect } from 'react';
import { Type, Check } from 'lucide-react';
import { useFontSize, FontSize } from '../context/FontSizeContext';

const FONT_OPTIONS: { id: FontSize; label: string; pxLabel: string }[] = [
  { id: 'sm', label: 'Small', pxLabel: '14px' },
  { id: 'md', label: 'Normal', pxLabel: '16px' },
  { id: 'lg', label: 'Large', pxLabel: '18px' },
  { id: 'xl', label: 'Extra Large', pxLabel: '20px' },
];

export function FontSizeControl() {
  const { fontSize, setFontSize } = useFontSize();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentOption = FONT_OPTIONS.find(o => o.id === fontSize) || FONT_OPTIONS[1];

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        type="button"
        title="Change Screen Font Size"
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
      >
        <Type className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
        <span className="font-semibold hidden sm:inline">{currentOption.label}</span>
        <span className="text-[10px] opacity-75 font-mono px-1 rounded bg-slate-200 dark:bg-slate-700">
          {currentOption.pxLabel}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-50 p-1 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-1.5 text-[11px] font-semibold tracking-wider text-slate-400 uppercase border-b border-slate-100 dark:border-slate-800 mb-1">
            Display Font Scale
          </div>
          {FONT_OPTIONS.map((option) => {
            const isSelected = option.id === fontSize;
            return (
              <button
                key={option.id}
                onClick={() => {
                  setFontSize(option.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{option.label}</span>
                  <span className="text-[10px] text-slate-400 font-mono">({option.pxLabel})</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
