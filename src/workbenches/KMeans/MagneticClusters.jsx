import { useRef, useEffect, useState, useCallback } from "react";
import * as d3 from "d3";
import { generateBlobs } from "../../utils/datasets";
import { magneticForce } from "../../utils/physics";
import DefinitionGuide, { LiveHint } from "../../components/DefinitionGuide";
import LevelSystem, { useLevelSystem } from "../../components/LevelSystem";

const W = 700,
  H = 500;
const MARGIN = { top: 30, right: 30, bottom: 30, left: 30 };
const IW = W - MARGIN.left - MARGIN.right;
const IH = H - MARGIN.top - MARGIN.bottom;
const xScale = d3.scaleLinear().domain([-1, 1]).range([0, IW]);
const yScale = d3.scaleLinear().domain([1, -1]).range([0, IH]);
const CLUSTER_COLORS = [
  "#6c63ff",
  "#ff6b9d",
  "#45e6c0",
  "#ffd93d",
  "#ff8c42",
  "#a78bfa",
];

const LEVELS = [
  {
    title: "First Snap",
    objective:
      "Press 'Snap!' to run K-Means and watch the magnets find their clusters.",
    hint: "Just hit the green 'Snap!' button below and watch the animation.",
  },
  {
    title: "Clean Slate",
    objective: "With K=3, achieve inertia below 3.0.",
    hint: "Drag magnets to better positions, then Snap!. Try placing each magnet near a natural group.",
  },
  {
    title: "Find the Gaps",
    objective: "Increase to K=4 and achieve inertia below 2.0.",
    hint: "Use the + button to add a 4th magnet. Place all 4 carefully, then Snap!",
  },
  {
    title: "Fine Tuner",
    objective: "With K=5, manually place magnets to achieve inertia below 1.5.",
    hint: "5 magnets means one group gets split. Place them close to dense clusters.",
  },
  {
    title: "Master of Clusters",
    objective: "Achieve inertia below 1.0 — nearly perfect clustering.",
    hint: "Every point must be very close to its nearest magnet. Precision placement is key.",
  },
];

