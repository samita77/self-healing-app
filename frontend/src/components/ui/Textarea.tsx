import type { TextareaHTMLAttributes } from "react";
import { inputClass } from "./Input";
export default function Textarea({ className = "", ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) { return <textarea className={`${inputClass} min-h-24 resize-y ${className}`} {...props} />; }
