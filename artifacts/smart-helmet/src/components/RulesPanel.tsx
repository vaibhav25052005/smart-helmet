import { useState } from "react";
import {
  BookOpen, X, HardHat, FlaskConical, Eye, Gauge, AlertTriangle,
  ShieldCheck, ChevronDown, ChevronUp, Zap, Clock, Heart,
} from "lucide-react";

interface RuleSection {
  id: string;
  icon: React.ReactNode;
  title: string;
  color: string;
  iconBg: string;
  items: { heading: string; body: string }[];
}

const sections: RuleSection[] = [
  {
    id: "helmet",
    icon: <HardHat className="w-5 h-5" />,
    title: "Why Helmet is Important",
    color: "text-cyan-400",
    iconBg: "bg-cyan-900/50",
    items: [
      {
        heading: "Reduces Fatal Head Injuries by 70%",
        body: "Helmets are the single most effective protection against head injuries in motorcycle accidents. Studies show helmets reduce the risk of death by 37% and serious head injury by up to 69%.",
      },
      {
        heading: "Protects Your Brain",
        body: "The human skull alone cannot withstand typical crash impacts. Helmet foam absorbs and distributes the force of impact, protecting the brain from concussion, contusion, and skull fractures.",
      },
      {
        heading: "Shields Face & Eyes",
        body: "A full-face helmet protects from debris, insects, dust, rain, and road rash on the face — which accounts for many severe disfigurement injuries in crashes.",
      },
      {
        heading: "Provides Visibility to Others",
        body: "Bright or reflective helmets increase rider visibility to other road users by up to 24%, helping prevent collisions at intersections.",
      },
      {
        heading: "Legal Requirement",
        body: "Riding without a helmet is illegal in most countries. Penalties include heavy fines, license suspension, and increased liability in the event of an accident.",
      },
    ],
  },
  {
    id: "alcohol",
    icon: <FlaskConical className="w-5 h-5" />,
    title: "Alcohol & Riding Rules",
    color: "text-red-400",
    iconBg: "bg-red-900/50",
    items: [
      {
        heading: "Zero Tolerance Policy",
        body: "Many jurisdictions enforce zero-tolerance for alcohol while riding motorcycles. Even a small amount of alcohol significantly impairs reaction time, coordination, and judgment.",
      },
      {
        heading: "BAC Limit: 0.05% or Lower",
        body: "Most countries set the Blood Alcohol Concentration (BAC) limit at 0.05% for riders. At this level, reaction time slows by 25% and peripheral vision is impaired.",
      },
      {
        heading: "Alcohol Doubles Crash Risk",
        body: "A rider with a BAC of 0.05% is twice as likely to crash. At 0.08% the risk is 7 times higher. Alcohol-impaired riders account for over 30% of all fatal motorcycle crashes.",
      },
      {
        heading: "Penalties are Severe",
        body: "Penalties for drink-riding include: criminal charges, license cancellation, heavy fines, vehicle impoundment, imprisonment, and permanent riding ban.",
      },
      {
        heading: "Never Ride After Drinking",
        body: "If you've consumed alcohol, arrange alternative transport. The MQ3 sensor in your smart helmet will detect alcohol and disable the motor to keep you and others safe.",
      },
    ],
  },
  {
    id: "drowsy",
    icon: <Eye className="w-5 h-5" />,
    title: "Drowsiness & Fatigue",
    color: "text-amber-400",
    iconBg: "bg-amber-900/50",
    items: [
      {
        heading: "Fatigue Impairs Like Alcohol",
        body: "Being awake for 17 hours produces impairment equal to a BAC of 0.05%. After 24 hours, impairment equals a BAC of 0.10% — above the legal limit in most countries.",
      },
      {
        heading: "Microsleeps Are Fatal",
        body: "A microsleep (2-5 seconds) at 60 km/h means you travel 33-83 metres completely unconscious. On a motorcycle, this is almost always fatal.",
      },
      {
        heading: "Warning Signs",
        body: "Yawning repeatedly, heavy eyelids, drifting in lane, missing exits, and slow reaction are clear signs you must stop and rest immediately.",
      },
      {
        heading: "The 2-Hour Rule",
        body: "Take a 15-minute break every 2 hours of riding. Avoid riding between 12am–6am when drowsiness risk is highest due to the body's natural sleep cycle.",
      },
      {
        heading: "Stop & Rest",
        body: "If the drowsiness sensor triggers, pull over safely immediately. Do not attempt to 'push through'. Even a 20-minute nap dramatically restores alertness.",
      },
    ],
  },
  {
    id: "speed",
    icon: <Gauge className="w-5 h-5" />,
    title: "Speed & Traffic Rules",
    color: "text-emerald-400",
    iconBg: "bg-emerald-900/50",
    items: [
      {
        heading: "Obey Posted Speed Limits",
        body: "Speed limits are set based on road conditions, pedestrian activity, and crash statistics. Urban roads: 30-50 km/h. Rural roads: 80-100 km/h. Highways: 100-130 km/h.",
      },
      {
        heading: "Maintain Safe Following Distance",
        body: "Keep a minimum 2-second gap from the vehicle ahead. In wet conditions, double this to 4 seconds. At highway speeds, a 3-second gap is recommended for motorcycles.",
      },
      {
        heading: "Lane Discipline",
        body: "Stay in your lane. Lane splitting is only legal in specific jurisdictions and only at low speeds. Always signal before changing lanes and check blind spots.",
      },
      {
        heading: "Intersection Safety",
        body: "Intersections account for 40% of motorcycle accidents. Always slow down, look both ways, and never assume other drivers have seen you.",
      },
      {
        heading: "Night Riding Precautions",
        body: "At night, reduce speed by 20-30%, increase following distance, use high beam where safe, and ensure your helmet has reflective strips. Visibility is reduced by 75%.",
      },
    ],
  },
  {
    id: "motor",
    icon: <Zap className="w-5 h-5" />,
    title: "Motor & Smart Helmet System",
    color: "text-purple-400",
    iconBg: "bg-purple-900/50",
    items: [
      {
        heading: "Automatic Motor Cutoff",
        body: "The Smart Helmet System can cut motor power when safety rules are violated — helmet not worn, alcohol detected, or extreme drowsiness. This is a last-resort safety mechanism.",
      },
      {
        heading: "LED Warning System",
        body: "The helmet LED provides visual alerts to both the rider and other road users. A flashing LED indicates a safety rule violation detected by the system.",
      },
      {
        heading: "Buzzer Alerts",
        body: "The onboard buzzer provides audible warnings in real time. Different patterns indicate different violations — learn to recognise each pattern and respond immediately.",
      },
      {
        heading: "Distance Sensor Safety",
        body: "The ultrasonic distance sensor monitors proximity to objects ahead. An alert fires when an obstacle is detected within 20 cm — relevant for slow-speed maneuvering.",
      },
      {
        heading: "Always Check Your Helmet",
        body: "Before every ride: check the helmet fit sensor is detecting correctly, ensure the alcohol sensor is at baseline, and confirm all system indicators show green.",
      },
    ],
  },
  {
    id: "penalties",
    icon: <AlertTriangle className="w-5 h-5" />,
    title: "Legal Penalties",
    color: "text-orange-400",
    iconBg: "bg-orange-900/50",
    items: [
      {
        heading: "No Helmet: Heavy Fine",
        body: "Riding without a helmet typically results in fines ranging from ₹1,000–₹2,000 (India) or equivalent in other countries, plus points on your license.",
      },
      {
        heading: "Drink Riding: Criminal Offence",
        body: "Riding under the influence can result in criminal charges, 6-month license suspension for first offence, 2-year ban for repeat offences, and up to 6 months imprisonment.",
      },
      {
        heading: "Speeding Penalties",
        body: "Exceeding speed limits: warnings and fines for minor infractions, license suspension at 15+ km/h over, licence cancellation for extreme speeding.",
      },
      {
        heading: "Causing Harm While Impaired",
        body: "If you cause injury or death while impaired or helmetless, you face civil liability, criminal prosecution, permanent ban, and possible imprisonment of 2-7 years.",
      },
      {
        heading: "Insurance Implications",
        body: "Violations invalidate insurance coverage. If you crash while violating road rules, your insurer may refuse to pay claims, leaving you personally liable for all damages.",
      },
    ],
  },
];

