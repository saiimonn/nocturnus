'use client'

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Nav from "@/components/UserNav";
import Footer from "@/components/footer";
import LiquidBackground from '@/components/liquidBackground';
import Lenis from 'lenis';


export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    lenisRef.current = lenis;

    let rafId = 0;
    const raf = (time: number): void => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };

    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  useEffect(() => {
    const lenis = lenisRef.current;
    if (!lenis) return;
    lenis.scrollTo(0, { immediate: true });
    requestAnimationFrame(() => {
      lenis.resize();
    });
  }, [pathname]);

  return (
    <div className="relative min-h-screen flex-col overflow-hidden bg-black text-white">
      <LiquidBackground />
      <div className="relative z-10 flex min-h-screen flex-col">
        <Nav />
        <div className="flex flex-1 flex-col">{children}</div>
        <Footer />
      </div>
    </div>
  );
}
