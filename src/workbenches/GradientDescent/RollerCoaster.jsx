import { useRef, useEffect, useState, useCallback } from "react";
import * as d3 from "d3";
import DefinitionGuide, { LiveHint } from "../../components/DefinitionGuide";
import LevelSystem, { useLevelSystem } from "../../components/LevelSystem";

const W = 700,
  H = 500;
const MARGIN = { top: 30, right: 30, bottom: 30, left: 30 };
const IW = W - MARGIN.left - MARGIN.right;
const IH = H - MARGIN.top - MARGIN.bottom;
const DX = [-3, 3],
  DY = [-2.5, 2.5];
const xs = d3.scaleLinear().domain(DX).range([0, IW]);
const ys = d3.scaleLinear().domain(DY).range([IH, 0]);

function lossFn(x, y) {
  return (
    0.3 * (x * x + 2 * y * y) +
    1.2 * Math.sin(1.8 * x) * Math.cos(1.2 * y) +
    2 +
    0.4 * Math.cos(3 * x) * Math.sin(2 * y)
  );
}

function gradFn(x, y) {
  const h = 0.01;
  return {
    dx: (lossFn(x + h, y) - lossFn(x - h, y)) / (2 * h),
    dy: (lossFn(x, y + h) - lossFn(x, y - h)) / (2 * h),
  };
}

function gridValues() {
  const res = 40;
  const vals = [];
  for (let i = 0; i <= res; i++) {
    for (let j = 0; j <= res; j++) {
      const x = DX[0] + (DX[1] - DX[0]) * (i / res);
      const y = DY[0] + (DY[1] - DY[0]) * (j / res);
      vals.push({ x, y, v: lossFn(x, y) });
    }
  }
  return vals;
}

const START_POSITIONS = [
  { x: -2.2, y: 1.8 },
  { x: -1.6, y: 0.8 },
  { x: -2.5, y: 2.0 },
  { x: 1.2, y: 1.5 },
  { x: -2.5, y: 1.0 },
];

const LEVELS = [
  {
    title: "First Drop",
    objective: "Press Play to start the ball rolling down the hill.",
    hint: "Click the Play ▶ button and watch the ball roll down the loss landscape!",
  },
  {
    title: "Reach the Bottom",
    objective: "Get the ball within 0.05 of the minimum loss value.",
    hint: "Let the ball run longer or increase learning rate slightly.",
  },
  {
    title: "Slow and Steady",
    objective: "Reach the bottom with learning rate ≤ 0.05.",
    hint: "Lower the learning rate slider below 0.05 before starting the run.",
  },
  {
    title: "Escape Artist",
    objective:
      "Navigate from the local minimum to the global minimum using momentum.",
    hint: "Turn on momentum and use a moderate learning rate to jump over the hump.",
  },
  {
    title: "Speed Runner",
    objective: "Reach the global minimum in under 30 steps.",
    hint: "Higher learning rate means faster descent — but don't overshoot!",
  },
];

