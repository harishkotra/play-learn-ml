import { useRef, useEffect, useState, useCallback } from "react";
import * as d3 from "d3";
import { generateCircles } from "../../utils/datasets";
import DefinitionGuide, { LiveHint } from "../../components/DefinitionGuide";
import LevelSystem, { useLevelSystem } from "../../components/LevelSystem";

const W = 700,
  H = 500;
const MARGIN = { top: 30, right: 30, bottom: 30, left: 30 };
const IW = W - MARGIN.left - MARGIN.right;
const IH = H - MARGIN.top - MARGIN.bottom;
const xScale = d3.scaleLinear().domain([-1, 1]).range([0, IW]);
const yScale = d3.scaleLinear().domain([1, -1]).range([0, IH]);
const CLASS_COLORS = ["#6c63ff", "#ff6b9d"];
const JUROR_COLORS = [
  "#45e6c0",
  "#ffd93d",
  "#ff8c42",
  "#a78bfa",
  "#f472b6",
  "#34d399",
];

const LEVELS = [
  {
    title: "Meet the Jury",
    objective:
      "Click on the colored lines in the chart to toggle jurors on/off. Try at least 3!",
    hint: "Click the dashed colored lines directly on the chart, or use the buttons in the sidebar.",
  },
  {
    title: "Beat the Best",
    objective: "Get ensemble accuracy higher than any single juror's accuracy.",
    hint: "Start with one juror, note its accuracy, then activate 2+ more to beat it.",
  },
  {
    title: "Majority Power",
    objective: "Achieve >90% accuracy using majority voting.",
    hint: "Activate 4+ jurors and use 'Majority' voting. More voices = smarter crowd.",
  },
  {
    title: "Unanimous Force",
    objective: "Achieve >85% accuracy using unanimous voting (harder!).",
    hint: "With unanimous mode, ALL must agree. Select jurors that mostly agree on the same class.",
  },
  {
    title: "Perfect Ensemble",
    objective: "Achieve >95% accuracy with any voting method.",
    hint: "Activate all 6 jurors and try all 3 voting methods. Find which combo works best!",
  },
];

function generateJurors() {
  const types = ["horiz", "vert", "diag1", "diag2"];
  const names = [
    "The Splitter",
    "The Cutter",
    "The Diag",
    "The Cross",
    "The Boxer",
    "The Angler",
  ];
  return Array.from({ length: 6 }, (_, i) => ({
    id: i,
    name: names[i],
    type: types[i % 4],
    threshold: (Math.random() - 0.5) * 1.2,
    active: i < 3,
    color: JUROR_COLORS[i],
  }));
}

function computeJurorDecision(juror, x, y) {
  switch (juror.type) {
    case "horiz":
      return y > juror.threshold ? 1 : 0;
    case "vert":
      return x > juror.threshold ? 1 : 0;
    case "diag1":
      return x + y > juror.threshold ? 1 : 0;
    case "diag2":
      return y - x > juror.threshold ? 1 : 0;
    case "quad1":
      return x * y > juror.threshold ? 1 : 0;
    case "quad2":
      return x * x + y * y > Math.abs(juror.threshold) * 0.5 + 0.3 ? 1 : 0;
    default:
      return 0;
  }
}

function ensembleDecision(jurors, x, y, method) {
  const votes = jurors
    .filter((j) => j.active)
    .map((j) => computeJurorDecision(j, x, y));
  if (votes.length === 0) return -1;
  if (method === "unanimous")
    return votes.every((v) => v === 1)
      ? 1
      : votes.every((v) => v === 0)
        ? 0
        : -1;
  return votes.filter((v) => v === 1).length > votes.length / 2 ? 1 : 0;
}

function jurorAccuracy(juror, points) {
  return (
    points.filter((p) => computeJurorDecision(juror, p.x, p.y) === p.label)
      .length / points.length
  );
}

