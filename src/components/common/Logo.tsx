

export default function Logo() {
  const letters = [
    { char: "s", color: "border-gray-100", number: 16 },
    { char: "q", color: "border-yellow-300", number: 0 },
    { char: "o", color: "border-green-400", number: 8 },
    { char: "o", color: "border-green-400", number: 8 },
    { char: "li", color: "border-orange-400", number: 3 }, // combined box
  ];

  return (
    <div className="flex items-center justify-center gap-3 p-2 rounded-md">
      {/* Greek delta symbol */}
      <span className="text-primary text-5xl font-semibold italic">δ</span>

      {/* Letter tiles */}
      <div className="flex gap-1">
        {letters.map((l, index) => (
          <div
            key={index}
            className={`relative flex items-center justify-center w-12 h-12 rounded-md  border-2 ${l.color}`}
          >
            <span className="absolute top-0.5 left-1 text-[10px] text-muted-foreground font-medium">
              {l.number}
            </span>
            <span className="text-primary text-3xl font-semibold tracking-tight">
              {l.char}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
