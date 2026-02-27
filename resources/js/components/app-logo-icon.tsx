import type { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg {...props} viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="faso-grad-1" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#2563EB" />
                    <stop offset="100%" stopColor="#6D28D9" />
                </linearGradient>
                <linearGradient id="faso-grad-2" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#6D28D9" />
                    <stop offset="100%" stopColor="#A855F7" />
                </linearGradient>
                <linearGradient id="faso-grad-3" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#A855F7" />
                    <stop offset="100%" stopColor="#C026D3" />
                </linearGradient>
            </defs>
            {/* Bottom stripe - blue */}
            <path d="M4 34L20 26L36 34L20 42Z" fill="url(#faso-grad-1)" />
            {/* Middle stripe - purple */}
            <path d="M8 26L24 18L44 28L24 36Z" fill="url(#faso-grad-2)" />
            {/* Top stripe - magenta-purple */}
            <path d="M12 18L28 10L44 18L28 26Z" fill="url(#faso-grad-3)" />
        </svg>
    );
}
