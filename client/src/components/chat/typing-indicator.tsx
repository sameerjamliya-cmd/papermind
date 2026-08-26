"use client";

export function TypingIndicator() {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.3s]"
      />
      <span
        className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.15s]"
      />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" />
    </span>
  );
}