import { useRef, useEffect, useState, useCallback } from "react";
import * as d3 from "d3";
import { generateMoons } from "../../utils/datasets";
import DefinitionGuide, { LiveHint } from "../../components/DefinitionGuide";
import LevelSystem, { useLevelSystem } from "../../components/LevelSystem";

const W = 700,
  H = 500;
const MARGIN = { top: 30, right: 30, bottom: 30, left: 30 };
const IW = W - MARGIN.left - MARGIN.right;
const IH = H - MARGIN.top - MARGIN.bottom;
const xScale = d3.scaleLinear().domain([-1.5, 2.5]).range([0, IW]);
const yScale = d3.scaleLinear().domain([1.5, -1]).range([0, IH]);
const CLASS_COLORS = ["#6c63ff", "#ff6b9d"];

const LEVELS = [
  {
    title: "First Split",
    objective:
      "Make your first split. Click a leaf node in the tree, then click 'Split X' or 'Split Y'.",
    hint: "Click a white box (leaf) in the mini-tree below the data, then click a split button.",
  },
  {
    title: "Full Grown",
    objective: "Grow a complete tree where every leaf is pure (all one color).",
    hint: "Keep splitting leaves until all show a single color (blue=0, pink=1).",
  },
  {
    title: "Efficient Splitter",
    objective: "Complete the tree using 5 splits or fewer.",
    hint: "Use 'Best Split' each time — it picks the optimal axis and threshold automatically.",
  },
  {
    title: "Eco-Friendly",
    objective: "Complete the tree using exactly 4 splits.",
    hint: "Plan ahead. Each split must separate a large chunk. Use Best Split for efficiency.",
  },
  {
    title: "Minimalist",
    objective: "Complete the tree using only 3 splits — the absolute minimum.",
    hint: "This is hard! Each split must separate almost half the data cleanly. Try different X/Y choices manually.",
  },
];

let nodeId = 0;
function createNode(region, depth = 0) {
  return {
    id: nodeId++,
    region,
    depth,
    split: null,
    left: null,
    right: null,
    isLeaf: true,
    label: null,
    purity: 1,
    count: 0,
  };
}
function gini(points) {
  if (points.length === 0) return 1;
  const counts = {};
  points.forEach((p) => {
    counts[p.label] = (counts[p.label] || 0) + 1;
  });
  const total = points.length;
  let sum = 1;
  for (const c of Object.values(counts)) sum -= (c / total) ** 2;
  return sum;
}