export default function JuryRoom() {
  const svgRef = useRef(null);
  const [points] = useState(() => generateCircles(150, 0.08));
  const [jurors, setJurors] = useState(() => generateJurors());
  const [method, setMethod] = useState("majority");
  const [accuracy, setAccuracy] = useState(0);
  const [message, setMessage] = useState("");
  const [toggleCount, setToggleCount] = useState(0);
  const ls = useLevelSystem(5);

  const activeJurorsRef = useRef(jurors);
  activeJurorsRef.current = jurors;

  const toggleJuror = useCallback((id) => {
    setJurors((prev) =>
      prev.map((j) => (j.id === id ? { ...j, active: !j.active } : j)),
    );
    setToggleCount((c) => c + 1);
  }, []);

  const checkLevel = useCallback(
    (acc, currentMethod) => {
      const active = activeJurorsRef.current.filter((j) => j.active);
      const singleAccs = active.map((j) => jurorAccuracy(j, points));
      const bestSingle = Math.max(...singleAccs, 0);
      switch (ls.currentLevel) {
        case 1:
          if (toggleCount >= 3 && !ls.justCompleted) {
            ls.completeLevel();
            setMessage(
              "✅ Level 1! You've met the jury. Now beat the best juror (L2).",
            );
          }
          break;
        case 2:
          if (active.length >= 2 && acc > bestSingle && !ls.justCompleted) {
            ls.completeLevel();
            setMessage(
              "🎉 Level 2! Ensemble > individual! Now hit 90% with majority (L3).",
            );
          }
          break;
        case 3:
          if (currentMethod === "majority" && acc > 0.9 && !ls.justCompleted) {
            ls.completeLevel();
            setMessage(
              "🎉 Level 3! Majority power! Try unanimous at 85% (L4).",
            );
          }
          break;
        case 4:
          if (
            currentMethod === "unanimous" &&
            acc > 0.85 &&
            !ls.justCompleted
          ) {
            ls.completeLevel();
            setMessage(
              "🎉 Level 4! Unanimous is tough! Final: 95% with any method (L5).",
            );
          }
          break;
        case 5:
          if (acc > 0.95 && !ls.justCompleted) {
            ls.completeLevel();
            setMessage("🏆 All levels complete! You're an Ensemble master!");
          }
          break;
      }
    },
    [ls, toggleCount, points],
  );

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("svg > *").remove();
    const g = svg
      .append("g")
      .attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);
    g.append("rect")
      .attr("width", IW)
      .attr("height", IH)
      .attr("fill", "#1a1a2e")
      .attr("rx", 8);

    const surfaceGroup = g.append("g");
    const jurorGroup = g.append("g");
    const pointGroup = g.append("g");

    function render(showMsg) {
      const activeJurors = activeJurorsRef.current;

      surfaceGroup.selectAll("*").remove();
      const step = 4;
      for (let gx = 0; gx <= IW; gx += step) {
        for (let gy = 0; gy <= IH; gy += step) {
          const wx = xScale.invert(gx),
            wy = yScale.invert(gy);
          const d = ensembleDecision(activeJurors, wx, wy, method);
          if (d >= 0)
            surfaceGroup
              .append("rect")
              .attr("x", gx)
              .attr("y", gy)
              .attr("width", step)
              .attr("height", step)
              .attr("fill", d === 1 ? "#ff6b9d" : "#6c63ff")
              .attr("opacity", 0.08);
        }
      }

      const correct = points.filter(
        (p) => ensembleDecision(activeJurors, p.x, p.y, method) === p.label,
      ).length;
      const acc = correct / points.length;
      setAccuracy(acc);

      pointGroup
        .selectAll(".data-point")
        .data(points, (_, i) => i)
        .join("circle")
        .attr("cx", (d) => xScale(d.x))
        .attr("cy", (d) => yScale(d.y))
        .attr("r", 5)
        .attr("fill", (d) => CLASS_COLORS[d.label])
        .attr("opacity", 0.7)
        .attr("stroke", "#fff")
        .attr("stroke-width", 0.5);

      jurorGroup.selectAll("*").remove();
      activeJurors.forEach((j) => {
        const gJuror = jurorGroup
          .append("g")
          .attr("class", "juror-line")
          .attr("cursor", "pointer");
        const c = j.color;
        let x1, y1, x2, y2;
        switch (j.type) {
          case "horiz":
            x1 = 0;
            y1 = yScale(j.threshold);
            x2 = IW;
            y2 = yScale(j.threshold);
            break;
          case "vert":
            x1 = xScale(j.threshold);
            y1 = 0;
            x2 = xScale(j.threshold);
            y2 = IH;
            break;
          case "diag1":
            x1 = xScale(-1);
            y1 = yScale(j.threshold + 1);
            x2 = xScale(1);
            y2 = yScale(j.threshold - 1);
            break;
          case "diag2":
            x1 = xScale(-1);
            y1 = yScale(-j.threshold - 1);
            x2 = xScale(1);
            y2 = yScale(-j.threshold + 1);
            break;
          case "quad1":
          case "quad2":
            x1 = 0;
            y1 = 0;
            x2 = IW;
            y2 = IH;
            break;
        }

        const line = gJuror
          .append("line")
          .attr("x1", x1)
          .attr("y1", y1)
          .attr("x2", x2)
          .attr("y2", y2)
          .attr("stroke", c)
          .attr("stroke-width", j.active ? 3 : 0)
          .attr("stroke-dasharray", j.active ? "6,4" : "0")
          .attr("opacity", j.active ? 0.7 : 0)
          .attr("cursor", "pointer");

        const hitArea = gJuror
          .append("line")
          .attr("x1", x1)
          .attr("y1", y1)
          .attr("x2", x2)
          .attr("y2", y2)
          .attr("stroke", "transparent")
          .attr("stroke-width", 20)
          .attr("cursor", "pointer");

        const bgArea = gJuror
          .append("rect")
          .attr("x", 0)
          .attr("y", 0)
          .attr("width", IW)
          .attr("height", IH)
          .attr("fill", "transparent")
          .attr("cursor", "pointer");

        gJuror.on("click", () => toggleJuror(j.id));

        gJuror.on("mouseenter", () => {
          line
            .transition()
            .duration(150)
            .attr("stroke-width", 5)
            .attr("opacity", 1);
          if (!j.active) line.attr("stroke-width", 3).attr("opacity", 0.5);
        });
        gJuror.on("mouseleave", () => {
          line
            .transition()
            .duration(150)
            .attr("stroke-width", j.active ? 3 : 0)
            .attr("opacity", j.active ? 0.7 : 0);
        });

        const label = gJuror
          .append("text")
          .attr("x", (x1 + x2) / 2)
          .attr("y", (y1 + y2) / 2 - 8)
          .attr("text-anchor", "middle")
          .attr("fill", c)
          .attr("font-size", 9)
          .attr("font-weight", "bold")
          .attr("opacity", j.active ? 0.8 : 0)
          .text(j.active ? j.name : "");
      });

      if (showMsg) {
        const active = activeJurors.filter((j) => j.active);
        if (active.length === 1) {
          const best = Math.max(
            ...active.map((j) => jurorAccuracy(j, points)),
            0,
          );
          setMessage(
            `👤 "${active[0].name}" alone: ${(best * 100).toFixed(0)}%. Click more juror lines to add their voice!`,
          );
        } else if (active.length >= 2) {
          const bestSingle = Math.max(
            ...active.map((j) => jurorAccuracy(j, points)),
            0,
          );
          setMessage(
            `👥 ${active.length} jurors | Ensemble: ${(acc * 100).toFixed(0)}% | Best alone: ${(bestSingle * 100).toFixed(0)}%. ${acc > bestSingle ? "The ensemble wins! 🎉" : "Add more diverse jurors to beat the best individual."}`,
          );
        }
        checkLevel(acc, method);
      }
    }

    render(true);
  }, [jurors, method, points, toggleJuror, toggleCount, checkLevel]);

  const activeCount = jurors.filter((j) => j.active).length;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <span>⚖️</span> Jury Room — Ensemble Learning
          </h1>
          <p className="text-workshop-muted text-sm">
            <strong>Ensembles</strong> combine weak models into one strong
            model. <strong>Click the colored lines</strong> on the chart to
            toggle jurors!
          </p>
        </div>
        <span className="text-xs text-workshop-muted bg-workshop-surface px-3 py-1 rounded-full border border-workshop-border">
          Level {ls.currentLevel}/5
        </span>
      </div>
      <div className="flex gap-6">
        <div style={{ width: W, height: H }}>
          <svg ref={svgRef} width={W} height={H} className="rounded-xl" />
        </div>
        <div className="w-72 space-y-4 shrink-0">
          <LevelSystem
            levels={LEVELS}
            currentLevel={ls.currentLevel}
            completedLevels={ls.completedLevels}
            onSelectLevel={ls.selectLevel}
            onComplete={ls.completeLevel}
            justCompleted={ls.justCompleted}
            onNext={ls.goNext}
          />
          <DefinitionGuide
            title="What are Ensemble Techniques?"
            definition={`**Ensemble learning** combines multiple "weak learners" into one strong model.\n\n**Wisdom of the crowd**: a group of imperfect predictors voting together can be nearly perfect.\n\nFamous examples: Random Forest (bagging), Gradient Boosting (boosting).`}
            how={`Each colored line on the chart is a **juror** (weak classifier) with a simple rule: "Is Y > 0.2?" or "Is X + Y > 0?"\n\nAlone: ~60-75% accuracy. But when they **vote together**, the decision boundary (colored background) becomes more accurate.`}
            why={`Ensembles dominate ML competitions. They reduce overfitting, handle edge cases better, and almost always outperform single models. Random Forest and XGBoost are go-to tools.`}
            what={`**Click the colored dashed lines** on the chart to toggle jurors. Try different voting methods. Watch how the background decision boundary improves with more jurors.`}
          />
          <div className="bg-workshop-surface rounded-xl p-4 border border-workshop-border">
            <div className="flex justify-between text-xs text-workshop-muted mb-2">
              <span>Ensemble accuracy</span>
              <span className="font-mono text-workshop-text">
                {(accuracy * 100).toFixed(1)}%
              </span>
            </div>
            <div className="h-2 bg-workshop-bg rounded-full overflow-hidden mb-3">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${accuracy * 100}%`,
                  background:
                    accuracy > 0.9
                      ? "#45e6c0"
                      : accuracy > 0.75
                        ? "#ffd93d"
                        : "#ff6b9d",
                }}
              />
            </div>
            <p className="text-[10px] text-workshop-muted mb-2">
              Click lines on the chart, or use buttons:
            </p>
            <div className="space-y-1 mb-3">
              {jurors.map((j) => {
                const acc = jurorAccuracy(j, points);
                return (
                  <button
                    key={j.id}
                    onClick={() => toggleJuror(j.id)}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-all ${j.active ? "bg-workshop-accent/10 border border-workshop-accent/20" : "bg-workshop-bg border border-workshop-border opacity-50 hover:opacity-80"}`}
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ background: j.color }}
                    />
                    <div className="flex-1 text-left">
                      <span className="text-workshop-text text-[11px]">
                        {j.name}
                      </span>
                      <span className="text-workshop-muted ml-1">
                        ({(acc * 100).toFixed(0)}%)
                      </span>
                    </div>
                    <span className="text-[10px] font-mono">
                      {j.active ? "✓ ON" : "OFF"}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="flex gap-1.5">
              {["majority", "unanimous", "weighted"].map((m) => (
                <button
                  key={m}
                  onClick={() => setMethod(m)}
                  className={`flex-1 px-2 py-1.5 rounded-lg text-[10px] cursor-pointer transition-colors ${method === m ? "bg-workshop-accent/20 text-workshop-accent border border-workshop-accent/30" : "bg-workshop-bg text-workshop-muted border border-workshop-border"}`}
                >
                  {m === "majority"
                    ? "Majority"
                    : m === "unanimous"
                      ? "Unanimous"
                      : "Weighted"}
                </button>
              ))}
            </div>
          </div>
          {message && <LiveHint>{message}</LiveHint>}
        </div>
      </div>
    </div>
  );
}
