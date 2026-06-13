import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import * as d3 from "d3";
import DefinitionGuide, { LiveHint } from "../../components/DefinitionGuide";
import LevelSystem, { useLevelSystem } from "../../components/LevelSystem";

const W = 700,
  H = 500;
const MARGIN = { top: 30, right: 40, bottom: 40, left: 40 };
const IW = W - MARGIN.left - MARGIN.right;
const IH = H - MARGIN.top - MARGIN.bottom;
const xs = d3.scaleLinear().domain([0, 1]).range([0, IW]);
const ys = d3.scaleLinear().domain([-1.5, 1.5]).range([IH, 0]);

function generateNoisySine(n = 20, noise = 0.25) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const x = Math.random();
    const y = Math.sin(2 * Math.PI * x) + (Math.random() - 0.5) * noise * 2;
    pts.push({ x, y });
  }
  return pts.sort((a, b) => a.x - b.x);
}

function polyfit(points, degree) {
  if (degree < 1 || points.length < 2) return null;
  const n = points.length;
  const m = degree + 1;
  const X = Array.from({ length: n }, (_, i) => {
    const row = [];
    for (let j = 0; j < m; j++) row.push(Math.pow(points[i].x, j));
    return row;
  });
  const Y = points.map((p) => p.y);

  const XT = X[0].map((_, i) => X.map((row) => row[i]));
  const XTX = XT.map((row) =>
    X[0].map((_, j) => row.reduce((s, v, k) => s + v * X[k][j], 0)),
  );
  const XTY = XT.map((row) => row.reduce((s, v, k) => s + v * Y[k], 0));

  const aug = XTX.map((row, i) => [...row, XTY[i]]);
  for (let col = 0; col < m; col++) {
    let maxRow = col;
    for (let row = col + 1; row < m; row++) {
      if (Math.abs(aug[row][col]) > Math.abs(aug[maxRow][col])) maxRow = row;
    }
    [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];
    const pivot = aug[col][col];
    if (Math.abs(pivot) < 1e-10) return null;
    for (let j = col; j <= m; j++) aug[col][j] /= pivot;
    for (let row = 0; row < m; row++) {
      if (row !== col) {
        const factor = aug[row][col];
        for (let j = col; j <= m; j++) aug[row][j] -= factor * aug[col][j];
      }
    }
  }
  return aug.map((row) => row[m]);
}

function polyEval(coeffs, x) {
  return coeffs.reduce((s, c, i) => s + c * Math.pow(x, i), 0);
}

function mse(points, coeffs) {
  if (!coeffs) return Infinity;
  return (
    points.reduce((s, p) => s + Math.pow(p.y - polyEval(coeffs, p.x), 2), 0) /
    points.length
  );
}

const LEVELS = [
  {
    title: "First Stitch",
    objective: "Fit any polynomial (degree ≥ 1) and observe the curve.",
    hint: "Move the degree slider up from 0 to see a line fit the data.",
  },
  {
    title: "Too Simple",
    objective:
      "Set degree to 1 (straight line) and see the high training error.",
    hint: "A straight line can't capture the sine wave — watch the train error.",
  },
  {
    title: "Overstretched",
    objective:
      "Set degree ≥ 10 and watch the curve go wild through every point.",
    hint: "Crank the degree up to 10+ and watch the wiggle! That's overfitting.",
  },
  {
    title: "Sweet Spot",
    objective: "Find a degree (3-6) where test error is lowest.",
    hint: "Watch both train and test errors. Low train + low test = good fit.",
  },
  {
    title: "Perfect Fit",
    objective: "Achieve test MSE below 0.03.",
    hint: "Try degrees 4-6. Too low = underfit, too high = overfit.",
  },
];

