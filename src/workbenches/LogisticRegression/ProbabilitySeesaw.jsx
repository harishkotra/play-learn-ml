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

function generateData(n = 60) {
  const pts = [];
  for (let i = 0; i < n / 2; i++) {
    const angle = Math.random() * 2 * Math.PI;
    const r = 0.3 + Math.random() * 0.5;
    pts.push({
      x: -0.8 + r * Math.cos(angle),
      y: r * Math.sin(angle),
      label: 0,
    });
  }
  for (let i = 0; i < n / 2; i++) {
    const angle = Math.random() * 2 * Math.PI;
    const r = 0.3 + Math.random() * 0.5;
    pts.push({
      x: 0.8 + r * Math.cos(angle),
      y: r * Math.sin(angle),
      label: 1,
    });
  }
  return pts;
}

function sigmoid(z) {
  return 1 / (1 + Math.exp(-z));
}

function logisticGradient(points, w0, w1, b) {
  let dw0 = 0,
    dw1 = 0,
    db = 0;
  for (const p of points) {
    const z = w0 * p.x + w1 * p.y + b;
    const pred = sigmoid(z);
    const error = pred - p.label;
    dw0 += error * p.x;
    dw1 += error * p.y;
    db += error;
  }
  const n = points.length;
  return { dw0: dw0 / n, dw1: dw1 / n, db: db / n };
}

function fitLogistic(points, steps = 200, lr = 0.5) {
  let w0 = 0,
    w1 = 0,
    b = 0;
  for (let i = 0; i < steps; i++) {
    const g = logisticGradient(points, w0, w1, b);
    w0 -= lr * g.dw0;
    w1 -= lr * g.dw1;
    b -= lr * g.db;
  }
  return { w0, w1, b };
}

function computeLogLoss(points, w0, w1, b) {
  let loss = 0;
  for (const p of points) {
    const z = w0 * p.x + w1 * p.y + b;
    const pred = Math.max(1e-15, Math.min(1 - 1e-15, sigmoid(z)));
    loss -= p.label * Math.log(pred) + (1 - p.label) * Math.log(1 - pred);
  }
  return loss / points.length;
}

function computeAccuracy(points, w0, w1, b) {
  let correct = 0;
  for (const p of points) {
    const z = w0 * p.x + w1 * p.y + b;
    const pred = sigmoid(z) >= 0.5 ? 1 : 0;
    if (pred === p.label) correct++;
  }
  return correct / points.length;
}

const LEVELS = [
  {
    title: "See the Curve",
    objective:
      "Run logistic regression and observe the S-curve decision boundary.",
    hint: "Click 'Fit Model' — watch the sigmoid separate the two classes.",
  },
  {
    title: "High Accuracy",
    objective: "Achieve accuracy ≥ 90% on the training data.",
    hint: "Fit the model — the gradient descent should converge to a good separator.",
  },
  {
    title: "Low Loss",
    objective: "Achieve log-loss below 0.20.",
    hint: "More gradient descent steps give lower loss. Try a bit more.",
  },
  {
    title: "Perfect Separation",
    objective: "Achieve accuracy = 100% with log-loss below 0.05.",
    hint: "Run more iterations or increase the learning rate slightly.",
  },
  {
    title: "Probability Calibration",
    objective:
      "Get a clean probability contour where the 0.5 boundary splits the classes.",
    hint: "A good fit shows a smooth gradient from blue (p=0) to pink (p=1) across the boundary.",
  },
];

