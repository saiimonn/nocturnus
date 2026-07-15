export default function LiquidBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-black">
      <div
        className="absolute -left-[10%] -top-[20%] h-[60vw] w-[60vw] rounded-full blur-[80px]"
        style={{
          background: "radial-gradient(circle, rgba(255,0,255,0.1) 0%, rgba(255,0,255,0) 70%)",
          animation: "sweep 20s infinite ease-in-out reverse",
        }}
      />
      <div
        className="absolute right-[-20%] top-[30%] h-[50vw] w-[50vw] rounded-full blur-[100px]"
        style={{
          background: "radial-gradient(circle, rgba(0,255,255,0.15) 0%, rgba(0,255,255,0) 70%)",
          animation: "sweep 15s infinite ease-in-out",
        }}
      />
      <div
        className="absolute -bottom-[30%] left-[20%] h-[70vw] w-[70vw] rounded-full blur-[120px]"
        style={{
          background: "radial-gradient(circle, rgba(138,43,226,0.1) 0%, rgba(138,43,226,0) 70%)",
          animation: "sweep 18s infinite ease-in-out 3s",
        }}
      />
    </div>
  );
}
