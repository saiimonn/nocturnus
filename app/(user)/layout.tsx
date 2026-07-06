'use client'

import Nav from "@/components/UserNav";
import Footer from "@/components/footer";
import Lenis from 'lenis';

// Initialize Lenis with type-safe options
const lenis = new Lenis({
  duration: 1.2,
  easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Default easing
  orientation: 'vertical',
  gestureOrientation: 'vertical',
  smoothWheel: true,
  wheelMultiplier: 1,
  touchMultiplier: 2,
});

// Create the animation frame loop
function raf(time: number): void {
  lenis.raf(time);
  requestAnimationFrame(raf);
}

// Start the loop
requestAnimationFrame(raf);


export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col text-white bg-linear-to-b from-black to-[#141414]">
      <Nav />
      <div className="flex-1 flex flex-col">{children}</div>
      <Footer />
    </div>
  );
}
