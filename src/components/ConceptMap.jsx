import { useNavigate } from "react-router-dom";

const modules = [
  {
    path: "/linear-regression",
    icon: "〰️",
    title: "Stretchy Rope",
    subtitle: "Linear Regression",
    color: "border-workshop-accent",
    bg: "bg-workshop-accent/10",
    desc: "Drag data points and feel the rope tension. Watch how SSE elastic bands stretch as you find the line of best fit.",
  },
  {
    path: "/decision-trees",
    icon: "🌳",
    title: "20 Questions",
    subtitle: "Decision Trees",
    color: "border-workshop-accent2",
    bg: "bg-workshop-accent2/10",
    desc: "Split data with yes/no questions and watch a tree grow like a branching plant. Find the purest splits.",
  },
  {
    path: "/k-means",
    icon: "🧲",
    title: "Magnetic Clusters",
    subtitle: "K-Means",
    color: "border-workshop-accent3",
    bg: "bg-workshop-accent3/10",
    desc: "Place magnets (centroids) and watch data points snap into clusters. Clean up the mess!",
  },
  {
    path: "/ensemble",
    icon: "⚖️",
    title: "Jury Room",
    subtitle: "Ensemble Techniques",
    color: "border-workshop-accent4",
    bg: "bg-workshop-accent4/10",
    desc: "Each weak classifier is a juror. Combine their votes to make better decisions than any one alone.",
  },
  {
    path: "/neural-networks",
    icon: "🧱",
    title: "Lego Blocks",
    subtitle: "Neural Networks",
    color: "border-workshop-border",
    bg: "bg-workshop-surface",
    desc: "Drag and connect layers like building blocks. Watch neurons glow as signals flow through your creation.",
  },
  {
    path: "/gradient-descent",
    icon: "🎢",
    title: "Roller Coaster",
    subtitle: "Gradient Descent",
    color: "border-workshop-accent2",
    bg: "bg-workshop-accent2/10",
    desc: "Watch a ball roll down the loss landscape as gradient descent finds the minimum. Adjust learning rate and momentum.",
  },
  {
    path: "/confusion-matrix",
    icon: "📋",
    title: "Sorting Machine",
    subtitle: "Confusion Matrix",
    color: "border-workshop-accent3",
    bg: "bg-workshop-accent3/10",
    desc: "Drag predictions into TP/TN/FP/FN bins. See how a confusion matrix reveals the types of errors a model makes.",
  },
  {
    path: "/overfitting",
    icon: "👑",
    title: "Emperor's Tailor",
    subtitle: "Overfitting Simulator",
    color: "border-workshop-accent4",
    bg: "bg-workshop-accent4/10",
    desc: "A tailor who perfectly fits the noise, not the signal. Watch how complex polynomial models overfit training data.",
  },
];

export default function ConceptMap() {
  const navigate = useNavigate();

  return (
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-12 mt-8">
        <h1 className="text-4xl font-bold mb-3">🎮 Play &amp; Learn ML</h1>
        <p className="text-workshop-muted text-lg max-w-2xl mx-auto">
          Learn machine learning concepts through physical metaphors and
          interactive play. No math formulas — just drag, snap, build, and
          discover.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {modules.map((m, i) => (
          <button
            key={m.path}
            onClick={() => navigate(m.path)}
            className={`${m.bg} border-2 ${m.color} rounded-xl p-6 text-left cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-${m.color}/20`}
          >
            <div className="flex items-start gap-4">
              <span className="text-3xl">{m.icon}</span>
              <div className="flex-1">
                <h2 className="text-xl font-bold mb-0.5">{m.title}</h2>
                <p className="text-workshop-muted text-xs mb-3">{m.subtitle}</p>
                <p className="text-workshop-text/80 text-sm leading-relaxed">
                  {m.desc}
                </p>
              </div>
              <div className="flex items-center gap-1 mt-1">
                {Array.from({ length: 3 }).map((_, s) => (
                  <span
                    key={s}
                    className={`text-lg ${s < 1 ? "text-workshop-accent4" : "text-workshop-border"}`}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-12 border-t border-workshop-border pt-8 text-center">
        <svg
          className="w-full max-w-3xl mx-auto"
          viewBox="0 0 800 60"
          fill="none"
        >
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="10"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#6c63ff" />
            </marker>
          </defs>
          <line
            x1="50"
            y1="30"
            x2="180"
            y2="30"
            stroke="#6c63ff"
            strokeWidth="2"
            markerEnd="url(#arrowhead)"
            opacity="0.5"
          />
          <line
            x1="230"
            y1="30"
            x2="360"
            y2="30"
            stroke="#6c63ff"
            strokeWidth="2"
            markerEnd="url(#arrowhead)"
            opacity="0.5"
          />
          <text
            x="115"
            y="20"
            fill="#6c63ff"
            fontSize="10"
            textAnchor="middle"
            opacity="0.6"
          >
            1 neuron
          </text>
          <text
            x="295"
            y="20"
            fill="#6c63ff"
            fontSize="10"
            textAnchor="middle"
            opacity="0.6"
          >
            building blocks
          </text>
          <circle cx="50" cy="30" r="8" fill="#6c63ff" />
          <circle cx="230" cy="30" r="8" fill="#6c63ff" />
          <circle cx="410" cy="30" r="8" fill="#6c63ff" />
          <text x="50" y="55" fill="#6c63ff" fontSize="11" textAnchor="middle">
            Linear
          </text>
          <text x="230" y="55" fill="#6c63ff" fontSize="11" textAnchor="middle">
            Neural
          </text>
          <text x="410" y="55" fill="#6c63ff" fontSize="11" textAnchor="middle">
            Full NN
          </text>
        </svg>
        <p className="text-workshop-muted text-sm mt-4">
          Each concept builds on the last — start with one neuron (linear
          regression) and work up to full neural networks!
        </p>
      </div>
    </div>
  );
}
