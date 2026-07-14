'use client'

import { useEffect } from "react";
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

  useEffect(() => {
    // All handles are scoped to this effect invocation so cleanup can always
    // cancel them. The previous version deferred init() with an untracked
    // double rAF, so a fast unmount (nav to owner, Strict Mode, quick route
    // change) ran cleanup while the instance was still null — nothing was
    // destroyed — then the pending init() fired after unmount, leaking an
    // orphaned Lenis (live raf loop + wheel listener) that fought for scroll.
    let cancelled = false;
    let deferId = 0;
    let loopId = 0;
    let lenis: Lenis | null = null;

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
    };

    deferId = requestAnimationFrame(() => {
      deferId = requestAnimationFrame(init);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(deferId);
      cancelAnimationFrame(loopId);
      lenis?.destroy();
      lenis = null;
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
