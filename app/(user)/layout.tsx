'use client'

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Nav from "@/components/UserNav";
import Footer from "@/components/footer";
import LiquidBackground from '@/components/liquidBackground';
import CustomScrollbar from '@/components/customScrollbar';
import Lenis from 'lenis';

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const lenisRef = useRef<Lenis | null>(null);
  const rafRef = useRef(0);

  useEffect(() => {
    if (lenisRef.current) {
      cancelAnimationFrame(rafRef.current);
      lenisRef.current.destroy();
      lenisRef.current = null;
    }

    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';

    const init = () => {
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

      const raf = (time: number): void => {
        lenis.raf(time);
        rafRef.current = requestAnimationFrame(raf);
      };

      rafRef.current = requestAnimationFrame(raf);
      lenis.scrollTo(0, { immediate: true });
    };

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        init();
      });
    });

    return () => {
      cancelAnimationFrame(rafRef.current);
      if (lenisRef.current) {
        lenisRef.current.destroy();
        lenisRef.current = null;
      }
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, [pathname]);

  return (
    <div className="relative min-h-screen flex-col overflow-x-hidden bg-black text-white">
      <LiquidBackground />
      <CustomScrollbar />
      <div className="relative z-10 flex min-h-screen flex-col">
        <Nav />
        <div className="flex flex-1 flex-col">{children}</div>
        <Footer />
      </div>
    </div>
  );
}
