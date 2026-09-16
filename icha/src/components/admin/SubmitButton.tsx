"use client";
import { useFormStatus } from "react-dom";
import ui from "@/app/admin/admin.module.css";

export function SubmitButton({ children, pendingText = "처리 중…", className = "", name, value, disabled }: { children: React.ReactNode; pendingText?: string; className?: string; name?: string; value?: string; disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" name={name} value={value} className={`${ui.button} ${className}`} disabled={pending || disabled}>
      {pending ? pendingText : children}
    </button>
  );
}
