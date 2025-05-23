'use client';

import { useState } from 'react';
import { useSidebar } from '@/contexts/SidebarContext';

export default function SidebarToggle() {
    const { isOpen, toggleSidebar } = useSidebar();
    const [isHovered, setIsHovered] = useState(false);

    return (
        <button
            onClick={toggleSidebar}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="flex items-center justify-center w-9 h-9 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 focus:outline-none shadow-sm hover:shadow-md"
            aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
        >
            <div className="relative w-5 h-5">
                {/* When sidebar is closed - show sidebar/menu icon */}
                {!isOpen && (
                    <div
                        className={`absolute inset-0 transition-all duration-200 ease-in-out ${
                            isHovered ? 'opacity-0 scale-90' : 'opacity-100 scale-100'
                        }`}
                    >
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-gray-700 dark:text-gray-200"
                        >
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                            <line x1="9" y1="3" x2="9" y2="21"/>
                        </svg>
                    </div>
                )}

                {/* Arrow - shows when hovered (closed) or when open */}
                <div
                    className={`absolute inset-0 transition-all duration-200 ease-in-out ${
                        isOpen
                            ? 'opacity-100 scale-100 rotate-180' // Open: always left arrow (no hover change)
                            : isHovered
                                ? 'opacity-100 scale-100 rotate-0'   // Closed + hover: right arrow (will open)
                                : 'opacity-0 scale-90'               // Closed: hidden
                    }`}
                >
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-gray-700 dark:text-gray-200"
                    >
                        <polyline points="9,18 15,12 9,6"/>
                    </svg>
                </div>
            </div>
        </button>
    );
}