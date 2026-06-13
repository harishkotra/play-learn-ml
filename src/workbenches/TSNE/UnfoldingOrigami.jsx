import { useRef, useEffect, useState, useMemo, useCallback } from "react";
import * as d3 from "d3";
import DefinitionGuide, { LiveHint } from "../../components/DefinitionGuide";
import LevelSystem, { useLevelSystem } from "../../components/LevelSystem";

const W = 700,
  H = 500;
const MARGIN = { top: 30, right: 30, bottom: 30, left: 30 };
const IW = W - MARGIN.left - MARGIN.right;
const IH = H - MARGIN.top - MARGIN.bottom;
const xs2 = d3.scaleLinear().domain([-3, 3]).range([0, IW]);
const ys2 = d3.scaleLinear().domain([3, -3]).range([0, IH]);

const N_DIMS = 6;
const N_CLUSTERS = 4;
const N_POINTS = 48;

function generateHighDimData() {
  const centers = [];
  for (let c = 0; c < N_CLUSTERS; c++) {
    const center = [];
    for (let d = 0; d < N_DIMS; d++) center.push((Math.random() - 0.5) * 4);
    centers.push(center);
  }
  const data = [];
  const labels = [];
  for (let i = 0; i < N_POINTS; i++) {
    const c = i % N_CLUSTERS;
    const pt = centers[c].map((v) => v + (Math.random() - 0.5) * 0.8);
    data.push(pt);
    labels.push(c);
  }
  return { data, labels };
}

function pairwiseDistances(data) {
  const n = data.length;
  const dist = Array.from({ length: n }, () => new Float64Array(n));
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      let d = 0;
      for (let k = 0; k < data[i].length; k++)
        d += (data[i][k] - data[j][k]) ** 2;
      dist[i][j] = dist[j][i] = Math.sqrt(d);
    }
  }
  return dist;
}

function computeAffinities(dist, perplexity) {
  const n = dist.length;
  const P = Array.from({ length: n }, () => new Float64Array(n));
  for (let i = 0; i < n; i++) {
    let low = 1e-10,
      high = 1e10;
    let sigma = 1;
    for (let iter = 0; iter < 50; iter++) {
      sigma = (low + high) / 2;
      let sum = 0;
      for (let j = 0; j < n; j++) {
        if (i !== j)
          sum += Math.exp(-(dist[i][j] * dist[i][j]) / (2 * sigma * sigma));
      }
      const entropy =
        Math.log(sum) +
        (1 / sum) *
          (() => {
            let s = 0;
            for (let j = 0; j < n; j++) {
              if (i !== j) {
                const d2 = dist[i][j] * dist[i][j];
                const e = Math.exp(-d2 / (2 * sigma * sigma));
                s += (d2 / (2 * sigma * sigma)) * e;
              }
            }
            return s;
          })();
      const Htarget = Math.log(perplexity);
      if (entropy > Htarget) low = sigma;
      else high = sigma;
      if (high - low < 1e-10) break;
    }
    let sum = 0;
    for (let j = 0; j < n; j++) {
      if (i !== j) {
        P[i][j] = Math.exp(-(dist[i][j] * dist[i][j]) / (2 * sigma * sigma));
        sum += P[i][j];
      }
    }
    if (sum > 0) for (let j = 0; j < n; j++) P[i][j] /= sum;
  }
  const P_sym = Array.from({ length: n }, () => new Float64Array(n));
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) P_sym[i][j] = (P[i][j] + P[j][i]) / (2 * n);
  return P_sym;
}

const LEVELS = [
  {
    title: "Watch it Unfold",
    objective:
      "Press 'Unfold' and watch the high-dimensional clusters emerge in 2D.",
    hint: "Data starts as a random mess. Watch the optimization reveal the hidden clusters.",
  },
  {
    title: "See the Clusters",
    objective: "Let it run until at least 3 distinct clusters are visible.",
    hint: "Wait for the optimization to separate the points into clear groups.",
  },
  {
    title: "Adjust Perplexity",
    objective:
      "Change the perplexity and re-run. See how it affects the unfolding.",
    hint: "Lower perplexity = more local structure. Higher = more global structure.",
  },
  {
    title: "Compare Runs",
    objective:
      "Run twice with different perplexity values (5 and 30) and observe the difference.",
    hint: "Low perplexity (5) shows fine detail. High perplexity (30) shows overall shape.",
  },
  {
    title: "Master Unfolder",
    objective: "Achieve a clean 4-cluster separation visible by eye.",
    hint: "Try perplexity around 15-25 — it often works best for 4 balanced clusters.",
  },
];

