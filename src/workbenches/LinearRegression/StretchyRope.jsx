import { useRef, useEffect, useState } from "react";
import * as d3 from "d3";
import { computeOLS } from "./regression";
import DefinitionGuide, { LiveHint } from "../../components/DefinitionGuide";
import LevelSystem, { useLevelSystem } from "../../components/LevelSystem";

const W = 700,
  H = 500;
const MARGIN = { top: 30, right: 30, bottom: 30, left: 30 };
const IW = W - MARGIN.left - MARGIN.right;
const IH = H - MARGIN.top - MARGIN.bottom;
const xScale = d3.scaleLinear().domain([-120, 120]).range([0, IW]);
const yScale = d3.scaleLinear().domain([120, -120]).range([0, IH]);

const LEVELS = [
  {
    title: "Feel the Rope",
    objective:
      "Drag any data point and watch the rope (regression line) stretch. See SSE change in real time.",
    hint: "Click and drag a blue dot. Watch the line and the SSE number update.",
  },
  {
    title: "Good Fit",
    objective: "Reach R² > 0.85 by arranging points close to the line.",
    hint: "Drag points closer to where the line wants to be. Green residuals = small error!",
  },
  {
    title: "Master Fitter",
    objective: "Get SSE below 200 — a very tight fit.",
    hint: "Place points nearly on the line. Use the R² meter to guide you.",
  },
  {
    title: "Outlier Proof",
    objective:
      "Add an outlier, then re-adjust points to get SSE back below 500.",
    hint: "Click 'Add Outlier' then drag other points to counteract its pull on the rope.",
  },
  {
    title: "Perfect Line",
    objective: "Achieve R² > 0.98 AND SSE < 100 simultaneously.",
    hint: "Every point must be almost exactly on the line. Precision counts!",
  },
];

function buildPoints() {
  return Array.from({ length: 25 }, (_, i) => ({
    x: Math.random() * 200 - 100,
    y: 15 + 0.6 * x + (Math.random() - 0.5) * 40,
    fx: 0,
    fy: 0,
    idx: i,
  }));
}

