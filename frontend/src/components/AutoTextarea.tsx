"use client";

import { useEffect, useRef } from "react";

type AutoTextareaProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minRows?: number;
};

export function AutoTextarea({
  value,
  onChange,
  placeholder,
  className = "",
  minRows = 2,
}: AutoTextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }
    element.style.height = "auto";
    element.style.height = `${Math.max(element.scrollHeight, minRows * 24)}px`;
  }, [value, minRows]);

  return (
    <textarea
      ref={ref}
      value={value}
      rows={minRows}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      className={`w-full resize-none overflow-hidden border-0 bg-transparent text-[15px] leading-7 text-foreground outline-none placeholder:text-muted/60 focus:ring-0 ${className}`}
    />
  );
}
