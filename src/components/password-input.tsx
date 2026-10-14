"use client";

import { useState, type ComponentProps } from "react";

export function PasswordInput({ className = "", ...props }: Omit<ComponentProps<"input">, "type">) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input {...props} type={visible ? "text" : "password"} className={`w-full pr-16 ${className}`} />
      <button type="button" aria-label={visible ? "Hide password" : "Show password"} aria-pressed={visible}
        onClick={() => setVisible((value) => !value)}
        className="absolute inset-y-0 right-0 min-w-14 rounded-control px-3 text-xs font-semibold text-brand-dark">
        {visible ? "Hide" : "Show"}
      </button>
    </div>
  );
}
