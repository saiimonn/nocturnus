'use client'

import Nav from "@/components/UserNav";
import Footer from "@/components/footer";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <Nav />
      <div className="flex-1 flex flex-col">{children}</div>
      <Footer />
    </div>
  );
}
