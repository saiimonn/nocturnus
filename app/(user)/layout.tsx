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
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let deferId = 0;
    let loopId = 0;
    let lenis: Lenis | null = null;
    let resizeObserver: ResizeObserver | null = null;

    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';

    const init = () => {
      if (cancelled) return;

      lenis = new Lenis({
        duration: 1.2,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 2,
      });

      const raf = (time: number): void => {
        lenis?.raf(time);
        loopId = requestAnimationFrame(raf);
      };

      loopId = requestAnimationFrame(raf);
      lenis.scrollTo(0, { immediate: true });

      // Lenis autoResize observes document.documentElement, whose box size
      // (the viewport) never changes when content loads — only scrollHeight
      // does, which ResizeObserver doesn't watch. Observe the actual content
      // container instead, since its height grows when cards/images render.
      if (contentRef.current) {
        resizeObserver = new ResizeObserver(() => {
          lenis?.resize();
        });
        resizeObserver.observe(contentRef.current);
      }

      // Safety net: re-measure after a delay to catch any content that
      // finishes loading after the observer's initial callback.
      setTimeout(() => {
        if (!cancelled) lenis?.resize();
      }, 1000);
      setTimeout(() => {
        if (!cancelled) lenis?.resize();
      }, 2500);
    };

    deferId = requestAnimationFrame(() => {
      deferId = requestAnimationFrame(init);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(deferId);
      cancelAnimationFrame(loopId);
      resizeObserver?.disconnect();
      lenis?.destroy();
      lenis = null;
      resizeObserver = null;
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
        <div ref={contentRef} className="flex flex-1 flex-col">{children}</div>
        <Footer />
      </div>
    </div>
  );
}
