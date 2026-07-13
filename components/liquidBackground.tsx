export default function LiquidBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div
        className="absolute -left-[10vw] -top-[10vw] h-[50vw] w-[50vw] rounded-full bg-white/40 blur-[120px]"
        style={{ animation: "liquid-float-1 18s ease-in-out infinite" }}
      />
      <div
        className="absolute -right-[8vw] top-[20vh] h-[45vw] w-[45vw] rounded-full bg-white/30 blur-[140px]"
        style={{ animation: "liquid-float-2 22s ease-in-out infinite" }}
      />
      <div
        className="absolute -bottom-[12vw] left-[15vw] h-[55vw] w-[55vw] rounded-full bg-zinc-600/30 blur-[130px]"
        style={{ animation: "liquid-float-3 25s ease-in-out infinite" }}
      />
      <div
        className="absolute left-[30vw] -top-[5vw] h-[40vw] w-[40vw] rounded-full bg-white/20 blur-[100px]"
        style={{ animation: "liquid-float-4 20s ease-in-out infinite reverse" }}
      />
    </div>
  );
}