export default function RollerCoaster() {
  const svgRef = useRef(null);
  const animRef = useRef(null);
  const [lr, setLr] = useState(0.12);
  const [momentum, setMomentum] = useState(0.0);
  const [useMomentum, setUseMomentum] = useState(false);
  const [steps, setSteps] = useState(0);
  const [running, setRunning] = useState(false);
  const [loss, setLoss] = useState(null);
  const [message, setMessage] = useState("");
  const [pos, setPos] = useState({ ...START_POSITIONS[0] });
  const [path, setPath] = useState([]);
  const [globalMin] = useState(() => {
    let mv = Infinity,
      mp = { x: 0, y: 0 };
    for (let x = -3; x <= 3; x += 0.05) {
      for (let y = -2.5; y <= 2.5; y += 0.05) {
        const v = lossFn(x, y);
        if (v < mv) {
          mv = v;
          mp = { x, y };
        }
      }
    }
    return { ...mp, v: mv };
  });
  const ls = useLevelSystem(5);

  const posRef = useRef(pos);
  const velRef = useRef({ x: 0, y: 0 });
  const stepsRef = useRef(0);
  const pathRef = useRef([]);
  const lrRef = useRef(lr);
  const momentumRef = useRef(useMomentum ? momentum : 0);

  useEffect(() => {
    posRef.current = pos;
  }, [pos]);
  useEffect(() => {
    lrRef.current = lr;
  }, [lr]);
  useEffect(() => {
    momentumRef.current = useMomentum ? momentum : 0;
  }, [useMomentum, momentum]);

  const checkLevel = useCallback(
    (p, stepCount, lossVal, lrUsed) => {
      const atGlobal =
        Math.abs(p.x - globalMin.x) < 0.15 &&
        Math.abs(p.y - globalMin.y) < 0.15;
      switch (ls.currentLevel) {
        case 1:
          if (stepCount >= 1 && !ls.justCompleted) {
            ls.completeLevel();
            setMessage(
              "✅ Level 1! The ball is rolling! Now reach the bottom (L2).",
            );
            return true;
          }
          break;
        case 2:
          if (atGlobal && !ls.justCompleted) {
            ls.completeLevel();
            setMessage(
              "🎉 Level 2! You reached the bottom! Now do it with LR ≤ 0.05 (L3).",
            );
            return true;
          }
          break;
        case 3:
          if (atGlobal && lrUsed <= 0.05 && !ls.justCompleted) {
            ls.completeLevel();
            setMessage(
              "🎉 Level 3! Slow and steady wins the race! Activate momentum (L4).",
            );
            return true;
          }
          break;
        case 4:
          if (atGlobal && useMomentum && !ls.justCompleted) {
            ls.completeLevel();
            setMessage(
              "🎉 Level 4! Momentum saved you! Final challenge: speed run (L5).",
            );
            return true;
          }
          break;
        case 5:
          if (atGlobal && stepCount <= 30 && !ls.justCompleted) {
            ls.completeLevel();
            setMessage(
              "🏆 All levels complete! You're a Gradient Descent master!",
            );
            return true;
          }
          break;
      }
      return false;
    },
    [ls, globalMin, useMomentum],
  );

  const step = useCallback(() => {
    const p = posRef.current;
    const g = gradFn(p.x, p.y);
    const v = velRef.current;
    const mu = momentumRef.current;
    const lrVal = lrRef.current;
    v.x = mu * v.x - lrVal * g.dx;
    v.y = mu * v.y - lrVal * g.dy;
    const np = {
      x: Math.max(DX[0], Math.min(DX[1], p.x + v.x)),
      y: Math.max(DY[0], Math.min(DY[1], p.y + v.y)),
    };
    posRef.current = np;
    const n = stepsRef.current + 1;
    stepsRef.current = n;
    const pathSnap = [...pathRef.current, np];
    pathRef.current = pathSnap;
    const lossVal = lossFn(np.x, np.y);
    if (n % 2 === 0 || n < 5) {
      setPos({ ...np });
      setPath(pathSnap);
      setSteps(n);
      setLoss(lossVal);
    }
    if (!checkLevel(np, n, lossVal, lrRef.current)) {
      const atBorder =
        np.x <= DX[0] + 0.01 ||
        np.x >= DX[1] - 0.01 ||
        np.y <= DY[0] + 0.01 ||
        np.y >= DY[1] - 0.01;
      if (atBorder) {
        setRunning(false);
        setMessage(
          "The ball flew off the landscape! Try a lower learning rate.",
        );
      }
    }
  }, [checkLevel]);

  useEffect(() => {
    if (!running) {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      return;
    }
    let lastT = 0;
    function tick(t) {
      if (t - lastT > 30) {
        step();
        lastT = t;
      }
      animRef.current = requestAnimationFrame(tick);
    }
    animRef.current = requestAnimationFrame(tick);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [running, step]);

  const handlePlay = () => {
    if (posRef.current.x === DX[0] || posRef.current.y === DY[0]) {
      handleReset();
      setTimeout(() => setRunning(true), 50);
    } else {
      setRunning(true);
    }
  };

  const handleReset = () => {
    setRunning(false);
    const startIdx = Math.min(ls.currentLevel - 1, START_POSITIONS.length - 1);
    const sp = { ...START_POSITIONS[startIdx] };
    posRef.current = sp;
    velRef.current = { x: 0, y: 0 };
    stepsRef.current = 0;
    pathRef.current = [];
    setPos(sp);
    setPath([]);
    setSteps(0);
    setLoss(null);
    setMessage("");
  };

  const handlePause = () => setRunning(false);

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

    const vals = gridValues();
    const minL = d3.min(vals, (d) => d.v);
    const maxL = d3.max(vals, (d) => d.v);
    const cScale = d3
      .scaleSequentialLog(d3.interpolateViridis)
      .domain([maxL, minL + 0.01]);

    const res = 40;
    const cellW = IW / res,
      cellH = IH / res;
    for (let i = 0; i < res; i++) {
      for (let j = 0; j < res; j++) {
        const idx = i * (res + 1) + j;
        if (idx >= vals.length) continue;
        const v = vals[idx].v;
        g.append("rect")
          .attr("x", i * cellW)
          .attr("y", j * cellH)
          .attr("width", cellW + 1)
          .attr("height", cellH + 1)
          .attr("fill", cScale(v))
          .attr("opacity", 0.7);
      }
    }

    const contours = d3
      .contourDensity()
      .x((d) => xs(d.x))
      .y((d) => ys(d.y))
      .weight((d) => d.v)
      .size([IW, IH])
      .bandwidth(20)
      .thresholds(10);
    try {
      const cData = contours(vals.filter((_, i) => i % 5 === 0));
      g.selectAll(".contour")
        .data(cData)
        .join("path")
        .attr("d", d3.geoPath())
        .attr("fill", "none")
        .attr("stroke", "#ffffff33")
        .attr("stroke-width", 0.5);
    } catch (e) {}

    const contourLevels = 12;
    for (let k = 1; k <= contourLevels; k++) {
      const level = minL + ((maxL - minL) * k) / contourLevels;
      const pts = [];
      for (let x = DX[0]; x <= DX[1]; x += 0.06) {
        for (let y = DY[0]; y <= DY[1]; y += 0.06) {
          const v = lossFn(x, y);
          if (Math.abs(v - level) < 0.08) {
            pts.push([xs(x), ys(y)]);
          }
        }
      }
      if (pts.length > 10) {
        try {
          g.append("path")
            .attr("d", d3.line()(pts))
            .attr("fill", "none")
            .attr("stroke", "#ffffff22")
            .attr("stroke-width", 0.5);
        } catch (e) {}
      }
    }

    g.append("text")
      .attr("x", IW / 2)
      .attr("y", 14)
      .attr("text-anchor", "middle")
      .attr("fill", "#8888aa")
      .attr("font-size", 10)
      .attr("font-weight", "bold")
      .text("LOSS LANDSCAPE — deeper = lower loss");

    g.append("circle")
      .attr("cx", xs(globalMin.x))
      .attr("cy", ys(globalMin.y))
      .attr("r", 5)
      .attr("fill", "#ffd93d")
      .attr("opacity", 0.5)
      .attr("stroke", "#ffd93d")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "3,3");
    g.append("text")
      .attr("x", xs(globalMin.x))
      .attr("y", ys(globalMin.y) - 10)
      .attr("text-anchor", "middle")
      .attr("fill", "#ffd93d")
      .attr("font-size", 9)
      .attr("opacity", 0.7)
      .text("★ global min");
  }, [globalMin]);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    const g = svg.select("g");
    if (g.empty()) return;

    const pathGroup = g.select(".path-group");
    const ballGroup = g.select(".ball-group");
    const legendGroup = g.select(".legend-group");

    const pg = pathGroup.empty()
      ? g.append("g").attr("class", "path-group")
      : pathGroup;
    const bg = ballGroup.empty()
      ? g.append("g").attr("class", "ball-group")
      : ballGroup;
    const lg = legendGroup.empty()
      ? g.append("g").attr("class", "legend-group")
      : legendGroup;

    pg.selectAll("*").remove();
    if (path.length > 1) {
      const line = d3
        .line()
        .x((d) => xs(d.x))
        .y((d) => ys(d.y))
        .curve(d3.curveBasis);
      pg.append("path")
        .attr("d", line(path))
        .attr("fill", "none")
        .attr("stroke", "#ff6b9d")
        .attr("stroke-width", 2)
        .attr("opacity", 0.7)
        .attr("stroke-dasharray", "4,4");
      path.forEach((p, i) => {
        if (i % Math.max(1, Math.floor(path.length / 20)) === 0) {
          pg.append("circle")
            .attr("cx", xs(p.x))
            .attr("cy", ys(p.y))
            .attr("r", 2)
            .attr("fill", "#ff6b9d")
            .attr("opacity", 0.4);
        }
      });
    }

    bg.selectAll("*").remove();
    bg.append("circle")
      .attr("cx", xs(pos.x))
      .attr("cy", ys(pos.y))
      .attr("r", 8)
      .attr("fill", "#ff6b9d")
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .attr("filter", "url(#glow)");
    bg.append("circle")
      .attr("cx", xs(pos.x))
      .attr("cy", ys(pos.y))
      .attr("r", 4)
      .attr("fill", "#fff")
      .attr("opacity", 0.8);
    bg.append("text")
      .attr("x", xs(pos.x))
      .attr("y", ys(pos.y) - 16)
      .attr("text-anchor", "middle")
      .attr("fill", "#ff6b9d")
      .attr("font-size", 9)
      .attr("font-weight", "bold")
      .text("●");

    lg.selectAll("*").remove();
    lg.append("rect")
      .attr("x", IW - 130)
      .attr("y", IH - 28)
      .attr("width", 128)
      .attr("height", 26)
      .attr("rx", 4)
      .attr("fill", "#0f0f1a")
      .attr("opacity", 0.8);
    lg.append("text")
      .attr("x", IW - 125)
      .attr("y", IH - 12)
      .attr("fill", "#8888aa")
      .attr("font-size", 9)
      .text(`Loss: ${loss !== null ? loss.toFixed(4) : "—"}  Steps: ${steps}`);

    if (!svg.select("defs").select("#glow").size()) {
      const defs = svg.select("defs");
      defs
        .append("filter")
        .attr("id", "glow")
        .append("feGaussianBlur")
        .attr("stdDeviation", "3")
        .attr("result", "coloredBlur");
      const merge = defs.select("#glow").append("feMerge");
      merge.append("feMergeNode").attr("in", "coloredBlur");
      merge.append("feMergeNode").attr("in", "SourceGraphic");
    }
  }, [pos, path, loss, steps, xs, ys]);

  const startIdx = Math.min(ls.currentLevel - 1, START_POSITIONS.length - 1);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <span>🎢</span> Roller Coaster — Gradient Descent
          </h1>
          <p className="text-workshop-muted text-sm">
            Watch a ball roll down the <strong>loss landscape</strong> as
            gradient descent finds the minimum.
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
            title="What is Gradient Descent?"
            definition={`An optimization algorithm that iteratively moves toward the minimum of a function.\n\nLike a ball rolling downhill: it follows the steepest downward slope (the gradient) at every step.`}
            how={`1. The ball starts at a random position on the landscape\n2. **Gradient** = direction of steepest ascent (opposite = descent)\n3. Ball takes a step: newPos = oldPos − **lr** × gradient\n4. **Learning rate (lr)** controls step size\n5. Repeat until convergence`}
            why={`Used to train almost every ML model: neural networks (backpropagation = gradient descent), linear regression, logistic regression.`}
            what={`Adjust learning rate: higher = faster but may overshoot. Turn on momentum to escape local minima. Click Play to start the descent!`}
          />
          <div className="bg-workshop-surface rounded-xl p-4 border border-workshop-border space-y-3">
            <div className="text-xs text-workshop-muted space-y-1">
              <div className="flex justify-between">
                <span>Learning Rate</span>
                <span className="font-mono text-workshop-accent3">
                  {lr.toFixed(3)}
                </span>
              </div>
              <input
                type="range"
                min="0.005"
                max="0.8"
                step="0.005"
                value={lr}
                onChange={(e) => setLr(+e.target.value)}
                className="w-full accent-workshop-accent3"
              />
              <div className="flex justify-between">
                <span>Momentum</span>
                <span
                  className={`font-mono ${useMomentum ? "text-workshop-accent2" : "text-workshop-muted"}`}
                >
                  {useMomentum ? momentum.toFixed(2) : "off"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0.1"
                  max="0.95"
                  step="0.05"
                  value={momentum}
                  onChange={(e) => setMomentum(+e.target.value)}
                  disabled={!useMomentum}
                  className="w-full accent-workshop-accent2 flex-1"
                />
                <button
                  onClick={() => setUseMomentum(!useMomentum)}
                  className={`px-2 py-1 text-[10px] rounded cursor-pointer font-bold border ${useMomentum ? "bg-workshop-accent2/20 border-workshop-accent2/30 text-workshop-accent2" : "bg-workshop-border border-workshop-border text-workshop-muted"}`}
                >
                  {useMomentum ? "ON" : "OFF"}
                </button>
              </div>
              <div className="flex justify-between pt-1 border-t border-workshop-border">
                <span>Position</span>
                <span className="font-mono text-workshop-text">
                  ({pos.x.toFixed(2)}, {pos.y.toFixed(2)})
                </span>
              </div>
              <div className="flex justify-between">
                <span>Loss</span>
                <span className="font-mono text-workshop-text">
                  {loss !== null ? loss.toFixed(4) : "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Steps</span>
                <span className="font-mono text-workshop-text">{steps}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {!running ? (
                <button
                  onClick={handlePlay}
                  disabled={
                    steps > 0 &&
                    loss !== null &&
                    loss < 0.05 &&
                    ls.currentLevel >= 2
                  }
                  className="col-span-2 px-3 py-2 bg-workshop-accent3 text-workshop-bg rounded-lg text-xs font-bold cursor-pointer hover:bg-workshop-accent3/90 disabled:opacity-40"
                >
                  ▶ Play
                </button>
              ) : (
                <button
                  onClick={handlePause}
                  className="col-span-2 px-3 py-2 bg-workshop-accent4 text-workshop-bg rounded-lg text-xs font-bold cursor-pointer hover:bg-workshop-accent4/90"
                >
                  ⏸ Pause
                </button>
              )}
              <button
                onClick={handleReset}
                className="px-3 py-2 bg-workshop-border rounded-lg text-xs text-workshop-muted cursor-pointer hover:bg-workshop-surface col-span-2"
              >
                🔄 Reset
              </button>
            </div>
          </div>
          {message && <LiveHint>{message}</LiveHint>}
        </div>
      </div>
    </div>
  );
}