export default function UnfoldingOrigami() {
  const svgRef = useRef(null);
  const animRef = useRef(null);
  const [hdData] = useState(() => generateHighDimData());
  const [positions, setPositions] = useState(() => {
    const pts = [];
    for (let i = 0; i < N_POINTS; i++)
      pts.push({
        x: (Math.random() - 0.5) * 0.5,
        y: (Math.random() - 0.5) * 0.5,
        label: hdData.labels[i],
      });
    return pts;
  });
  const [iteration, setIteration] = useState(0);
  const [running, setRunning] = useState(false);
  const [perplexity, setPerplexity] = useState(20);
  const [message, setMessage] = useState("");
  const ls = useLevelSystem(5);

  const dists = useMemo(() => pairwiseDistances(hdData.data), [hdData]);
  const P = useMemo(
    () => computeAffinities(dists, perplexity),
    [dists, perplexity],
  );

  const posRef = useRef(positions);
  const iterRef = useRef(0);
  const PRef = useRef(P);

  useEffect(() => {
    posRef.current = positions;
  }, [positions]);
  useEffect(() => {
    PRef.current = P;
  }, [P]);
  useEffect(() => {
    iterRef.current = iteration;
  }, [iteration]);

  const stepTSNE = useCallback(() => {
    const pos = posRef.current.map((p) => ({ ...p }));
    const n = pos.length;
    const grad = Array.from({ length: n }, () => ({ dx: 0, dy: 0 }));
    const qSum = { value: 0 };
    const Q = Array.from({ length: n }, () => new Float64Array(n));

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const dx = pos[i].x - pos[j].x;
        const dy = pos[i].y - pos[j].y;
        const dist2 = dx * dx + dy * dy;
        const q = 1 / (1 + dist2);
        Q[i][j] = Q[j][i] = q;
        qSum.value += 2 * q;
      }
    }

    for (let i = 0; i < n; i++) {
      let gx = 0,
        gy = 0;
      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        const dx = pos[i].x - pos[j].x;
        const dy = pos[i].y - pos[j].y;
        const pqDiff = PRef.current[i][j] - Q[i][j] / (qSum.value || 1);
        const inv = 1 / (1 + dx * dx + dy * dy);
        gx += pqDiff * dx * inv;
        gy += pqDiff * dy * inv;
      }
      grad[i].dx = 4 * gx;
      grad[i].dy = 4 * gy;
    }

    const lr = 200;
    const momentum = 0.6;
    const vel =
      posRef.current._vel || Array.from({ length: n }, () => ({ x: 0, y: 0 }));
    for (let i = 0; i < n; i++) {
      vel[i].x = momentum * vel[i].x - lr * grad[i].dx;
      vel[i].y = momentum * vel[i].y - lr * grad[i].dy;
      pos[i].x += vel[i].x;
      pos[i].y += vel[i].y;
      const clamp = 5;
      pos[i].x = Math.max(-clamp, Math.min(clamp, pos[i].x));
      pos[i].y = Math.max(-clamp, Math.min(clamp, pos[i].y));
    }
    pos._vel = vel;
    posRef.current = pos;
    const ni = iterRef.current + 1;
    iterRef.current = ni;
    if (ni % 2 === 0) {
      setPositions([...pos.map((p) => ({ x: p.x, y: p.y, label: p.label }))]);
      setIteration(ni);
    }
  }, []);

  useEffect(() => {
    if (!running) {
      if (animRef.current) {
        cancelAnimationFrame(animRef.current);
        animRef.current = null;
      }
      return;
    }
    let lastT = 0;
    function tick(t) {
      if (t - lastT > 20) {
        stepTSNE();
        lastT = t;
      }
      if (iterRef.current < 300) animRef.current = requestAnimationFrame(tick);
      else {
        setRunning(false);
        setMessage("Optimization complete! Observe the clusters.");
      }
    }
    animRef.current = requestAnimationFrame(tick);
    return () => {
      if (animRef.current) {
        cancelAnimationFrame(animRef.current);
        animRef.current = null;
      }
    };
  }, [running, stepTSNE]);

  const handleUnfold = () => {
    if (iteration >= 300) {
      const pts = [];
      for (let i = 0; i < N_POINTS; i++)
        pts.push({
          x: (Math.random() - 0.5) * 0.5,
          y: (Math.random() - 0.5) * 0.5,
          label: hdData.labels[i],
        });
      setPositions(pts);
      posRef.current = pts;
      setIteration(0);
      iterRef.current = 0;
    }
    setRunning(true);
    setMessage("");
  };

  const clusterColors = ["#6c63ff", "#ff6b9d", "#45e6c0", "#ffd93d", "#ff8c42"];

  const checkLevel = useCallback(() => {
    const getClusterSpread = (label) => {
      const cluster = positions.filter((p) => p.label === label);
      if (cluster.length < 2) return 0;
      const cx = d3.mean(cluster, (p) => p.x);
      const cy = d3.mean(cluster, (p) => p.y);
      return d3.mean(cluster, (p) =>
        Math.sqrt((p.x - cx) ** 2 + (p.y - cy) ** 2),
      );
    };

    const spreads = hdData.labels
      .filter((v, i, a) => a.indexOf(v) === i)
      .map((l) => getClusterSpread(l));
    const avgSpread = d3.mean(spreads) || 0;

    const betweenClusterDist = () => {
      const labels = hdData.labels.filter((v, i, a) => a.indexOf(v) === i);
      let minDist = Infinity;
      for (let i = 0; i < labels.length; i++) {
        for (let j = i + 1; j < labels.length; j++) {
          const ci = positions.filter((p) => p.label === labels[i]);
          const cj = positions.filter((p) => p.label === labels[j]);
          if (ci.length === 0 || cj.length === 0) continue;
          const cxi = d3.mean(ci, (p) => p.x),
            cyi = d3.mean(ci, (p) => p.y);
          const cxj = d3.mean(cj, (p) => p.x),
            cyj = d3.mean(cj, (p) => p.y);
          const d = Math.sqrt((cxi - cxj) ** 2 + (cyi - cyj) ** 2);
          if (d < minDist) minDist = d;
        }
      }
      return minDist;
    };

    const bcd = betweenClusterDist();
    const separationQuality = bcd / (avgSpread + 0.01);

    switch (ls.currentLevel) {
      case 1:
        if (iteration >= 20 && !ls.justCompleted) {
          ls.completeLevel();
          setMessage(
            "✅ Level 1! The unfolding begins! Watch for clusters (L2).",
          );
          return;
        }
        break;
      case 2:
        if (iteration >= 100 && separationQuality > 1.5 && !ls.justCompleted) {
          ls.completeLevel();
          setMessage(
            "🎉 Level 2! Clusters emerging! Try different perplexity (L3).",
          );
          return;
        }
        break;
      case 3:
        if (iteration >= 100 && !ls.justCompleted) {
          ls.completeLevel();
          setMessage(
            "🎉 Level 3! Perplexity changes the view! Compare 5 vs 30 (L4).",
          );
          return;
        }
        break;
      case 4:
        if (iteration >= 200 && !ls.justCompleted) {
          ls.completeLevel();
          setMessage(
            "🎉 Level 4! Two runs compared! Final: perfect 4-cluster separation (L5).",
          );
          return;
        }
        break;
      case 5:
        if (iteration >= 200 && separationQuality > 3 && !ls.justCompleted) {
          ls.completeLevel();
          setMessage("🏆 All levels complete! You understand t-SNE!");
          return;
        }
        break;
    }
  }, [ls, iteration, positions, hdData]);

  useEffect(() => {
    if (iteration > 0) checkLevel();
  }, [iteration, checkLevel]);

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

    g.append("text")
      .attr("x", IW / 2)
      .attr("y", 14)
      .attr("text-anchor", "middle")
      .attr("fill", "#8888aa")
      .attr("font-size", 10)
      .attr("font-weight", "bold")
      .text(`t-SNE Embedding (${N_DIMS}D → 2D) — Iteration ${iteration}/300`);

    if (iteration === 0 && !running) {
      g.append("text")
        .attr("x", IW / 2)
        .attr("y", IH / 2)
        .attr("text-anchor", "middle")
        .attr("fill", "#8888aa")
        .attr("font-size", 11)
        .attr("opacity", 0.5)
        .text("Click 'Unfold ▶' to start the optimization");
    }

    g.selectAll(".pt")
      .data(positions)
      .join("circle")
      .attr("class", "pt")
      .attr("cx", (d) => xs2(d.x))
      .attr("cy", (d) => ys2(d.y))
      .attr("r", iteration > 0 ? 6 : 3)
      .attr("fill", (d) => clusterColors[d.label % clusterColors.length])
      .attr("stroke", "#fff")
      .attr("stroke-width", 0.5)
      .attr("opacity", iteration > 0 ? 0.85 : 0.3);

    if (iteration > 20) {
      const labels = hdData.labels.filter((v, i, a) => a.indexOf(v) === i);
      labels.forEach((label) => {
        const cluster = positions.filter((p) => p.label === label);
        if (cluster.length < 3) return;
        const cx = d3.mean(cluster, (p) => xs2(p.x));
        const cy = d3.mean(cluster, (p) => ys2(p.y));
        g.append("text")
          .attr("x", cx)
          .attr("y", cy)
          .attr("text-anchor", "middle")
          .attr("fill", clusterColors[label % clusterColors.length])
          .attr("font-size", 11)
          .attr("font-weight", "bold")
          .attr("opacity", 0.5)
          .text(`C${label + 1}`);
      });
    }

    const legX = IW - 155,
      legY = 10;
    g.append("rect")
      .attr("x", legX)
      .attr("y", legY)
      .attr("width", 150)
      .attr("height", 36 + N_CLUSTERS * 15)
      .attr("rx", 6)
      .attr("fill", "#0f0f1a")
      .attr("opacity", 0.85);
    g.append("text")
      .attr("x", legX + 10)
      .attr("y", legY + 14)
      .attr("fill", "#8888aa")
      .attr("font-size", 9)
      .text("High-D Clusters:");
    for (let i = 0; i < N_CLUSTERS; i++) {
      const ly = legY + 28 + i * 15;
      g.append("circle")
        .attr("cx", legX + 10)
        .attr("cy", ly)
        .attr("r", 3)
        .attr("fill", clusterColors[i]);
      g.append("text")
        .attr("x", legX + 20)
        .attr("y", ly + 3)
        .attr("fill", "#8888aa")
        .attr("font-size", 9)
        .text(`Cluster ${i + 1}`);
    }
  }, [positions, iteration, running, hdData, clusterColors]);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <span>🦋</span> Unfolding Origami — t-SNE / UMAP
          </h1>
          <p className="text-workshop-muted text-sm">
            Watch <strong>high-dimensional</strong> data (6D) unfold into 2D —
            like flat origami paper opening into a shape.
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
            title="What is t-SNE?"
            definition={`**t-SNE** (t-Distributed Stochastic Neighbor Embedding) projects high-dimensional data down to 2D for visualization while preserving local neighborhoods.\n\nLike unfolding an origami: the flat paper (2D) reveals the shape (structure) that was hidden in 3D folds.`}
            how={`1. **High-D**: points live in many dimensions (here 6D)\n2. **Similarities**: compute pairwise distances, convert to probabilities\n3. **Perplexity**: controls the balance between local vs global structure\n4. **Embedding**: optimize 2D positions to match high-D probabilities\n5. **Watch it unfold**: random points slowly separate into clusters`}
            why={`t-SNE and UMAP are the standard tools for visualizing high-dimensional data. Used for single-cell genomics (10,000+ genes→2D), NLP embeddings, and exploratory data analysis.`}
            what={`Press "Unfold" to start the optimization. Adjust perplexity and run again to see how it changes the result. Each color is a distinct cluster in the original 6D space.`}
          />
          <div className="bg-workshop-surface rounded-xl p-4 border border-workshop-border space-y-3">
            <div className="text-xs text-workshop-muted space-y-1">
              <div className="flex justify-between">
                <span>Dimensions</span>
                <span className="font-mono text-workshop-text">
                  {N_DIMS}D → 2D
                </span>
              </div>
              <div className="flex justify-between">
                <span>Iteration</span>
                <span className="font-mono text-workshop-text">
                  {iteration}/300
                </span>
              </div>
              <div className="pt-2 border-t border-workshop-border">
                <div className="flex justify-between mb-1">
                  <span>Perplexity</span>
                  <span className="font-mono text-workshop-accent3">
                    {perplexity}
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="1"
                  value={perplexity}
                  onChange={(e) => {
                    setPerplexity(+e.target.value);
                    setMessage("");
                  }}
                  disabled={running}
                  className="w-full accent-workshop-accent3"
                />
                <div className="flex justify-between text-[10px] text-workshop-muted">
                  <span>Local</span>
                  <span>Balanced</span>
                  <span>Global</span>
                </div>
              </div>
              <div className="flex justify-between pt-1 border-t border-workshop-border">
                <span>Data Points</span>
                <span className="font-mono text-workshop-text">{N_POINTS}</span>
              </div>
              <div className="flex justify-between">
                <span>Clusters</span>
                <span className="font-mono text-workshop-text">
                  {N_CLUSTERS}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {!running ? (
                <button
                  onClick={handleUnfold}
                  className="col-span-2 px-3 py-2 bg-workshop-accent3 text-workshop-bg rounded-lg text-xs font-bold cursor-pointer hover:bg-workshop-accent3/90"
                >
                  {iteration > 0 ? "🔄 Re-run" : "▶ Unfold"}
                </button>
              ) : (
                <button
                  onClick={() => setRunning(false)}
                  className="col-span-2 px-3 py-2 bg-workshop-accent4 text-workshop-bg rounded-lg text-xs font-bold cursor-pointer hover:bg-workshop-accent4/90"
                >
                  ⏸ Pause
                </button>
              )}
            </div>
          </div>
          {message && <LiveHint>{message}</LiveHint>}
        </div>
      </div>
    </div>
  );
}
