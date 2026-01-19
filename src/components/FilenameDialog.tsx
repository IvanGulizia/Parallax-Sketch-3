
import React, { useState, useEffect, useRef } from 'react';

interface FilenameDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (name: string) => void;
    defaultValue?: string;
}

export const FilenameDialog: React.FC<FilenameDialogProps> = ({ isOpen, onClose, onConfirm, defaultValue = "zen-sketch" }) => {
    const [value, setValue] = useState(defaultValue);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setValue(defaultValue);
            // Small timeout to ensure DOM is ready and animation started
            setTimeout(() => {
                inputRef.current?.focus();
                inputRef.current?.select();
            }, 50);
        }
    }, [isOpen, defaultValue]);

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-in fade-in duration-200" 
            onClick={onClose}
        >
            <div 
                className="bg-[var(--menu-bg)] w-full max-w-sm p-6 rounded-3xl shadow-2xl border border-[var(--border-color)] scale-100 animate-in zoom-in-95 duration-200 flex flex-col gap-4"
                onClick={e => e.stopPropagation()}
            >
                <div>
                    <h3 className="text-lg font-bold text-[var(--text-color)]">Save Drawing</h3>
                    <p className="text-xs text-[var(--secondary-text)] mt-1">Export your creation as a JSON file.</p>
                </div>
                
                <div className="relative">
                    <input
                        ref={inputRef}
                        type="text"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') onConfirm(value);
                            if (e.key === 'Escape') onClose();
                        }}
                        className="w-full px-4 py-3 rounded-xl bg-[var(--tool-bg)] border border-[var(--border-color)] text-[var(--text-color)] focus:outline-none focus:border-[var(--active-color)] transition-colors font-medium placeholder-[var(--secondary-text)]"
                        placeholder="Enter filename..."
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[var(--secondary-text)] opacity-50 pointer-events-none">.json</span>
                </div>

                <div className="flex gap-3 mt-2">
                    <button 
                        onClick={onClose}
                        className="flex-1 py-3 rounded-xl border border-[var(--button-border)] text-[var(--text-color)] font-medium hover:bg-[var(--secondary-bg)] transition-colors text-sm"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={() => onConfirm(value)}
                        className="flex-1 py-3 rounded-xl bg-[var(--active-color)] text-white font-bold hover:opacity-90 transition-opacity text-sm shadow-sm"
                    >
                        Download
                    </button>
                </div>
            </div>
        </div>
    );
};
