import { useRef, useEffect, useState, useMemo, useCallback } from "react";
import * as d3 from "d3";
import DefinitionGuide, { LiveHint } from "../../components/DefinitionGuide";
import LevelSystem, { useLevelSystem } from "../../components/LevelSystem";

const W = 700,
  H = 500;
const MARGIN = { top: 30, right: 30, bottom: 30, left: 30 };
const IW = W - MARGIN.left - MARGIN.right;
const IH = H - MARGIN.top - MARGIN.bottom;
const xs = d3.scaleLinear().domain([-2, 2]).range([0, IW]);
const ys = d3.scaleLinear().domain([2, -2]).range([0, IH]);

function generateData(n = 20) {
  const pts = [];
  const class0Count = Math.floor(n / 2);
  for (let i = 0; i < class0Count; i++) {
    pts.push({
      x: -0.7 + (Math.random() - 0.5) * 0.6,
      y: (Math.random() - 0.5) * 1.2,
      label: 0,
    });
  }
  for (let i = class0Count; i < n; i++) {
    pts.push({
      x: 0.7 + (Math.random() - 0.5) * 0.6,
      y: (Math.random() - 0.5) * 1.2,
      label: 1,
    });
  }
  return pts;
}

function computeSVM(points) {
  const c0 = points.filter((p) => p.label === 0);
  const c1 = points.filter((p) => p.label === 1);
  if (c0.length < 2 || c1.length < 2) return null;

  let bestWx = 0,
    bestWy = 0,
    bestB = 0;
  let bestMargin = -Infinity;
  let bestSVs = [];

  for (let attempt = 0; attempt < 200; attempt++) {
    const a = c0[Math.floor(Math.random() * c0.length)];
    const b = c1[Math.floor(Math.random() * c1.length)];
    const midX = (a.x + b.x) / 2,
      midY = (a.y + b.y) / 2;
    const dx = b.x - a.x,
      dy = b.y - a.y;
    const wx = dy,
      wy = -dx;
    const norm = Math.sqrt(wx * wx + wy * wy);
    if (norm < 1e-10) continue;
    const wxn = wx / norm,
      wyn = wy / norm;
    const bVal = -(wxn * midX + wyn * midY);

    let minDist = Infinity;
    let separable = true;
    for (const p of points) {
      const score = wxn * p.x + wyn * p.y + bVal;
      const expected = p.label === 0 ? -1 : 1;
      if (score * expected < -0.01) {
        separable = false;
        break;
      }
      const dist = Math.abs(score);
      if (dist < minDist) minDist = dist;
    }
    if (!separable) continue;

    if (minDist > bestMargin) {
      bestMargin = minDist;
      bestWx = wxn;
      bestWy = wyn;
      bestB = bVal;
    }
  }

  if (bestMargin < 0) return null;

  bestSVs = [];
  for (const p of points) {
    const dist = Math.abs(bestWx * p.x + bestWy * p.y + bestB);
    if (dist < bestMargin * 1.15) bestSVs.push(p);
  }

  return {
    wx: bestWx,
    wy: bestWy,
    b: bestB,
    margin: bestMargin,
    supportVectors: bestSVs,
  };
}

const LEVELS = [
  {
    title: "See the Ropes",
    objective:
      "Observe the decision boundary and the margin (the gap between classes).",
    hint: "The solid line is the decision boundary. Dashed lines are the margins. The support vectors are highlighted.",
  },
  {
    title: "Narrow the Gap",
    objective: "Add a point near the boundary and watch the margin shrink.",
    hint: "Click near the decision boundary to add a point. The margin will tighten.",
  },
  {
    title: "Widen the Margin",
    objective: "Remove support vectors to make the margin as wide as possible.",
    hint: "Click a support vector (glowing point) to remove it. Fewer constraints = wider margin.",
  },
  {
    title: "Shift the Line",
    objective:
      "Add points to shift the boundary so it perfectly separates 2 reds and 2 blues on each side.",
    hint: "Add balanced points on both sides. The line will adjust to maintain separation.",
  },
  {
    title: "Maximum Margin",
    objective: "Achieve a margin ≥ 0.5 with at least 6 points on each side.",
    hint: "Remove points near the boundary and add cleanly separated ones. Wide margin = confident model.",
  },
];