export default function ProbabilitySeesaw() {
  const svgRef = useRef(null);
  const [points] = useState(() => generateData(60));
  const [params, setParams] = useState(() =>
    fitLogistic(generateData(60), 200, 0.5),
  );
  const [steps, setSteps] = useState(200);
  const [lr, setLr] = useState(0.5);
  const [message, setMessage] = useState("");
  const ls = useLevelSystem(5);

  const logLoss = useMemo(
    () => computeLogLoss(points, params.w0, params.w1, params.b),
    [points, params],
  );
  const accuracy = useMemo(
    () => computeAccuracy(points, params.w0, params.w1, params.b),
    [points, params],
  );

  const handleFit = () => {
    const p = fitLogistic(points, steps, lr);
    setParams(p);
    checkLevel(p);
  };

  const checkLevel = useCallback(
    (p) => {
      const acc = computeAccuracy(points, p.w0, p.w1, p.b);
      const ll = computeLogLoss(points, p.w0, p.w1, p.b);
      switch (ls.currentLevel) {
        case 1:
          if (!ls.justCompleted) {
            ls.completeLevel();
            setMessage(
              "✅ Level 1! The S-curve separates the classes. Now aim for 90% accuracy (L2).",
            );
            return;
          }
          break;
        case 2:
          if (acc >= 0.9 && !ls.justCompleted) {
            ls.completeLevel();
            setMessage(
              "🎉 Level 2! High accuracy! Now get log-loss below 0.20 (L3).",
            );
            return;
          }
          break;
        case 3:
          if (ll < 0.2 && !ls.justCompleted) {
            ls.completeLevel();
            setMessage(
              "🎉 Level 3! Low loss! Now aim for perfect classification (L4).",
            );
            return;
          }
          break;
        case 4:
          if (acc >= 1 && ll < 0.05 && !ls.justCompleted) {
            ls.completeLevel();
            setMessage(
              "🎉 Level 4! Perfect separation! Final: probability calibration (L5).",
            );
            return;
          }
          break;
        case 5:
          if (acc >= 1 && ll < 0.01 && !ls.justCompleted) {
            ls.completeLevel();
            setMessage(
              "🏆 All levels complete! You understand logistic regression!",
            );
            return;
          }
          break;
      }
    },
    [ls, points],
  );

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

    const { w0, w1, b } = params;

    const res = 30;
    for (let i = 0; i <= res; i++) {
      for (let j = 0; j <= res; j++) {
        const x = -2 + 4 * (i / res);
        const y = -2 + 4 * (j / res);
        const z = w0 * x + w1 * y + b;
        const p = sigmoid(z);
        g.append("rect")
          .attr("x", xs(x))
          .attr("y", ys(y))
          .attr("width", IW / res + 1)
          .attr("height", IH / res + 1)
          .attr("fill", p >= 0.5 ? "#ff6b9d" : "#6c63ff")
          .attr("opacity", 0.08 + 0.25 * Math.abs(p - 0.5) * 2);
      }
    }

    const contourData = [];
    for (let i = 0; i <= 60; i++) {
      for (let j = 0; j <= 60; j++) {
        const x = -2 + 4 * (i / 60);
        const y = -2 + 4 * (j / 60);
        const z = w0 * x + w1 * y + b;
        contourData.push({ x: xs(x), y: ys(y), p: sigmoid(z) });
      }
    }
    const contours = d3
      .contourDensity()
      .x((d) => d.x)
      .y((d) => d.y)
      .weight((d) => d.p)
      .size([IW, IH])
      .bandwidth(15)
      .thresholds([0.1, 0.25, 0.5, 0.75, 0.9]);
    try {
      const cData = contours(contourData.filter((_, i) => i % 10 === 0));
      g.selectAll(".prob-contour")
        .data(cData)
        .join("path")
        .attr("d", d3.geoPath())
        .attr("fill", "none")
        .attr("stroke", "#ffffff")
        .attr("stroke-width", 0.5)
        .attr("opacity", 0.15);
    } catch (e) {}

    const path = d3
      .line()
      .x((d) => xs(d.x))
      .y((d) => ys(d.y));
    const boundaryPts = [];
    for (let x = -2; x <= 2; x += 0.02) {
      if (Math.abs(w1) > 1e-10) {
        const y = -(w0 * x + b) / w1;
        if (y >= -2 && y <= 2) boundaryPts.push({ x, y });
      }
    }
    if (boundaryPts.length > 1) {
      g.append("path")
        .attr("d", path(boundaryPts))
        .attr("fill", "none")
        .attr("stroke", "#ffd93d")
        .attr("stroke-width", 2.5)
        .attr("stroke-dasharray", "6,3");
      g.append("text")
        .attr("x", xs(boundaryPts[Math.floor(boundaryPts.length / 2)].x) - 50)
        .attr("y", ys(boundaryPts[Math.floor(boundaryPts.length / 2)].y) - 10)
        .attr("fill", "#ffd93d")
        .attr("font-size", 9)
        .attr("opacity", 0.7)
        .text("p = 0.5 boundary");
    }

    g.selectAll(".pt")
      .data(points)
      .join("circle")
      .attr("class", "pt")
      .attr("cx", (d) => xs(d.x))
      .attr("cy", (d) => ys(d.y))
      .attr("r", 5)
      .attr("fill", (d) => (d.label ? "#ff6b9d" : "#6c63ff"))
      .attr("stroke", (d) => (d.label ? "#fff" : "#fff"))
      .attr("stroke-width", 1)
      .attr("opacity", 0.85);

    const legX = 15,
      legY = 10;
    g.append("rect")
      .attr("x", legX)
      .attr("y", legY)
      .attr("width", 140)
      .attr("height", 56)
      .attr("rx", 6)
      .attr("fill", "#0f0f1a")
      .attr("opacity", 0.85);
    [
      { label: "Class 0 (p<0.5)", color: "#6c63ff", r: 4 },
      { label: "Class 1 (p≥0.5)", color: "#ff6b9d", r: 4 },
      { label: "Decision boundary", color: "#ffd93d", dash: true },
    ].forEach((li, i) => {
      const ly = legY + 16 + i * 15;
      if (li.dash) {
        g.append("line")
          .attr("x1", legX + 8)
          .attr("y1", ly)
          .attr("x2", legX + 26)
          .attr("y2", ly)
          .attr("stroke", li.color)
          .attr("stroke-width", 2)
          .attr("stroke-dasharray", "4,3")
          .attr("opacity", 0.7);
      } else {
        g.append("circle")
          .attr("cx", legX + 17)
          .attr("cy", ly)
          .attr("r", li.r)
          .attr("fill", li.color)
          .attr("stroke", "#fff")
          .attr("stroke-width", 0.5);
      }
      g.append("text")
        .attr("x", legX + 32)
        .attr("y", ly + 3)
        .attr("fill", "#8888aa")
        .attr("font-size", 9)
        .text(li.label);
    });
  }, [points, params]);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <span>⚖️</span> Probability Seesaw — Logistic Regression
          </h1>
          <p className="text-workshop-muted text-sm">
            The <strong>S-curve</strong> (sigmoid) separates two classes. Adjust
            the model and watch probabilities balance.
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
            title="What is Logistic Regression?"
            definition={`A classification model that uses the **sigmoid** function to output a probability between 0 and 1.\n\nUnlike linear regression (predicts any number), logistic regression squashes the output into a probability via the S-curve.`}
            how={`1. Model computes z = w₀x + w₁y + b (a linear score)\n2. Sigmoid converts z to probability: p = 1/(1+e⁻ᶻ)\n3. If p ≥ 0.5, predict class 1; otherwise class 0\n4. **Log-loss** measures how wrong the probabilities are\n5. Gradient descent finds the best w and b`}
            why={`Fundamental for binary classification: spam detection, medical diagnosis, credit scoring. It's not just about accuracy — calibrated probabilities matter.`}
            what={`Click "Fit Model" to run gradient descent. Watch the S-curve shift and the probability heatmap update. The yellow line is the p=0.5 decision boundary.`}
          />
          <div className="bg-workshop-surface rounded-xl p-4 border border-workshop-border space-y-3">
            <div className="text-xs text-workshop-muted space-y-1">
              <div className="flex justify-between">
                <span>Accuracy</span>
                <span
                  className={`font-mono ${accuracy >= 0.9 ? "text-workshop-accent3" : "text-workshop-accent4"}`}
                >
                  {(accuracy * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>Log-Loss</span>
                <span
                  className={`font-mono ${logLoss < 0.2 ? "text-workshop-accent3" : "text-workshop-accent2"}`}
                >
                  {logLoss.toFixed(4)}
                </span>
              </div>
              <div className="pt-2 border-t border-workshop-border">
                <div className="flex justify-between mb-1">
                  <span>Steps</span>
                  <span className="font-mono text-workshop-text">{steps}</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="500"
                  step="10"
                  value={steps}
                  onChange={(e) => setSteps(+e.target.value)}
                  className="w-full accent-workshop-accent"
                />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span>Learning Rate</span>
                  <span className="font-mono text-workshop-text">
                    {lr.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="2"
                  step="0.05"
                  value={lr}
                  onChange={(e) => setLr(+e.target.value)}
                  className="w-full accent-workshop-accent3"
                />
              </div>
            </div>
            <button
              onClick={handleFit}
              className="w-full px-3 py-2 bg-workshop-accent text-white rounded-lg text-xs font-bold cursor-pointer hover:bg-workshop-accent/90"
            >
              🔄 Fit Model
            </button>
          </div>
          {message && <LiveHint>{message}</LiveHint>}
        </div>
      </div>
    </div>
  );
}