export default function StretchyRope() {
  const svgRef = useRef(null);
  const [points, setPoints] = useState(() => {
    const pts = [];
    for (let i = 0; i < 25; i++) {
      const x = Math.random() * 200 - 100;
      pts.push({
        x,
        y: 15 + 0.6 * x + (Math.random() - 0.5) * 40,
        fx: 0,
        fy: 0,
        idx: i,
      });
    }
    return pts;
  });
  const [sse, setSSE] = useState(0);
  const [r2, setR2] = useState(0);
  const [m, setM] = useState(0);
  const [b, setB] = useState(0);
  const [showElastic, setShowElastic] = useState(true);
  const [message, setMessage] = useState("");
  const [hasDragged, setHasDragged] = useState(false);
  const [hasAddedOutlier, setHasAddedOutlier] = useState(false);

  const ls = useLevelSystem(5);

  const updateStats = (pts) => {
    const result = computeOLS(pts);
    setSSE(result.sse);
    setR2(result.r2);
    setM(result.m);
    setB(result.b);
    return result;
  };

  const checkLevel = (pts) => {
    const { sse: s, r2: r } = computeOLS(pts);
    switch (ls.currentLevel) {
      case 1:
        if (hasDragged && !ls.justCompleted) {
          ls.completeLevel();
          setMessage(
            "✅ Level 1 complete! You felt the rope. Now try to get a good fit (L2).",
          );
        }
        break;
      case 2:
        if (r > 0.85 && !ls.justCompleted) {
          ls.completeLevel();
          setMessage(
            "🎉 Level 2! R² > 0.85 — great fit! Next up: squeeze SSE below 200.",
          );
        }
        break;
      case 3:
        if (s < 200 && !ls.justCompleted) {
          ls.completeLevel();
          setMessage(
            "🎉 Level 3! SSE under 200. Now add an outlier and try to recover (L4).",
          );
        }
        break;
      case 4:
        if (hasAddedOutlier && s < 500 && !ls.justCompleted) {
          ls.completeLevel();
          setMessage(
            "🎉 Level 4! You tamed the outlier. Final challenge: R² > 0.98 AND SSE < 100!",
          );
        }
        break;
      case 5:
        if (r > 0.98 && s < 100 && !ls.justCompleted) {
          ls.completeLevel();
          setMessage(
            "🏆 All levels complete! You're a Linear Regression master!",
          );
        }
        break;
    }
  };

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    const g = svg
      .append("g")
      .attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);
    const clip = g
      .append("defs")
      .append("clipPath")
      .attr("id", "plot-clip")
      .append("rect")
      .attr("width", IW)
      .attr("height", IH);
    const plotArea = g.append("g").attr("clip-path", "url(#plot-clip)");
    plotArea
      .append("rect")
      .attr("width", IW)
      .attr("height", IH)
      .attr("fill", "#1a1a2e")
      .attr("rx", 8);
    const elasticGroup = plotArea.append("g");
    const linesLayer = plotArea.append("g");

    function render(pts) {
      const result = computeOLS(pts);
      linesLayer.selectAll("*").remove();
      const confBand = linesLayer
        .append("path")
        .attr("fill", "#6c63ff")
        .attr("opacity", 0.1);
      const confD = [];
      for (let px = -120; px <= 120; px += 2) {
        const py = result.m * px + result.b;
        const spread = 15 + (result.sse / pts.length) * 0.5;
        confD.push(`${xScale(px)},${yScale(py - spread)}`);
      }
      for (let px = 120; px >= -120; px -= 2) {
        const py = result.m * px + result.b;
        const spread = 15 + (result.sse / pts.length) * 0.5;
        confD.push(`${xScale(px)},${yScale(py + spread)}`);
      }
      confBand.attr("d", `M${confD.join("L")}Z`);
      const minX = Math.min(...pts.map((p) => p.x)),
        maxX = Math.max(...pts.map((p) => p.x));
      const pad = (maxX - minX) * 0.1 || 10;
      const lx1 = minX - pad,
        ly1 = result.m * lx1 + result.b;
      const lx2 = maxX + pad,
        ly2 = result.m * lx2 + result.b;

      linesLayer
        .selectAll(".rope-line")
        .data([null])
        .join("line")
        .attr("class", "rope-line")
        .transition()
        .duration(200)
        .attr("x1", xScale(lx1))
        .attr("y1", yScale(ly1))
        .attr("x2", xScale(lx2))
        .attr("y2", yScale(ly2))
        .attr("stroke", "#6c63ff")
        .attr("stroke-width", 3)
        .attr("stroke-linecap", "round");

      linesLayer
        .append("text")
        .attr("x", 10)
        .attr("y", 18)
        .attr("fill", "#6c63ff")
        .attr("font-size", 11)
        .attr("font-family", "monospace")
        .text(`y = ${result.m.toFixed(2)}x + ${result.b.toFixed(1)}`);

      if (showElastic) {
        const residLines = elasticGroup
          .selectAll(".resid-line")
          .data(pts, (d) => d.idx);
        residLines.exit().remove();
        residLines
          .enter()
          .append("line")
          .attr("class", "resid-line")
          .merge(residLines)
          .transition()
          .duration(200)
          .attr("x1", (d) => xScale(d.x))
          .attr("y1", (d) => yScale(d.y))
          .attr("x2", (d) => xScale(d.x))
          .attr("y2", (d) => yScale(result.m * d.x + result.b))
          .attr("stroke", (d) => {
            const resid = Math.abs(d.y - (result.m * d.x + result.b));
            const maxR =
              d3.max(pts, (p) => Math.abs(p.y - (result.m * p.x + result.b))) ||
              1;
            return d3.interpolateRgb("#45e6c0", "#ff6b9d")(resid / maxR);
          })
          .attr("stroke-width", 2)
          .attr("stroke-dasharray", "4,3")
          .attr("opacity", 0.6);
      } else elasticGroup.selectAll(".resid-line").remove();

      const pointsBound = plotArea
        .selectAll(".data-point")
        .data(pts, (d) => d.idx);
      pointsBound.exit().remove();
      const pointsEnter = pointsBound
        .enter()
        .append("circle")
        .attr("class", "data-point");
      pointsEnter
        .merge(pointsBound)
        .attr("cx", (d) => xScale(d.x))
        .attr("cy", (d) => yScale(d.y))
        .attr("r", 6)
        .attr("fill", (d) => (d.highlight ? "#ffd93d" : "#6c63ff"))
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5)
        .attr("cursor", "grab")
        .attr("opacity", (d) => (d.highlight ? 1 : 0.85));

      pointsEnter.call(
        d3
          .drag()
          .on("start", function () {
            d3.select(this).attr("stroke-width", 3).attr("cursor", "grabbing");
          })
          .on("drag", function (event, d) {
            const rect = svgRef.current.getBoundingClientRect();
            d.x = xScale.invert(
              Math.max(
                0,
                Math.min(
                  IW,
                  event.sourceEvent.clientX - rect.left - MARGIN.left,
                ),
              ),
            );
            d.y = yScale.invert(
              Math.max(
                0,
                Math.min(IH, event.sourceEvent.clientY - rect.top - MARGIN.top),
              ),
            );
            render(pts);
          })
          .on("end", function () {
            d3.select(this).attr("stroke-width", 1.5).attr("cursor", "grab");
            const updated = points.map((p) => ({ ...p }));
            setPoints(updated);
            const r = computeOLS(updated);
            setSSE(r.sse);
            setR2(r.r2);
            setM(r.m);
            setB(r.b);
            if (!hasDragged) setHasDragged(true);
            checkLevel(updated);
          }),
      );
    }
    render(points);
    return () => {
      svg.selectAll("*").remove();
    };
  }, [showElastic]);

  useEffect(() => {
    if (points.length) updateStats(points);
  }, [points]);

  const handleReset = () => {
    const pts = [];
    for (let i = 0; i < 25; i++) {
      const x = Math.random() * 200 - 100;
      pts.push({
        x,
        y: 15 + 0.6 * x + (Math.random() - 0.5) * 40,
        fx: 0,
        fy: 0,
        idx: i,
      });
    }
    setPoints(pts);
    setHasDragged(false);
    setHasAddedOutlier(false);
    setMessage("");
    ls.reset();
  };

  const addOutlier = () => {
    const outlier = {
      x: (Math.random() - 0.5) * 180,
      y: 40 + (Math.random() - 0.5) * 100,
      fx: 0,
      fy: 0,
      idx: Date.now(),
      highlight: true,
    };
    setPoints((prev) => [...prev, outlier]);
    setHasAddedOutlier(true);
    if (ls.currentLevel === 4)
      setMessage(
        "🔥 Outlier added! Now re-adjust other points to get SSE below 500 to complete L4.",
      );
    else setMessage("🔥 Outlier added! Notice how it pulls the rope.");
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <span>〰️</span> Stretchy Rope — Linear Regression
          </h1>
          <p className="text-workshop-muted text-sm">
            <strong>Linear Regression</strong> finds the line that best predicts
            Y from X. Drag points to see the rope stretch.
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
            title="What is Linear Regression?"
            definition={`**Linear Regression** models the relationship between Y and X by fitting: **y = mx + b**\n\n- **m** = slope (change in Y per unit X)\n- **b** = intercept (Y when X = 0)\n- Goal: minimize SSE (sum of squared vertical distances)`}
            how={`The "rope" is the regression line. Each point pulls on it like a spring.\n\n1. **Drag a point** — rope stretches to follow\n2. **SSE** — residuals (dashed lines) are squared and summed\n3. **R²** — how much variance the line explains\n\nGreen residuals = small error. Pink = large.`}
            why={`Foundation of all ML. Used for: sales forecasting, scientific research, economics, trend analysis.\n\nSimple, interpretable, fast — you can read the equation and understand the relationship immediately.`}
            what={`Try: drag points close to the line, add outliers, toggle residuals. Watch the equation y=mx+b update in real time.`}
          />
          <div className="bg-workshop-surface rounded-xl p-4 border border-workshop-border">
            <div className="font-mono text-workshop-accent text-sm font-bold mb-2">
              y = {m.toFixed(2)}x + {b.toFixed(1)}
            </div>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs text-workshop-muted mb-1">
                  <span>SSE ↓ better</span>
                  <span className="font-mono text-workshop-text">
                    {sse.toFixed(0)}
                  </span>
                </div>
                <div className="h-2 bg-workshop-bg rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, (sse / 2000) * 100)}%`,
                      background:
                        sse < 300
                          ? "#45e6c0"
                          : sse < 800
                            ? "#ffd93d"
                            : "#ff6b9d",
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-workshop-muted mb-1">
                  <span>R² ↑ better</span>
                  <span className="font-mono text-workshop-text">
                    {r2.toFixed(3)}
                  </span>
                </div>
                <div className="h-2 bg-workshop-bg rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.max(0, Math.min(100, r2 * 100))}%`,
                      background:
                        r2 > 0.8 ? "#45e6c0" : r2 > 0.5 ? "#ffd93d" : "#ff6b9d",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="bg-workshop-surface rounded-xl p-4 border border-workshop-border">
            <div className="flex gap-2">
              <button
                onClick={handleReset}
                className="flex-1 px-3 py-2 bg-workshop-accent/20 border border-workshop-accent/30 text-workshop-accent rounded-lg text-xs cursor-pointer hover:bg-workshop-accent/30 transition-colors"
              >
                Reset All
              </button>
              <button
                onClick={addOutlier}
                className="flex-1 px-3 py-2 bg-workshop-accent2/20 border border-workshop-accent2/30 text-workshop-accent2 rounded-lg text-xs cursor-pointer hover:bg-workshop-accent2/30 transition-colors"
              >
                Add Outlier
              </button>
            </div>
            <label className="flex items-center gap-2 text-xs text-workshop-muted cursor-pointer mt-2">
              <input
                type="checkbox"
                checked={showElastic}
                onChange={(e) => setShowElastic(e.target.checked)}
                className="accent-workshop-accent"
              />
              Show residuals
            </label>
          </div>
          {message && <LiveHint>{message}</LiveHint>}
        </div>
      </div>
    </div>
  );
}