function AccordionSection({ section }: { section: RuleSection }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`rounded-2xl border transition-all duration-300 ${
      open ? "border-slate-600/60 bg-slate-800/60" : "border-slate-700/40 bg-slate-800/30"
    } helmet-surface`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${section.iconBg}`}>
            <div className={section.color}>{section.icon}</div>
          </div>
          <span className={`font-bold text-sm text-white helmet-text-primary`}>{section.title}</span>
        </div>
        <div className="text-slate-400 helmet-text-secondary shrink-0 ml-2">
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3">
          <div className="w-full h-px bg-slate-700/50" />
          {section.items.map((item, i) => (
            <div key={i} className="flex gap-3">
              <div className={`w-1 rounded-full shrink-0 mt-1 ${section.color} opacity-60`} style={{ minHeight: "1rem" }} />
              <div>
                <p className={`text-sm font-semibold mb-0.5 ${section.color}`}>{item.heading}</p>
                <p className="text-xs text-slate-400 helmet-text-secondary leading-relaxed">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface RulesPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RulesPanel({ open, onOpenChange }: RulesPanelProps) {
  return (
    <>
      {/* Trigger */}
      <button
        onClick={() => onOpenChange(true)}
        className="helmet-btn-secondary flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700/60 text-slate-300 hover:text-white transition-all duration-200"
      >
        <BookOpen className="w-4 h-4" />
        <span>Rules</span>
      </button>

      {/* Full-screen modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-stretch">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
          <div className="relative w-full max-w-lg mx-auto my-0 sm:my-6 sm:rounded-2xl bg-slate-900 border border-slate-700/60 flex flex-col shadow-2xl z-10 helmet-notif-panel overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/60 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-cyan-900/40">
                  <ShieldCheck className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h2 className="font-black text-white helmet-text-primary text-lg">Road Safety Rules</h2>
                  <p className="text-xs text-slate-400 helmet-text-secondary">Helmet & Traffic Regulations</p>
                </div>
              </div>
              <button
                onClick={() => onOpenChange(false)}
                className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Safety banner */}
            <div className="mx-4 mt-4 shrink-0 rounded-xl bg-cyan-950/50 border border-cyan-800/50 p-3 flex items-start gap-3">
              <Heart className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <p className="text-xs text-cyan-300 leading-relaxed">
                <strong>Your safety is the priority.</strong> Every rule here exists to protect your life and the lives of others. The Smart Helmet System enforces these rules automatically.
              </p>
            </div>

            {/* Alert sound guide */}
            <div className="mx-4 mt-3 shrink-0 rounded-xl bg-slate-800/60 border border-slate-700/40 p-4 helmet-surface">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-amber-400" />
                <p className="text-xs font-bold uppercase tracking-widest text-amber-400">Alert Sound Guide</p>
              </div>
              <div className="space-y-2">
                {[
                  { label: "Helmet Not Worn", pattern: "▲▲▲ rapid ascending beeps", color: "text-red-400" },
                  { label: "Alcohol Detected", pattern: "●—●—●— urgent alternating tones", color: "text-red-400" },
                  { label: "Drowsiness", pattern: "◆ ◆ ◆ slow deep warning pulses", color: "text-amber-400" },
                  { label: "Obstacle Close", pattern: "▸▸▸ quick proximity chirps", color: "text-orange-400" },
                ].map((s) => (
                  <div key={s.label} className="flex items-center justify-between gap-3">
                    <span className={`text-xs font-semibold ${s.color}`}>{s.label}</span>
                    <span className="text-xs text-slate-500 font-mono helmet-text-muted">{s.pattern}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Accordion sections */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {sections.map((section) => (
                <AccordionSection key={section.id} section={section} />
              ))}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-slate-700/60 text-center shrink-0">
              <p className="text-xs text-slate-600 helmet-footer-text">
                Smart Helmet System • Safety First, Always
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
