// Lightweight motion presets — CSS-based, no runtime dep required.
// Use with tailwind's animate-in utilities from tw-animate-css.
export const fadeRise = "animate-in fade-in-0 slide-in-from-bottom-2 duration-300";
export const fadeIn = "animate-in fade-in-0 duration-200";
export const stagger = (i: number) => ({ animationDelay: `${i * 40}ms` });
