import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import LanguageSwitcher from "./LanguageSwitcher";
import { useLanguage } from "../utils/LanguageContext";

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
  {
    path: "/logistic-regression",
    label: "Probability Seesaw",
    icon: "⚖️",
    desc: "Logistic Regression",
  },
  { path: "/pca", label: "Shadow Puppets", icon: "🎭", desc: "PCA" },
  { path: "/svm", label: "Tug-of-War", icon: "🤼", desc: "SVM" },
  {
    path: "/naive-bayes",
    label: "Spam or Not",
    icon: "📧",
    desc: "Naive Bayes",
  },
  {
    path: "/tsne",
    label: "Unfolding Origami",
    icon: "🦋",
    desc: "t-SNE / UMAP",
  },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { locale, setLocale } = useLanguage();

  return (
    <div className="flex min-h-screen">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-10 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <nav
        className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 fixed md:static z-20 w-64 bg-workshop-surface border-r border-workshop-border p-4 flex flex-col shrink-0 transition-transform duration-200 h-full md:h-auto overflow-y-auto`}
      >
        <NavLink
          to="/"
          className="text-xl font-bold text-workshop-accent3 mb-6 no-underline flex items-center justify-between"
        >
          <span>🎮 Play &amp; Learn ML</span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-workshop-muted text-lg cursor-pointer"
          >
            ✕
          </button>
        </NavLink>

        <div className="flex flex-col gap-0.5 flex-1">
          {modules.map((m) => (
            <NavLink
              key={m.path}
              to={m.path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm no-underline transition-colors ${
                  isActive
                    ? "bg-workshop-accent/20 text-workshop-accent border border-workshop-accent/30"
                    : "text-workshop-muted hover:bg-workshop-border/50 hover:text-workshop-text"
                }`
              }
            >
              <span className="text-lg">{m.icon}</span>
              <div>
                <div className="font-medium leading-tight">{m.label}</div>
                <div className="text-[10px] text-workshop-muted">{m.desc}</div>
              </div>
            </NavLink>
          ))}
        </div>

        <div className="pt-3 border-t border-workshop-border mt-3 space-y-2">
          <LanguageSwitcher locale={locale} onChange={setLocale} />
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

      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed top-3 left-3 z-30 md:hidden bg-workshop-surface border border-workshop-border rounded-lg p-2 text-workshop-muted cursor-pointer"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M3 5h14M3 10h14M3 15h14" />
        </svg>
      </button>

      <main className="flex-1 p-4 md:p-6 overflow-auto pt-14 md:pt-6 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