export default function TugOfWar() {
  const svgRef = useRef(null);
  const [points, setPoints] = useState(() => generateData(20));
  const [message, setMessage] = useState("");
  const [hoverPos, setHoverPos] = useState(null);
  const ls = useLevelSystem(5);

  const svm = useMemo(() => computeSVM(points), [points]);
  const c0Count = points.filter((p) => p.label === 0).length;
  const c1Count = points.filter((p) => p.label === 1).length;

  const handleAddPoint = useCallback(
    (x, y) => {
      const label = c0Count <= c1Count ? 0 : 1;
      setPoints((prev) => [...prev, { x, y, label }]);
    },
    [c0Count, c1Count],
  );

  const handleRemovePoint = useCallback((id) => {
    setPoints((prev) => prev.filter((_, i) => i !== id));
  }, []);

  const handleReset = () => {
    setPoints(generateData(20));
    setMessage("");
  };

  const checkLevel = useCallback(() => {
    if (!svm) return;
    const { margin, supportVectors } = svm;
    switch (ls.currentLevel) {
      case 1:
        if (!ls.justCompleted) {
          ls.completeLevel();
          setMessage(
            "✅ Level 1! The tug-of-war is visible! Now narrow the gap (L2).",
          );
          return;
        }
        break;
      case 2:
        if (margin < 0.25 && supportVectors.length >= 3 && !ls.justCompleted) {
          ls.completeLevel();
          setMessage(
            "🎉 Level 2! Margin narrowed! Now widen it by removing SVs (L3).",
          );
          return;
        }
        break;
      case 3:
        if (margin > 0.4 && supportVectors.length <= 4 && !ls.justCompleted) {
          ls.completeLevel();
          setMessage("🎉 Level 3! Wide margin! Now shift the boundary (L4).");
          return;
        }
        break;
      case 4:
        if (c0Count >= 4 && c1Count >= 4 && margin > 0.2 && !ls.justCompleted) {
          ls.completeLevel();
          setMessage(
            "🎉 Level 4! Balanced separation! Final: max margin with many points (L5).",
          );
          return;
        }
        break;
      case 5:
        if (
          margin >= 0.5 &&
          c0Count >= 6 &&
          c1Count >= 6 &&
          !ls.justCompleted
        ) {
          ls.completeLevel();
          setMessage(
            "🏆 All levels complete! You understand Support Vector Machines!",
          );
          return;
        }
        break;
    }
  }, [ls, svm, c0Count, c1Count]);

  useEffect(() => {
    checkLevel();
  }, [checkLevel]);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    const g = svg
      .append("g")
      .attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);
    g.append("rect")
      .attr("width", IW)
      .attr("height", IH)
      .attr("fill", "#1a1a2e")
      .attr("rx", 8);

    if (svm) {
      const { wx, wy, b, margin, supportVectors } = svm;
      const svIds = new Set(supportVectors.map((p) => points.indexOf(p)));

      const path = d3.line();
      const linePts = [];
      for (let x = -2; x <= 2; x += 0.02) {
        if (Math.abs(wy) > 1e-10) {
          const y = -(wx * x + b) / wy;
          if (y >= -2 && y <= 2) linePts.push({ x, y });
        }
      }
      if (linePts.length > 1) {
        const lineData = linePts.map((p) => [xs(p.x), ys(p.y)]);
        g.append("path")
          .attr("d", path(linePts))
          .attr("fill", "none")
          .attr("stroke", "#ffd93d")
          .attr("stroke-width", 2.5);

        [-1, 1].forEach((side, idx) => {
          const marginPts = [];
          for (let x = -2; x <= 2; x += 0.02) {
            if (Math.abs(wy) > 1e-10) {
              const y = -(wx * x + b + side) / wy;
              if (y >= -2 && y <= 2) marginPts.push({ x, y });
            }
          }
          if (marginPts.length > 1) {
            g.append("path")
              .attr("d", path(marginPts))
              .attr("fill", "none")
              .attr("stroke", idx === 0 ? "#6c63ff" : "#ff6b9d")
              .attr("stroke-width", 1.5)
              .attr("stroke-dasharray", "5,4")
              .attr("opacity", 0.6);
          }
        });
      }

      points.forEach((p, i) => {
        const score = wx * p.x + wy * p.y + b;
        const isSV = svIds.has(i);
        const gPoint = g
          .append("g")
          .attr("cursor", "pointer")
          .on("click", () => handleRemovePoint(i));

        gPoint
          .append("circle")
          .attr("cx", xs(p.x))
          .attr("cy", ys(p.y))
          .attr("r", isSV ? 8 : 5)
          .attr("fill", p.label ? "#ff6b9d" : "#6c63ff")
          .attr("stroke", isSV ? "#ffd93d" : "#fff")
          .attr("stroke-width", isSV ? 2.5 : 1)
          .attr("opacity", p.label ? 0.85 : 0.85);

        if (isSV) {
          gPoint
            .append("circle")
            .attr("cx", xs(p.x))
            .attr("cy", ys(p.y))
            .attr("r", 12)
            .attr("fill", "none")
            .attr("stroke", "#ffd93d")
            .attr("stroke-width", 1)
            .attr("opacity", 0.3);
        }
      });

      g.append("text")
        .attr("x", 15)
        .attr("y", IH - 10)
        .attr("fill", "#ffd93d")
        .attr("font-size", 10)
        .attr("font-weight", "bold")
        .text(
          `Margin: ${margin.toFixed(3)}  |  Support Vectors: ${supportVectors.length}`,
        );
    }

    g.append("text")
      .attr("x", IW - 10)
      .attr("y", IH - 10)
      .attr("text-anchor", "end")
      .attr("fill", "#8888aa")
      .attr("font-size", 9)
      .text(`🔵=${c0Count}  🔴=${c1Count}`);

    const legX = IW - 175,
      legY = 10;
    g.append("rect")
      .attr("x", legX)
      .attr("y", legY)
      .attr("width", 170)
      .attr("height", 71)
      .attr("rx", 6)
      .attr("fill", "#0f0f1a")
      .attr("opacity", 0.85);
    [
      { label: "Class 0", color: "#6c63ff", r: 4 },
      { label: "Class 1", color: "#ff6b9d", r: 4 },
      { label: "Support Vector ★", color: "#ffd93d", r: 4, sv: true },
      { label: "Decision boundary", color: "#ffd93d", line: true },
    ].forEach((li, i) => {
      const ly = legY + 16 + i * 15;
      if (li.line) {
        g.append("line")
          .attr("x1", legX + 8)
          .attr("y1", ly)
          .attr("x2", legX + 26)
          .attr("y2", ly)
          .attr("stroke", li.color)
          .attr("stroke-width", 2)
          .attr("opacity", 0.7);
      } else {
        const c = g
          .append("circle")
          .attr("cx", legX + 17)
          .attr("cy", ly)
          .attr("r", li.r)
          .attr("fill", li.color)
          .attr("stroke", li.sv ? "#ffd93d" : "#fff")
          .attr("stroke-width", li.sv ? 2 : 0.5);
        if (li.sv)
          g.append("circle")
            .attr("cx", legX + 17)
            .attr("cy", ly)
            .attr("r", 7)
            .attr("fill", "none")
            .attr("stroke", "#ffd93d")
            .attr("stroke-width", 1)
            .attr("opacity", 0.3);
      }
      g.append("text")
        .attr("x", legX + 32)
        .attr("y", ly + 3)
        .attr("fill", "#8888aa")
        .attr("font-size", 9)
        .text(li.label);
    });

    g.append("text")
      .attr("x", IW / 2)
      .attr("y", IH + 18)
      .attr("text-anchor", "middle")
      .attr("fill", "#8888aa")
      .attr("font-size", 9)
      .attr("opacity", 0.6)
      .text("Click empty space → add point  |  Click a point → remove it");

    const rect = g
      .append("rect")
      .attr("width", IW)
      .attr("height", IH)
      .attr("fill", "transparent")
      .style("pointer-events", "all")
      .style("cursor", "crosshair");

    rect.on("click", (event) => {
      const [mx, my] = d3.pointer(event, g.node());
      const wx = xs.invert(mx);
      const wy = ys.invert(my);
      if (wx >= -2 && wx <= 2 && wy >= -2 && wy <= 2) {
        handleAddPoint(wx, wy);
      }
    });
  }, [points, svm, c0Count, c1Count, handleAddPoint, handleRemovePoint]);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <span>🤼</span> Tug-of-War — Support Vector Machines
          </h1>
          <p className="text-workshop-muted text-sm">
            Support vectors are the outermost points holding the{" "}
            <strong>margin</strong> — like ropes in a tug-of-war.
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
            title="What is SVM?"
            definition={`**Support Vector Machine** finds the decision boundary that maximizes the margin between two classes.\n\n**Support vectors** = the few points that "hold up" the boundary. Remove them and the line shifts.`}
            how={`1. SVM finds the line that **maximizes the gap** between classes\n2. **Margin** = distance from boundary to the nearest points\n3. **Support vectors** = the points on the edge of the margin\n4. Only support vectors matter — other points don't affect the boundary\n\nClick to add points. Click a support vector to remove it. Watch the margin change.`}
            why={`SVMs were the dominant ML classifier before deep learning. They work well with small datasets and high-dimensional spaces. The "kernel trick" lets them find non-linear boundaries.`}
            what={`The yellow line is the decision boundary. Dashed lines are margins. ★-marked points are support vectors. Click empty space to add a point, click a point to remove it.`}
          />
          <div className="bg-workshop-surface rounded-xl p-4 border border-workshop-border space-y-3">
            <div className="text-xs text-workshop-muted space-y-1">
              <div className="flex justify-between">
                <span>Class 0 (🔵)</span>
                <span className="font-mono text-workshop-accent">
                  {c0Count}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Class 1 (🔴)</span>
                <span className="font-mono text-workshop-accent2">
                  {c1Count}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-workshop-border">
                <span>Margin</span>
                <span
                  className={`font-mono ${svm && svm.margin > 0.4 ? "text-workshop-accent3" : "text-workshop-accent4"}`}
                >
                  {svm ? svm.margin.toFixed(3) : "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Support Vectors</span>
                <span className="font-mono text-workshop-accent4">
                  {svm ? svm.supportVectors.length : 0}
                </span>
              </div>
            </div>
            <button
              onClick={handleReset}
              className="w-full px-3 py-2 bg-workshop-border rounded-lg text-xs text-workshop-muted cursor-pointer hover:bg-workshop-surface"
            >
              🔄 Reset
            </button>
          </div>
          {message && <LiveHint>{message}</LiveHint>}
        </div>
      </div>
    </div>
  );
}
