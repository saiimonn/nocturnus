

export default function Footer() {
  return (
    <footer className="w-full border-t border-[#1a1a1a] py-10 px-6 md:px-12 flex flex-col md:flex-row justify-between items-center text-[10px] text-[#666] gap-6">
      <div className="font-bold text-white text-xl tracking-tighter">OTUS</div>
      <div className="tracking-widest font-mono">© 2026 OTUS CEBU</div>
      <div className="flex gap-6 tracking-widest font-mono">
        <a href="#" className="hover:text-white transition-colors">PRIVACY</a>
        <a href="#" className="hover:text-white transition-colors">TERMS</a>
        <a href="#" className="hover:text-white transition-colors">CONTACT</a>
        <a href="#" className="hover:text-white transition-colors">INSTAGRAM</a>
      </div>
    </footer>
  )
}