export default function EmperorsTailor() {
  const svgRef = useRef(null);
  const [degree, setDegree] = useState(1);
  const [trainPts] = useState(() => generateNoisySine(16, 0.2));
  const [testPts] = useState(() => generateNoisySine(20, 0.2));
  const [message, setMessage] = useState("");
  const ls = useLevelSystem(5);

  const coeffs = useMemo(() => polyfit(trainPts, degree), [trainPts, degree]);
  const trainMSE = useMemo(() => mse(trainPts, coeffs), [trainPts, coeffs]);
  const testMSE = useMemo(() => mse(testPts, coeffs), [testPts, coeffs]);

  const curve = useMemo(() => {
    if (!coeffs) return [];
    const pts = [];
    for (let i = 0; i <= 200; i++) {
      const x = i / 200;
      pts.push({ x, y: polyEval(coeffs, x) });
    }
    return pts;
  }, [coeffs]);

  const checkLevel = useCallback(
    (deg, tMSE, teMSE) => {
      switch (ls.currentLevel) {
        case 1:
          if (deg >= 1 && !ls.justCompleted) {
            ls.completeLevel();
            setMessage(
              "✅ Level 1! You fitted a polynomial. Try a straight line (L2).",
            );
            return true;
          }
          break;
        case 2:
          if (deg === 1 && !ls.justCompleted) {
            ls.completeLevel();
            setMessage(
              "✅ Level 2! See how a line misses the curve? Now overfit (L3).",
            );
            return true;
          }
          break;
        case 3:
          if (deg >= 10 && !ls.justCompleted) {
            ls.completeLevel();
            setMessage(
              "🎉 Level 3! That wiggly nightmare is overfitting! Find the sweet spot (L4).",
            );
            return true;
          }
          break;
        case 4:
          if (deg >= 3 && deg <= 6 && teMSE < 0.08 && !ls.justCompleted) {
            ls.completeLevel();
            setMessage(
              "🎉 Level 4! Sweet spot found! Final: beat test error 0.03 (L5).",
            );
            return true;
          }
          break;
        case 5:
          if (teMSE < 0.03 && !ls.justCompleted) {
            ls.completeLevel();
            setMessage(
              "🏆 All levels complete! You understand the bias-variance tradeoff!",
            );
            return true;
          }
          break;
      }
      return false;
    },
    [ls],
  );

  useEffect(() => {
    checkLevel(degree, trainMSE, testMSE);
  }, [degree, trainMSE, testMSE, checkLevel]);

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

    const xAxis = d3.axisBottom(xs).ticks(6);
    const yAxis = d3.axisLeft(ys).ticks(6);
    g.append("g")
      .attr("transform", `translate(0,${IH})`)
      .call(xAxis)
      .selectAll("text")
      .attr("fill", "#8888aa")
      .attr("font-size", 9);
    g.append("g")
      .call(yAxis)
      .selectAll("text")
      .attr("fill", "#8888aa")
      .attr("font-size", 9);
    g.selectAll(".domain").attr("stroke", "#2a2a4a");
    g.selectAll(".tick line").attr("stroke", "#2a2a4a");

    g.append("text")
      .attr("x", IW / 2)
      .attr("y", IH + 25)
      .attr("text-anchor", "middle")
      .attr("fill", "#8888aa")
      .attr("font-size", 9)
      .text("x");
    g.append("text")
      .attr("x", -30)
      .attr("y", IH / 2)
      .attr("text-anchor", "middle")
      .attr("fill", "#8888aa")
      .attr("font-size", 9)
      .attr("transform", "rotate(-90,-30," + IH / 2 + ")")
      .text("y");

    const trueSine = [];
    for (let i = 0; i <= 200; i++) {
      const x = i / 200;
      trueSine.push({ x, y: Math.sin(2 * Math.PI * x) });
    }
    g.append("path")
      .attr(
        "d",
        d3
          .line()
          .x((d) => xs(d.x))
          .y((d) => ys(d.y))(trueSine),
      )
      .attr("fill", "none")
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 1)
      .attr("opacity", 0.15)
      .attr("stroke-dasharray", "3,3");

    if (curve.length > 0) {
      const line = d3
        .line()
        .x((d) => xs(d.x))
        .y((d) => ys(d.y))
        .curve(d3.curveBasis);
      g.append("path")
        .attr("d", line(curve))
        .attr("fill", "none")
        .attr("stroke", "#ff6b9d")
        .attr("stroke-width", 2.5);
    }

    g.selectAll(".train-pt")
      .data(trainPts)
      .join("circle")
      .attr("class", "train-pt")
      .attr("cx", (d) => xs(d.x))
      .attr("cy", (d) => ys(d.y))
      .attr("r", 5)
      .attr("fill", "#6c63ff")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1)
      .attr("opacity", 0.85);

    g.selectAll(".test-pt")
      .data(testPts)
      .join("circle")
      .attr("class", "test-pt")
      .attr("cx", (d) => xs(d.x))
      .attr("cy", (d) => ys(d.y))
      .attr("r", 3.5)
      .attr("fill", "#45e6c0")
      .attr("stroke", "#45e6c0")
      .attr("stroke-width", 1)
      .attr("opacity", 0.5);

    const legX = IW - 155,
      legY = 10;
    g.append("rect")
      .attr("x", legX)
      .attr("y", legY)
      .attr("width", 150)
      .attr("height", 70)
      .attr("rx", 6)
      .attr("fill", "#0f0f1a")
      .attr("opacity", 0.85);
    const legItems = [
      { label: "Training points", color: "#6c63ff", r: 5, fill: true },
      { label: "Test points", color: "#45e6c0", r: 3.5, fill: false },
      {
        label: `Polynomial (deg ${degree})`,
        color: "#ff6b9d",
        r: 0,
        line: true,
      },
      {
        label: "True function",
        color: "#ffffff",
        r: 0,
        line: true,
        dash: true,
      },
    ];
    legItems.forEach((li, i) => {
      const ly = legY + 16 + i * 15;
      if (li.line) {
        g.append("line")
          .attr("x1", legX + 8)
          .attr("y1", ly)
          .attr("x2", legX + 28)
          .attr("y2", ly)
          .attr("stroke", li.color)
          .attr("stroke-width", 2)
          .attr("stroke-dasharray", li.dash ? "3,3" : "none")
          .attr("opacity", 0.7);
      } else {
        g.append("circle")
          .attr("cx", legX + 18)
          .attr("cy", ly)
          .attr("r", li.r)
          .attr("fill", li.fill ? li.color : "none")
          .attr("stroke", li.color)
          .attr("stroke-width", 1.5);
      }
      g.append("text")
        .attr("x", legX + 34)
        .attr("y", ly + 3)
        .attr("fill", "#8888aa")
        .attr("font-size", 9)
        .text(li.label);
    });
  }, [trainPts, testPts, curve, degree, xs, ys, IW, IH]);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    const g = svg.select("g");
    if (g.empty()) return;
    g.selectAll(".error-text").remove();
    g.append("text")
      .attr("class", "error-text")
      .attr("x", 15)
      .attr("y", IH - 10)
      .attr("fill", trainMSE < 0.1 ? "#45e6c0" : "#ff6b9d")
      .attr("font-size", 10)
      .attr("font-weight", "bold")
      .text(`Train MSE: ${trainMSE.toFixed(4)}`);
    g.append("text")
      .attr("class", "error-text")
      .attr("x", 185)
      .attr("y", IH - 10)
      .attr("fill", testMSE < 0.1 ? "#45e6c0" : "#ffd93d")
      .attr("font-size", 10)
      .attr("font-weight", "bold")
      .text(`Test MSE: ${testMSE.toFixed(4)}`);
  }, [trainMSE, testMSE]);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <span>👑</span> The Emperor's Tailor — Overfitting Simulator
          </h1>
          <p className="text-workshop-muted text-sm">
            A tailor who perfectly fits the <strong>noise</strong>, not the
            signal. Watch how complex models overfit.
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
            title="What is Overfitting?"
            definition={`When a model learns the training data too perfectly, including its noise, failing to generalize.\n\nLike a tailor making a suit that fits one pose perfectly but can't move.`}
            how={`1. **Underfit** (degree 1): too simple, misses the pattern → high error everywhere\n2. **Good fit** (degree 3-6): captures the curve without the noise\n3. **Overfit** (degree 10+): wiggles through every training point → wild on test data\n\nWatch **train error** go down while **test error** goes back up!`}
            why={`Overfitting is the #1 trap in ML. A model that memorizes the training data will fail on new data. Always check test/validation performance.`}
            what={`Drag the degree slider up and down. Blue dots = training data, green = test data. The pink curve is your model. A good model fits the sine wave, not the noise!`}
          />
          <div className="bg-workshop-surface rounded-xl p-4 border border-workshop-border space-y-3">
            <div className="text-xs text-workshop-muted space-y-3">
              <div>
                <div className="flex justify-between mb-1">
                  <span>Polynomial Degree</span>
                  <span className="font-mono text-workshop-text font-bold">
                    {degree}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="14"
                  step="1"
                  value={degree}
                  onChange={(e) => {
                    setDegree(+e.target.value);
                    setMessage("");
                  }}
                  className="w-full accent-workshop-accent2"
                />
                <div className="flex justify-between text-[10px] text-workshop-muted">
                  <span>Underfit</span>
                  <span>Sweet spot</span>
                  <span>Overfit</span>
                </div>
              </div>
              <div className="pt-1 border-t border-workshop-border space-y-1">
                <div className="flex justify-between">
                  <span>Train MSE</span>
                  <span
                    className={`font-mono ${trainMSE < 0.05 ? "text-workshop-accent3" : trainMSE < 0.15 ? "text-workshop-accent4" : "text-workshop-accent2"}`}
                  >
                    {trainMSE.toFixed(4)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Test MSE</span>
                  <span
                    className={`font-mono ${testMSE < 0.05 ? "text-workshop-accent3" : testMSE < 0.15 ? "text-workshop-accent4" : "text-workshop-accent2"}`}
                  >
                    {testMSE.toFixed(4)}
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-workshop-border">
                  <span>Coefficients</span>
                  <span className="font-mono text-workshop-text">
                    {coeffs ? coeffs.length : 0}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-workshop-muted bg-workshop-bg rounded-lg px-3 py-2 border border-workshop-border">
              <span
                className={`w-2 h-2 rounded-full ${degree < 3 ? "bg-workshop-accent2" : degree <= 7 ? "bg-workshop-accent3" : "bg-workshop-accent4"}`}
              />
              <span>
                {degree < 3
                  ? "UNDERFITTING"
                  : degree <= 7
                    ? "GOOD FIT"
                    : "OVERFITTING"}
              </span>
            </div>
          </div>
          {message && <LiveHint>{message}</LiveHint>}
        </div>
      </div>
    </div>
  );
}
