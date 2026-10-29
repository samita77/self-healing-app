import type { SelectHTMLAttributes } from "react";
import { inputClass } from "./Input";
export default function Select({ className = "", ...props }: SelectHTMLAttributes<HTMLSelectElement>) { return <select className={`${inputClass} ${className}`} {...props} />; }
