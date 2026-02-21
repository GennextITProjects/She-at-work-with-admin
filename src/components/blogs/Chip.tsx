import { motion } from "framer-motion";
import { COLOR_MAP } from "./helper";
import { X } from "lucide-react";
export function Chip({
  children,
  color,
  icon,
  onRemove,
}: {
  children: React.ReactNode;
  color: string;
  icon: React.ReactNode;
  onRemove: () => void;
}) {
  return (
    <motion.span
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${COLOR_MAP[color] ?? COLOR_MAP.primary}`}
    >
      {icon}
      {children}
      <button
        onClick={onRemove}
        className="ml-1 rounded-full p-0.5 transition-colors"
      >
        <X className="h-3 w-3" />
      </button>
    </motion.span>
  );
}