export default function TwentyQuestions() {
  const svgRef = useRef(null);
  const [points] = useState(() => generateMoons(120, 0.12));
  const [tree, setTree] = useState(() => {
    nodeId = 0;
    const root = createNode({ x1: -1.5, x2: 2.5, y1: -1, y2: 1.5 }, 0);
    root.count = points.length;
    root.purity = gini(points);
    root.points = points;
    return root;
  });
  const [selectedNode, setSelectedNode] = useState(null);
  const [splits, setSplits] = useState(0);
  const [message, setMessage] = useState("");
  const ls = useLevelSystem(5);

  const getLeaves = useCallback((node) => {
    if (!node) return [];
    if (node.isLeaf) return [node];
    return [...getLeaves(node.left), ...getLeaves(node.right)];
  }, []);

  const canSplit = useCallback((node) => {
    if (!node || !node.isLeaf) return false;
    if (node.count < 4) return false;
    return new Set(node.points.map((p) => p.label)).size > 1;
  }, []);

  const bestSplit = useCallback(
    (node) => {
      if (!canSplit(node)) return null;
      const pts = node.points;
      const { x1, x2, y1, y2 } = node.region;
      let bestGini = Infinity,
        bestSplit = null,
        bestAxis = "x",
        bestVal = 0;
      for (let i = 0; i < 20; i++) {
        const valX = x1 + ((x2 - x1) * (i + 1)) / 21;
        const lx = pts.filter((p) => p.x <= valX),
          rx = pts.filter((p) => p.x > valX);
        if (lx.length < 2 || rx.length < 2) continue;
        const gX =
          (lx.length / pts.length) * gini(lx) +
          (rx.length / pts.length) * gini(rx);
        if (gX < bestGini) {
          bestGini = gX;
          bestSplit = "x";
          bestVal = valX;
        }
        const valY = y1 + ((y2 - y1) * (i + 1)) / 21;
        const ly = pts.filter((p) => p.y <= valY),
          ry = pts.filter((p) => p.y > valY);
        if (ly.length < 2 || ry.length < 2) continue;
        const gY =
          (ly.length / pts.length) * gini(ly) +
          (ry.length / pts.length) * gini(ry);
        if (gY < bestGini) {
          bestGini = gY;
          bestSplit = "y";
          bestVal = valY;
        }
      }
      return bestSplit
        ? { axis: bestSplit, value: bestVal, gini: bestGini }
        : null;
    },
    [canSplit],
  );

  const performSplit = useCallback((node, axis, value) => {
    const pts = node.points;
    const leftPts = pts.filter((p) =>
      axis === "x" ? p.x <= value : p.y <= value,
    );
    const rightPts = pts.filter((p) =>
      axis === "x" ? p.x > value : p.y > value,
    );
    const { x1, x2, y1, y2 } = node.region;
    const leftRegion =
      axis === "x" ? { x1, x2: value, y1, y2 } : { x1, x2, y1, y2: value };
    const rightRegion =
      axis === "x" ? { x1: value, x2, y1, y2 } : { x1, x2, y1: value, y2 };
    const left = createNode(leftRegion, node.depth + 1);
    const right = createNode(rightRegion, node.depth + 1);
    left.points = leftPts;
    right.points = rightPts;
    left.count = leftPts.length;
    right.count = rightPts.length;
    left.purity = gini(leftPts);
    right.purity = gini(rightPts);
    if (
      leftPts.length === 0 ||
      new Set(leftPts.map((p) => p.label)).size === 1
    ) {
      left.isLeaf = true;
      left.label = leftPts.length > 0 ? leftPts[0].label : 0;
    }
    if (
      rightPts.length === 0 ||
      new Set(rightPts.map((p) => p.label)).size === 1
    ) {
      right.isLeaf = true;
      right.label = rightPts.length > 0 ? rightPts[0].label : 0;
    }
    node.split = { axis, value };
    node.left = left;
    node.right = right;
    node.isLeaf = false;
    node.points = [];
  }, []);

  const checkCompletion = useCallback(
    (newTree, splitCount) => {
      const leaves = getLeaves(newTree);
      const allPure = leaves.every((l) => {
        if (l.count === 0) return true;
        return new Set((l.points || []).map((p) => p.label)).size <= 1;
      });
      if (!allPure || leaves.some((l) => l.count === 0)) return false;

      switch (ls.currentLevel) {
        case 1:
          if (splitCount >= 1 && !ls.justCompleted) {
            ls.completeLevel();
            setMessage(
              "✅ Level 1! You made your first split. Now grow a full tree (L2).",
            );
            return true;
          }
          break;
        case 2:
          if (!ls.justCompleted) {
            ls.completeLevel();
            setMessage(
              "🎉 Level 2! Tree fully grown! Next: do it in ≤5 splits (L3).",
            );
            return true;
          }
          break;
        case 3:
          if (splitCount <= 5 && !ls.justCompleted) {
            ls.completeLevel();
            setMessage("🎉 Level 3! Efficient! Now try ≤4 splits (L4).");
            return true;
          }
          break;
        case 4:
          if (splitCount <= 4 && !ls.justCompleted) {
            ls.completeLevel();
            setMessage(
              "🎉 Level 4! Very efficient! Final challenge: ≤3 splits (L5).",
            );
            return true;
          }
          break;
        case 5:
          if (splitCount <= 3 && !ls.justCompleted) {
            ls.completeLevel();
            setMessage(
              "🏆 All levels complete! You're a Decision Tree master!",
            );
            return true;
          }
          break;
      }
      return false;
    },
    [ls, getLeaves],
  );

  const handleSplit = useCallback(
    (axis) => {
      if (!selectedNode || !canSplit(selectedNode)) return;
      const suggestion = bestSplit(selectedNode);
      if (!suggestion) return;
      performSplit(selectedNode, axis || suggestion.axis, suggestion.value);
      const newRoot = { ...tree };
      setTree(newRoot);
      const newSplits = splits + 1;
      setSplits(newSplits);
      setSelectedNode(null);
      if (!checkCompletion(newRoot, newSplits)) {
        const nextBest = getLeaves(newRoot).filter(canSplit);
        if (nextBest.length > 0) {
          const best = bestSplit(
            nextBest.sort((a, b) => a.purity - b.purity)[0],
          );
          if (best)
            setMessage(
              `Split complete! (${newSplits} used). Try 'Best Split' on another leaf.`,
            );
        }
      }
    },
    [
      selectedNode,
      canSplit,
      bestSplit,
      performSplit,
      tree,
      splits,
      getLeaves,
      checkCompletion,
    ],
  );

  const autoSplit = useCallback(() => {
    if (ls.currentLevel >= 3 && splits >= 4) {
      setMessage("Can't auto-complete — try manual splits for efficiency!");
      return;
    }
    const leaves = getLeaves(tree).filter(canSplit);
    if (leaves.length === 0) {
      setMessage("All leaves are pure!");
      return;
    }
    const best = leaves.reduce((a, b) => {
      const sa = bestSplit(a),
        sb = bestSplit(b);
      return sa && sb && sa.gini < sb.gini ? a : b;
    });
    if (best) {
      setSelectedNode(best);
      setTimeout(() => handleSplit(null), 100);
    }
  }, [
    tree,
    getLeaves,
    canSplit,
    bestSplit,
    handleSplit,
    splits,
    ls.currentLevel,
  ]);

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
    const splitGroup = g.append("g");
    const pointGroup = g.append("g");
    const treeGroup = g.append("g");

    function renderSplits(node) {
      if (!node || node.isLeaf) return;
      const pos =
        node.split.axis === "x"
          ? xScale(node.split.value)
          : yScale(node.split.value);
      splitGroup
        .append("line")
        .attr("x1", node.split.axis === "x" ? pos : 0)
        .attr("y1", node.split.axis === "x" ? 0 : pos)
        .attr("x2", node.split.axis === "x" ? pos : IW)
        .attr("y2", node.split.axis === "x" ? IH : pos)
        .attr("stroke", "#ffd93d")
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "6,4")
        .attr("opacity", 0.7);
      renderSplits(node.left);
      renderSplits(node.right);
    }

    function renderPoints(pts, node) {
      if (!node) return;
      if (node.isLeaf) {
        const inLeaf = pts.filter(
          (p) =>
            p.x >= node.region.x1 &&
            p.x <= node.region.x2 &&
            p.y >= node.region.y1 &&
            p.y <= node.region.y2,
        );
        pointGroup
          .selectAll(`.leaf-${node.id}`)
          .data(inLeaf, (_, i) => i)
          .join("circle")
          .attr("cx", (d) => xScale(d.x))
          .attr("cy", (d) => yScale(d.y))
          .attr("r", 4)
          .attr("fill", (d) => CLASS_COLORS[d.label])
          .attr("opacity", 0.6)
          .attr("stroke", "none");
      } else {
        renderPoints(pts, node.left);
        renderPoints(pts, node.right);
      }
    }

    function renderTreeVisual(node, x, y, width) {
      if (!node) return;
      const color = node.isLeaf
        ? node.label !== null
          ? CLASS_COLORS[node.label]
          : "#2a2a4a"
        : "#6c63ff";
      treeGroup
        .append("rect")
        .attr("x", x - 14)
        .attr("y", y - 8)
        .attr("width", 28)
        .attr("height", 16)
        .attr("rx", 4)
        .attr("fill", color)
        .attr("opacity", node.isLeaf ? 0.8 : 0.6)
        .attr("stroke", selectedNode?.id === node.id ? "#ffd93d" : "none")
        .attr("stroke-width", selectedNode?.id === node.id ? 2 : 0)
        .attr("cursor", canSplit(node) ? "pointer" : "default")
        .on("click", () => {
          if (canSplit(node)) {
            setSelectedNode(node);
            const s = bestSplit(node);
            setMessage(
              s
                ? `Leaf selected (${node.count} pts). Best: ${s.axis} at ${s.value.toFixed(2)} (Gini ${s.gini.toFixed(3)}).`
                : "Pure leaf.",
            );
          }
        });
      treeGroup
        .append("text")
        .attr("x", x)
        .attr("y", y + 4)
        .attr("text-anchor", "middle")
        .attr("fill", "#fff")
        .attr("font-size", 8)
        .attr("font-weight", "bold")
        .text(
          node.isLeaf
            ? node.label !== null
              ? `C${node.label}`
              : `${node.count}`
            : `${node.count}`,
        );
      if (!node.isLeaf && node.left && node.right) {
        const childY = y + 50;
        const childW = width * 0.4;
        treeGroup
          .append("line")
          .attr("x1", x)
          .attr("y1", y + 8)
          .attr("x2", x - childW)
          .attr("y2", childY - 8)
          .attr("stroke", "#2a2a4a")
          .attr("stroke-width", 1);
        treeGroup
          .append("line")
          .attr("x1", x)
          .attr("y1", y + 8)
          .attr("x2", x + childW)
          .attr("y2", childY - 8)
          .attr("stroke", "#2a2a4a")
          .attr("stroke-width", 1);
        renderTreeVisual(node.left, x - childW, childY, childW);
        renderTreeVisual(node.right, x + childW, childY, childW);
      }
    }

    renderSplits(tree);
    renderPoints(points, tree);
    renderTreeVisual(tree, IW / 2, 15, IW / 2);
  }, [tree, selectedNode, points, canSplit, bestSplit]);

  const handleReset = () => {
    nodeId = 0;
    const root = createNode({ x1: -1.5, x2: 2.5, y1: -1, y2: 1.5 }, 0);
    root.count = points.length;
    root.purity = gini(points);
    root.points = points;
    setTree(root);
    setSplits(0);
    setSelectedNode(null);
    setMessage("");
    ls.reset();
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <span>🌳</span> 20 Questions — Decision Trees
          </h1>
          <p className="text-workshop-muted text-sm">
            <strong>Decision Trees</strong> split data with yes/no questions.
            Click a leaf, then choose a split.
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
            title="What are Decision Trees?"
            definition={`A flowchart where each node asks a yes/no question and leaves give predictions.\n\nLike 20 Questions: "Is X > 0.3?" → yes/no → repeat until prediction.`}
            how={`1. Click a leaf in the mini-tree\n2. Choose a split (X vertical, Y horizontal, or Best)\n3. Tree grows branches\n\n**Gini** measures impurity: 0 = pure, 0.5 = 50/50 mix.`}
            why={`Interpretable ML: medical diagnosis, credit scoring, quality control. You can explain why any prediction was made.`}
            what={`Try Best Split for optimal results. Watch the dashed yellow lines carve the space into rectangles — that's the decision boundary.`}
          />
          <div className="bg-workshop-surface rounded-xl p-4 border border-workshop-border">
            <div className="text-xs text-workshop-muted space-y-1 mb-3">
              <div className="flex justify-between">
                <span>Splits</span>
                <span className="font-mono text-workshop-text">{splits}</span>
              </div>
              <div className="flex justify-between">
                <span>Leaves</span>
                <span className="font-mono text-workshop-text">
                  {(() => {
                    let c = 0;
                    function count(n) {
                      if (!n) return;
                      if (n.isLeaf) c++;
                      else {
                        count(n.left);
                        count(n.right);
                      }
                    }
                    count(tree);
                    return c;
                  })()}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => handleSplit("x")}
                disabled={!selectedNode || !canSplit(selectedNode)}
                className="px-2 py-2 bg-workshop-accent/20 border border-workshop-accent/30 text-workshop-accent rounded-lg text-xs cursor-pointer hover:bg-workshop-accent/30 disabled:opacity-30"
              >
                Split X ↕
              </button>
              <button
                onClick={() => handleSplit("y")}
                disabled={!selectedNode || !canSplit(selectedNode)}
                className="px-2 py-2 bg-workshop-accent2/20 border border-workshop-accent2/30 text-workshop-accent2 rounded-lg text-xs cursor-pointer hover:bg-workshop-accent2/30 disabled:opacity-30"
              >
                Split Y ↔
              </button>
              <button
                onClick={() => handleSplit(null)}
                disabled={!selectedNode || !canSplit(selectedNode)}
                className="px-2 py-2 bg-workshop-accent3/20 border border-workshop-accent3/30 text-workshop-accent3 rounded-lg text-xs cursor-pointer hover:bg-workshop-accent3/30 disabled:opacity-30"
              >
                Best Split ⭐
              </button>
              <button
                onClick={autoSplit}
                disabled={splits >= 15}
                className="px-2 py-2 bg-workshop-accent4/20 border border-workshop-accent4/30 text-workshop-accent4 rounded-lg text-xs cursor-pointer hover:bg-workshop-accent4/30 disabled:opacity-30"
              >
                Auto
              </button>
            </div>
            <button
              onClick={handleReset}
              className="w-full mt-2 px-2 py-2 bg-workshop-border rounded-lg text-xs text-workshop-muted cursor-pointer hover:bg-workshop-surface"
            >
              Reset
            </button>
          </div>
          {message && <LiveHint>{message}</LiveHint>}
        </div>
      </div>
    </div>
  );
}
