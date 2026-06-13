import { NavLink, Outlet } from "react-router-dom";

const modules = [
  {
    path: "/linear-regression",
    label: "Stretchy Rope",
    icon: "〰️",
    desc: "Linear Regression",
  },
  {
    path: "/decision-trees",
    label: "20 Questions",
    icon: "🌳",
    desc: "Decision Trees",
  },
  { path: "/k-means", label: "Magnetic Clusters", icon: "🧲", desc: "K-Means" },
  { path: "/ensemble", label: "Jury Room", icon: "⚖️", desc: "Ensemble" },
  {
    path: "/neural-networks",
    label: "Lego Blocks",
    icon: "🧱",
    desc: "Neural Networks",
  },
  {
    path: "/gradient-descent",
    label: "Roller Coaster",
    icon: "🎢",
    desc: "Gradient Descent",
  },
  {
    path: "/confusion-matrix",
    label: "Sorting Machine",
    icon: "📋",
    desc: "Confusion Matrix",
  },
  {
    path: "/overfitting",
    label: "Emperor's Tailor",
    icon: "👑",
    desc: "Overfitting",
  },
];

export default function Layout() {
  return (
    <div className="flex min-h-screen">
      <nav className="w-64 bg-workshop-surface border-r border-workshop-border p-4 flex flex-col shrink-0">
        <NavLink
          to="/"
          className="text-xl font-bold text-workshop-accent3 mb-8 no-underline"
        >
          🎮 Play &amp; Learn ML
        </NavLink>
        <div className="flex flex-col gap-1 flex-1">
          {modules.map((m) => (
            <NavLink
              key={m.path}
              to={m.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm no-underline transition-colors ${
                  isActive
                    ? "bg-workshop-accent/20 text-workshop-accent border border-workshop-accent/30"
                    : "text-workshop-muted hover:bg-workshop-border/50 hover:text-workshop-text"
                }`
              }
            >
              <span className="text-lg">{m.icon}</span>
              <div>
                <div className="font-medium">{m.label}</div>
                <div className="text-xs text-workshop-muted">{m.desc}</div>
              </div>
            </NavLink>
          ))}
        </div>

        <div className="pt-4 border-t border-workshop-border mt-4">
          <p className="text-[11px] text-workshop-muted leading-relaxed">
            Built by{" "}
            <a
              href="https://harishkotra.me"
              target="_blank"
              rel="noopener noreferrer"
              className="text-workshop-accent3 hover:underline"
            >
              Harish Kotra
            </a>
          </p>
          <p className="text-[11px] text-workshop-muted">
            <a
              href="https://dailybuild.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="text-workshop-accent hover:underline"
            >
              Check out my other builds →
            </a>
          </p>
        </div>
      </nav>
      <main className="flex-1 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