export default function MagneticClusters() {
  const svgRef = useRef(null);
  const animRef = useRef(null);
  const [points] = useState(() => generateBlobs(120, 3, 0.35));
  const [centroids, setCentroids] = useState(() => [
    { x: -0.3 + Math.random() * 0.2, y: 0.3 + Math.random() * 0.2 },
    { x: 0.3 + Math.random() * 0.2, y: 0.3 + Math.random() * 0.2 },
    { x: 0 + Math.random() * 0.2, y: -0.3 + Math.random() * 0.2 },
  ]);
  const [k, setK] = useState(3);
  const [inertia, setInertia] = useState(0);
  const [iterating, setIterating] = useState(false);
  const [message, setMessage] = useState("");
  const [hasSnapped, setHasSnapped] = useState(false);

  const ls = useLevelSystem(5);

  const assignClusters = useCallback(
    (pts, cents) =>
      pts.map((p) => {
        let minDist = Infinity,
          best = 0;
        cents.forEach((c, i) => {
          const dx = p.x - c.x,
            dy = p.y - c.y,
            d = dx * dx + dy * dy;
          if (d < minDist) {
            minDist = d;
            best = i;
          }
        });
        return best;
      }),
    [],
  );

  const computeInertia = useCallback((pts, cents, assignments) => {
    let total = 0;
    pts.forEach((p, i) => {
      const c = cents[assignments[i]];
      total += (p.x - c.x) ** 2 + (p.y - c.y) ** 2;
    });
    return total;
  }, []);

  const stepKMeans = useCallback(
    (cents) => {
      const assignments = assignClusters(points, cents);
      const newCents = cents.map((_, ci) => {
        const members = points.filter((_, i) => assignments[i] === ci);
        return members.length === 0
          ? { ...cents[ci] }
          : {
              x: members.reduce((s, p) => s + p.x, 0) / members.length,
              y: members.reduce((s, p) => s + p.y, 0) / members.length,
            };
      });
      return {
        centroids: newCents,
        assignments,
        inertia: computeInertia(points, newCents, assignments),
      };
    },
    [points, assignClusters, computeInertia],
  );

  const checkLevel = () => {
    switch (ls.currentLevel) {
      case 1:
        if (hasSnapped && !ls.justCompleted) {
          ls.completeLevel();
          setMessage(
            "✅ Level 1! You saw K-Means in action. Now aim for inertia < 3.0 (L2).",
          );
        }
        break;
      case 2:
        if (k === 3 && inertia < 3.0 && !ls.justCompleted) {
          ls.completeLevel();
          setMessage(
            "🎉 Level 2! Clean clusters. Now try K=4 with even lower inertia (L3).",
          );
        }
        break;
      case 3:
        if (k >= 4 && inertia < 2.0 && !ls.justCompleted) {
          ls.completeLevel();
          setMessage(
            "🎉 Level 3! Great clustering. Push to K=5 and inertia < 1.5 for L4.",
          );
        }
        break;
      case 4:
        if (k >= 5 && inertia < 1.5 && !ls.justCompleted) {
          ls.completeLevel();
          setMessage(
            "🎉 Level 4! Fine tuning complete. Final challenge: inertia < 1.0!",
          );
        }
        break;
      case 5:
        if (inertia < 1.0 && !ls.justCompleted) {
          ls.completeLevel();
          setMessage("🏆 All levels complete! You're a K-Means master!");
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
    g.append("rect")
      .attr("width", IW)
      .attr("height", IH)
      .attr("fill", "#1a1a2e")
      .attr("rx", 8);
    const fieldGroup = g.append("g");
    const pointGroup = g.append("g");
    const centroidGroup = g.append("g");

    function renderField(cents) {
      fieldGroup.selectAll("*").remove();
      for (let gx = 0; gx <= IW; gx += 12) {
        for (let gy = 0; gy <= IH; gy += 12) {
          const wx = xScale.invert(gx),
            wy = yScale.invert(gy);
          let fx = 0,
            fy = 0;
          cents.forEach((c) => {
            const f = magneticForce({ x: wx, y: wy }, c, 0.08, 0.02);
            fx += f.x;
            fy += f.y;
          });
          const len = Math.sqrt(fx * fx + fy * fy) || 1;
          fieldGroup
            .append("line")
            .attr("x1", gx)
            .attr("y1", gy)
            .attr("x2", gx + (fx / len) * 6)
            .attr("y2", gy + (fy / len) * 6)
            .attr("stroke", "#6c63ff")
            .attr("stroke-width", 0.4)
            .attr("opacity", 0.15);
        }
      }
    }

    function render(pts, cents, assignments) {
      pointGroup
        .selectAll(".data-point")
        .data(pts, (_, i) => i)
        .join("circle")
        .attr("cx", (d) => xScale(d.x))
        .attr("cy", (d) => yScale(d.y))
        .attr("r", 5)
        .attr(
          "fill",
          (_, i) => CLUSTER_COLORS[assignments[i] % CLUSTER_COLORS.length],
        )
        .attr("opacity", 0.7)
        .attr("stroke", "#fff")
        .attr("stroke-width", 0.5);

      const mags = centroidGroup
        .selectAll(".centroid")
        .data(cents, (_, i) => i);
      mags.exit().remove();
      const magsEnter = mags.enter().append("g").attr("class", "centroid");
      const magGroup = magsEnter.merge(mags);
      magGroup.selectAll(".mag-pulse").remove();
      magGroup.each(function (d, i) {
        for (let r = 0; r < 3; r++)
          d3.select(this)
            .append("circle")
            .attr("cx", xScale(d.x))
            .attr("cy", yScale(d.y))
            .attr("r", 14 + r * 8)
            .attr("fill", "none")
            .attr("stroke", CLUSTER_COLORS[i % CLUSTER_COLORS.length])
            .attr("stroke-width", 1.5)
            .attr("opacity", 0.3 - r * 0.08);
      });
      magGroup.selectAll(".mag-circle").remove();
      magGroup
        .append("circle")
        .attr("cx", (d) => xScale(d.x))
        .attr("cy", (d) => yScale(d.y))
        .attr("r", 10)
        .attr("fill", (_, i) => CLUSTER_COLORS[i % CLUSTER_COLORS.length])
        .attr("stroke", "#fff")
        .attr("stroke-width", 2)
        .attr("cursor", "grab");
      magGroup.selectAll(".mag-label").remove();
      magGroup
        .append("text")
        .attr("x", (d) => xScale(d.x))
        .attr("y", (d) => yScale(d.y) + 4)
        .attr("text-anchor", "middle")
        .attr("fill", "#fff")
        .attr("font-size", 11)
        .attr("font-weight", "bold")
        .text((_, i) => `C${i + 1}`);
      magGroup.call(
        d3
          .drag()
          .on("start", function () {
            d3.select(this).select(".mag-circle").attr("stroke-width", 3);
          })
          .on("drag", function (event, d, i) {
            const rect = svgRef.current.getBoundingClientRect();
            const nx = xScale.invert(
              Math.max(
                0,
                Math.min(
                  IW,
                  event.sourceEvent.clientX - rect.left - MARGIN.left,
                ),
              ),
            );
            const ny = yScale.invert(
              Math.max(
                0,
                Math.min(IH, event.sourceEvent.clientY - rect.top - MARGIN.top),
              ),
            );
            d.x = nx;
            d.y = ny;

            const cx = xScale(nx);
            const cy = yScale(ny);

            const g = d3.select(this);
            g.selectAll(".mag-circle").attr("cx", cx).attr("cy", cy);
            g.selectAll(".mag-label")
              .attr("x", cx)
              .attr("y", cy + 4);
            g.selectAll(".mag-pulse").attr("cx", cx).attr("cy", cy);

            const assignments = assignClusters(points, cents);
            setInertia(computeInertia(points, cents, assignments));

            pointGroup
              .selectAll(".data-point")
              .attr(
                "fill",
                (_, pi) =>
                  CLUSTER_COLORS[assignments[pi] % CLUSTER_COLORS.length],
              );

            fieldGroup.selectAll("*").remove();
            const step = 12;
            for (let gx = 0; gx <= IW; gx += step) {
              for (let gy = 0; gy <= IH; gy += step) {
                const wx = xScale.invert(gx),
                  wy = yScale.invert(gy);
                let fx = 0,
                  fy = 0;
                cents.forEach((c) => {
                  const f = magneticForce({ x: wx, y: wy }, c, 0.08, 0.02);
                  fx += f.x;
                  fy += f.y;
                });
                const len = Math.sqrt(fx * fx + fy * fy) || 1;
                fieldGroup
                  .append("line")
                  .attr("x1", gx)
                  .attr("y1", gy)
                  .attr("x2", gx + (fx / len) * 6)
                  .attr("y2", gy + (fy / len) * 6)
                  .attr("stroke", "#6c63ff")
                  .attr("stroke-width", 0.4)
                  .attr("opacity", 0.15);
              }
            }
          })
          .on("end", function () {
            d3.select(this).select(".mag-circle").attr("stroke-width", 2);
            setCentroids(cents.map((c) => ({ ...c })));
          }),
      );
    }

    const initialAssign = assignClusters(points, centroids);
    renderField(centroids);
    render(points, centroids, initialAssign);
    setInertia(computeInertia(points, centroids, initialAssign));
    return () => {
      if (animRef.current) clearInterval(animRef.current);
    };
  }, [points]);

  const runIteration = () => {
    if (iterating) return;
    setIterating(true);
    let currentCents = centroids.map((c) => ({ ...c }));
    let step = 0;
    if (animRef.current) clearInterval(animRef.current);
    animRef.current = setInterval(() => {
      const result = stepKMeans(currentCents);
      currentCents = result.centroids;
      setCentroids(currentCents);
      setInertia(result.inertia);
      const svg = d3.select(svgRef.current);
      const g = svg.select("g");
      g.select(".point-group")
        .selectAll(".data-point")
        .transition()
        .duration(400)
        .attr("cx", (d, i) =>
          xScale(currentCents[result.assignments[i]]?.x || d.x),
        )
        .attr("cy", (d, i) =>
          yScale(currentCents[result.assignments[i]]?.y || d.y),
        )
        .attr(
          "fill",
          (_, i) =>
            CLUSTER_COLORS[result.assignments[i] % CLUSTER_COLORS.length],
        );
      g.select(".centroid-group")
        .selectAll(".centroid")
        .each(function (d, i) {
          const el = d3.select(this);
          el.selectAll(".mag-circle")
            .transition()
            .duration(400)
            .attr("cx", xScale(currentCents[i]?.x || d.x))
            .attr("cy", yScale(currentCents[i]?.y || d.y));
          el.selectAll(".mag-label")
            .transition()
            .duration(400)
            .attr("x", xScale(currentCents[i]?.x || d.x))
            .attr("y", yScale(currentCents[i]?.y || d.y) + 4);
          el.selectAll(".mag-pulse")
            .transition()
            .duration(400)
            .attr("cx", xScale(currentCents[i]?.x || d.x))
            .attr("cy", yScale(currentCents[i]?.y || d.y));
        });
      step++;
      if (step >= 15) {
        clearInterval(animRef.current);
        animRef.current = null;
        setIterating(false);
        if (!hasSnapped) setHasSnapped(true);
        checkLevel();
        if (result.inertia < 1.5)
          setMessage(
            (prev) =>
              prev ||
              `✨ Inertia = ${result.inertia.toFixed(2)} — tight clusters!`,
          );
        else
          setMessage(
            (prev) =>
              prev ||
              `Inertia = ${result.inertia.toFixed(2)}. ${ls.currentLevel >= 2 ? "Try better magnet placement." : "Great first run!"}`,
          );
      }
    }, 600);
  };

  const changeK = (delta) => {
    const newK = Math.max(2, Math.min(6, k + delta));
    if (newK === k) return;
    setK(newK);
    ls.reset();
    setCentroids(
      Array.from({ length: newK }, () => ({
        x: (Math.random() - 0.5) * 1.2,
        y: (Math.random() - 0.5) * 1.2,
      })),
    );
    setHasSnapped(false);
    setMessage(
      `K changed to ${newK}. Levels reset — work through them with K=${newK}.`,
    );
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <span>🧲</span> Magnetic Clusters — K-Means
          </h1>
          <p className="text-workshop-muted text-sm">
            <strong>K-Means</strong> groups similar points into clusters.
            Magnets = centroids. Drag them and snap!
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
            title="What is K-Means Clustering?"
            definition={`**K-Means** partitions data into K groups. Each has a **centroid** (center).\n\nGoal: minimize **inertia** — sum of squared distances from each point to its centroid. Lower = better.`}
            how={`**1. Assign** — each point snaps to nearest magnet\n**2. Update** — magnets move to average position\n**3. Repeat** — until convergence\n\nThe field lines show pull direction.`}
            why={`Customer segmentation, image compression, anomaly detection, recommendation systems. Fast, simple, works on millions of points.`}
            what={`Drag magnets, change K, press Snap! Try different placements — K-Means is sensitive to starting positions.`}
          />
          <div className="bg-workshop-surface rounded-xl p-4 border border-workshop-border">
            <div className="flex justify-between text-xs text-workshop-muted mb-2">
              <span>Inertia ↓</span>
              <span className="font-mono text-workshop-text">
                {inertia.toFixed(2)}
              </span>
            </div>
            <div className="h-2 bg-workshop-bg rounded-full overflow-hidden mb-3">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, (inertia / 8) * 100)}%`,
                  background:
                    inertia < 2
                      ? "#45e6c0"
                      : inertia < 4
                        ? "#ffd93d"
                        : "#ff6b9d",
                }}
              />
            </div>
            <div className="flex items-center gap-2 justify-between mb-2">
              <span className="text-xs text-workshop-muted">K:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => changeK(-1)}
                  className="w-7 h-7 bg-workshop-border rounded flex items-center justify-center text-xs cursor-pointer hover:bg-workshop-accent/30"
                >
                  −
                </button>
                <span className="font-mono text-sm w-4 text-center text-workshop-text">
                  {k}
                </span>
                <button
                  onClick={() => changeK(1)}
                  className="w-7 h-7 bg-workshop-border rounded flex items-center justify-center text-xs cursor-pointer hover:bg-workshop-accent/30"
                >
                  +
                </button>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={runIteration}
                disabled={iterating}
                className="flex-1 px-3 py-2 bg-workshop-accent3/20 border border-workshop-accent3/30 text-workshop-accent3 rounded-lg text-xs cursor-pointer hover:bg-workshop-accent3/30 disabled:opacity-50"
              >
                {iterating ? "Snapping..." : "⚡ Snap!"}
              </button>
              <button
                onClick={() => {
                  setCentroids(
                    Array.from({ length: k }, () => ({
                      x: (Math.random() - 0.5) * 1.2,
                      y: (Math.random() - 0.5) * 1.2,
                    })),
                  );
                  setMessage("Magnets randomized.");
                }}
                className="flex-1 px-3 py-2 bg-workshop-accent2/20 border border-workshop-accent2/30 text-workshop-accent2 rounded-lg text-xs cursor-pointer hover:bg-workshop-accent2/30"
              >
                Randomize
              </button>
            </div>
          </div>
          {message && <LiveHint>{message}</LiveHint>}
        </div>
      </div>
    </div>
  );
}
