// Lucide icon layer. Keeps the existing <Icon name="..." /> API used across
// components while rendering consistent-stroke Lucide icons (no filled icons).
import {
  Plus, Search, Sparkles, Moon, Sun, FileText, Layers3, Target, Zap,
  ChevronRight, X, Check, TriangleAlert, BookOpen, ShieldCheck, Command,
  SlidersHorizontal, Calendar, Cpu, Database, Activity, TrendingUp, Building2,
  ArrowUpRight, Gauge, Bot, CircleDot, LineChart, ListFilter, Braces,
  PanelLeftClose, PanelLeft, Quote,
} from "lucide-react";

const MAP = {
  plus: Plus, search: Search, spark: Sparkles, sparkles: Sparkles, moon: Moon, sun: Sun,
  doc: FileText, file: FileText, layers: Layers3, target: Target, bolt: Zap, zap: Zap,
  chev: ChevronRight, chevron: ChevronRight, x: X, check: Check, warn: TriangleAlert,
  book: BookOpen, shield: ShieldCheck, command: Command, filter: ListFilter,
  sliders: SlidersHorizontal, calendar: Calendar, cpu: Cpu, database: Database,
  activity: Activity, trend: TrendingUp, building: Building2, arrow: ArrowUpRight,
  gauge: Gauge, bot: Bot, dot: CircleDot, chart: LineChart, braces: Braces,
  "panel-close": PanelLeftClose, "panel-open": PanelLeft, quote: Quote,
};

export const Icon = ({ name, size = 16, strokeWidth = 1.75, ...rest }) => {
  const C = MAP[name] || CircleDot;
  return <C size={size} strokeWidth={strokeWidth} {...rest} />;
};
