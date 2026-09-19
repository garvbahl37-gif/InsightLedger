// Thin Lucide set. Stroke weight is kept light so icons sit at the same visual
// weight as the text around them rather than shouting over it.
import {
  Search, Moon, Sun, FileText, X, Check, Command, Menu, Plus,
  ChevronRight, CircleDot, ArrowRight, ArrowUpRight,
} from "lucide-react";

const MAP = {
  search: Search, moon: Moon, sun: Sun, doc: FileText, file: FileText,
  x: X, check: Check, command: Command, menu: Menu, plus: Plus,
  chev: ChevronRight, dot: CircleDot, arrow: ArrowRight, arrowup: ArrowUpRight,
  spark: FileText,
};

export const Icon = ({ name, size = 16, strokeWidth = 1.5, ...rest }) => {
  const C = MAP[name] || CircleDot;
  return <C size={size} strokeWidth={strokeWidth} {...rest} />;
};
