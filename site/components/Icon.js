import {
  Activity, ArrowRight, ChevronDown, BarChart3, Bot, Brain, Briefcase, Calculator, CalendarCheck, Check, Clock, Code2, Compass,
  Cpu, Database, Download, Eye, Eye as Vision, Factory, FileText, GraduationCap, Globe, Handshake, HeartPulse,
  Landmark, Layers, LineChart, Lightbulb, Lock, Mail, MessageSquare, Mic, Package, Phone, Radar, RefreshCw, Rocket,
  ScanLine, Scale, Search, Settings2, ShieldCheck, ShoppingCart, Smartphone, Sparkles, Stethoscope, Target,
  TrendingUp, Trophy, Truck, Users, Workflow, Zap, Sun, Moon,
} from "lucide-react";

const map = {
  activity: Activity, arrow: ArrowRight, chevron: ChevronDown, chart: BarChart3, bot: Bot, brain: Brain, briefcase: Briefcase,
  calculator: Calculator, calendar: CalendarCheck, check: Check, clock: Clock, code: Code2, compass: Compass,
  cpu: Cpu, database: Database, download: Download, eye: Eye, factory: Factory, file: FileText,
  graduation: GraduationCap, globe: Globe, handshake: Handshake, heart: HeartPulse, landmark: Landmark,
  layers: Layers, line: LineChart, bulb: Lightbulb, lock: Lock, mail: Mail, message: MessageSquare, mic: Mic,
  package: Package, phone: Phone, radar: Radar, refresh: RefreshCw, rocket: Rocket, scan: ScanLine, scale: Scale,
  search: Search, settings: Settings2, shield: ShieldCheck, cart: ShoppingCart, mobile: Smartphone,
  sparkles: Sparkles, stethoscope: Stethoscope, target: Target, trend: TrendingUp, trophy: Trophy, truck: Truck,
  users: Users, workflow: Workflow, zap: Zap, sun: Sun, moon: Moon,
};

export default function Icon({ name, size = 22, className = "", strokeWidth = 1.8 }) {
  const C = map[name] || Sparkles;
  return <C size={size} strokeWidth={strokeWidth} className={className} aria-hidden="true" />;
}

/** Soft gradient tile holding an icon. `i` cycles through the pastel tints. */
export function IconTile({ name, i = 0, size = 22 }) {
  return (
    <span className={`icon tint-${(i % 6) + 1}`}>
      <Icon name={name} size={size} />
    </span>
  );
}
