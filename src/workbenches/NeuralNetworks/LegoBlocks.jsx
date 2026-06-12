import { useRef, useEffect, useState, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";
import { generateXOR } from "../../utils/datasets";
import DefinitionGuide, { LiveHint } from "../../components/DefinitionGuide";
import LevelSystem, { useLevelSystem } from "../../components/LevelSystem";

const W = 700,
  H = 500;
const CLASS_COLORS = ["#6c63ff", "#ff6b9d"];

const LEVELS = [
  {
    title: "First Signal",
    objective:
      "Run a forward pass on the default network (2→4→1). Watch the neurons glow!",
    hint: "Just click the 'Run Forward Pass' button and watch the magic.",
  },
  {
    title: "Hidden Power",
    objective: "Add a hidden layer (any size), then run a forward pass.",
    hint: "Click '+ Add Layer' then 'Run Forward Pass'. The network is now deeper!",
  },
  {
    title: "Deep Thinker",
    objective:
      "Create a network with 3+ hidden layers (4+ total layers) and run a forward pass.",
    hint: "Keep adding layers until you have 4+ total. Deeper = more complex patterns.",
  },
  {
    title: "Wide Load",
    objective: "Make a hidden layer with 6+ neurons and run a forward pass.",
    hint: "Use the + button on any hidden layer to grow it. Wide layers learn more features.",
  },
  {
    title: "The Architect",
    objective: "Build a network with 5+ total layers and run a forward pass.",
    hint: "Stack layer upon layer. A 5-layer network is a deep neural network!",
  },
];

function NeuronBlock({
  position,
  activation,
  label,
  color,
  size = 0.3,
  blockType,
}) {
  const meshRef = useRef(null);
  useFrame((state) => {
    if (meshRef.current) {
      const pulse =
        0.85 +
        0.15 *
          Math.sin(state.clock.elapsedTime * 2 + position[0] + position[1]);
      const intensity = activation !== undefined ? activation : pulse;
      meshRef.current.material.emissiveIntensity = 0.2 + intensity * 0.8;
      meshRef.current.scale.setScalar(0.9 + intensity * 0.1);
    }
  });
  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <boxGeometry
          args={[
            size,
            size * (blockType === "input" ? 0.6 : 1),
            size * (blockType === "output" ? 0.6 : 1),
          ]}
        />
        <meshStandardMaterial
          color={color || "#6c63ff"}
          emissive={color || "#6c63ff"}
          emissiveIntensity={0.3}
          metalness={0.3}
          roughness={0.4}
        />
      </mesh>
      {label !== undefined && (
        <Text
          position={[0, -size * 0.8, 0]}
          fontSize={0.08}
          color="#8888aa"
          anchorX="center"
          anchorY="middle"
        >
          {label}
        </Text>
      )}
    </group>
  );
}

function Connection({ from, to, weight, isActive }) {
  const curve = useMemo(() => {
    const mid = [
      (from[0] + to[0]) / 2,
      (from[1] + to[1]) / 2 + 0.15,
      (from[2] + to[2]) / 2,
    ];
    return new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(...from),
      new THREE.Vector3(...mid),
      new THREE.Vector3(...to),
    );
  }, [from, to]);
  return (
    <mesh>
      <tubeGeometry
        args={[curve, 8, 0.008 + (weight || 0.5) * 0.015, 8, false]}
      />
      <meshStandardMaterial
        color={isActive ? "#45e6c0" : "#2a2a4a"}
        transparent
        opacity={isActive ? 0.6 : 0.2}
      />
    </mesh>
  );
}

function XORDataGrid({ inputPoints }) {
  return (
    <group position={[0, -1.3, 0]}>
      {inputPoints.map((p, i) => (
        <mesh key={i} position={[p.x * 1.2, p.y * 1.2, 0]}>
          <circleGeometry args={[0.04, 12]} />
          <meshBasicMaterial color={CLASS_COLORS[p.label]} />
        </mesh>
      ))}
      <Text
        position={[0, -0.15, 0]}
        fontSize={0.06}
        color="#8888aa"
        anchorX="center"
        anchorY="middle"
      >
        XOR — needs a hidden layer to solve!
      </Text>
    </group>
  );
}

function Scene({ architecture, activations, connections, forwardPass }) {
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <directionalLight position={[-3, 5, -3]} intensity={0.4} />
      <pointLight position={[0, 3, 0]} intensity={0.3} color="#6c63ff" />
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        minDistance={1}
        maxDistance={6}
      />
      <group>
        {architecture.map((layer, li) => {
          const layerX = (li - (architecture.length - 1) / 2) * 1.0;
          return layer.neurons.map((neuron, ni) => (
            <NeuronBlock
              key={`${li}-${ni}`}
              position={[
                layerX,
                (ni - (layer.neurons.length - 1) / 2) * 0.5,
                0,
              ]}
              activation={activations[`${li}-${ni}`]}
              label={neuron.label}
              color={neuron.color}
              blockType={
                li === 0
                  ? "input"
                  : li === architecture.length - 1
                    ? "output"
                    : "hidden"
              }
            />
          ));
        })}
        {connections.map((conn, i) => (
          <Connection key={i} {...conn} isActive={forwardPass} />
        ))}
      </group>
    </>
  );
}

export default function LegoBlocks() {
  const [points] = useState(() => generateXOR(80, 0.15));
  const [layers, setLayers] = useState([2, 4, 1]);
  const [activations, setActivations] = useState({});
  const [forwardPass, setForwardPass] = useState(false);
  const [message, setMessage] = useState("");
  const [hasRunForward, setHasRunForward] = useState(false);
  const ls = useLevelSystem(5);

  const architecture = useMemo(
    () =>
      layers.map((count, li) => ({
        neurons: Array.from({ length: count }, (_, ni) => {
          let label = "",
            color = "#6c63ff";
          if (li === 0) {
            label = ni === 0 ? "X" : "Y";
            color = "#6c63ff";
          } else if (li === layers.length - 1) {
            label = "out";
            color = "#ff6b9d";
          } else {
            label = `H${ni + 1}`;
            color = "#45e6c0";
          }
          return { label, color };
        }),
      })),
    [layers],
  );

  const connections = useMemo(() => {
    const conns = [];
    for (let li = 0; li < architecture.length - 1; li++) {
      const currLayer = architecture[li],
        nextLayer = architecture[li + 1];
      const lx1 = (li - (architecture.length - 1) / 2) * 1.0,
        lx2 = (li + 1 - (architecture.length - 1) / 2) * 1.0;
      currLayer.neurons.forEach((_, ni) => {
        nextLayer.neurons.forEach((_, nj) => {
          conns.push({
            from: [lx1, (ni - (currLayer.neurons.length - 1) / 2) * 0.5, 0],
            to: [lx2, (nj - (nextLayer.neurons.length - 1) / 2) * 0.5, 0],
            weight: Math.random(),
          });
        });
      });
    }
    return conns;
  }, [architecture]);

  const checkLevel = () => {
    switch (ls.currentLevel) {
      case 1:
        if (hasRunForward && !ls.justCompleted) {
          ls.completeLevel();
          setMessage(
            "✅ Level 1! Signals are flowing! Now add a hidden layer (L2).",
          );
        }
        break;
      case 2:
        if (hasRunForward && layers.length >= 3 && !ls.justCompleted) {
          ls.completeLevel();
          setMessage(
            "🎉 Level 2! Hidden layer added! Now make it deep — 3+ hidden layers (L3).",
          );
        }
        break;
      case 3:
        if (hasRunForward && layers.length >= 4 && !ls.justCompleted) {
          ls.completeLevel();
          setMessage(
            "🎉 Level 3! Deep network! Now make a layer wide — 6+ neurons (L4).",
          );
        }
        break;
      case 4:
        if (hasRunForward && layers.some((l) => l >= 6) && !ls.justCompleted) {
          ls.completeLevel();
          setMessage(
            "🎉 Level 4! Wide and powerful! Final challenge: 5+ total layers (L5).",
          );
        }
        break;
      case 5:
        if (hasRunForward && layers.length >= 5 && !ls.justCompleted) {
          ls.completeLevel();
          setMessage(
            "🏆 All levels complete! You're a Neural Network Architect!",
          );
        }
        break;
    }
  };

  const simulateForward = () => {
    setForwardPass(true);
    const newActivations = {};
    for (let li = 0; li < architecture.length; li++) {
      architecture[li].neurons.forEach((_, ni) => {
        newActivations[`${li}-${ni}`] = 0.2 + Math.random() * 0.8;
      });
    }
    setActivations(newActivations);
    if (!hasRunForward) setHasRunForward(true);
    checkLevel();
    setMessage(
      "⚡ Signal flowing through the network! Each neuron glows based on its activation.",
    );
    setTimeout(() => {
      setActivations({});
      setForwardPass(false);
    }, 3000);
  };

  const addLayer = () => {
    const newLayers = [...layers];
    newLayers.splice(newLayers.length - 1, 0, 3);
    setLayers(newLayers);
    setMessage(
      `Added a hidden layer! Architecture: ${newLayers.join(" → ")}. Run forward pass to see it in action.`,
    );
  };

  const removeLayer = () => {
    if (layers.length <= 2) return;
    const newLayers = [...layers];
    newLayers.splice(newLayers.length - 2, 1);
    setLayers(newLayers);
  };

  const changeNeurons = (idx, delta) => {
    const newLayers = [...layers];
    const newCount = Math.max(1, Math.min(8, newLayers[idx] + delta));
    if (newCount === newLayers[idx]) return;
    newLayers[idx] = newCount;
    setLayers(newLayers);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <span>🧱</span> Lego Blocks — Neural Networks
          </h1>
          <p className="text-workshop-muted text-sm">
            <strong>Neural Networks</strong> stack neuron layers to learn
            complex patterns. Build your network like Lego!
          </p>
        </div>
        <span className="text-xs text-workshop-muted bg-workshop-surface px-3 py-1 rounded-full border border-workshop-border">
          Level {ls.currentLevel}/5
        </span>
      </div>
      <div className="flex gap-6">
        <div
          className="rounded-xl overflow-hidden"
          style={{ width: W, height: H }}
        >
          <Canvas camera={{ position: [0, 0, 3.5], fov: 45 }}>
            <Scene
              architecture={architecture}
              activations={activations}
              connections={connections}
              forwardPass={forwardPass}
            />
            <XORDataGrid inputPoints={points} />
          </Canvas>
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
            title="What are Neural Networks?"
            definition={`Connected "neurons" in layers. Each neuron receives signals, processes them, and passes them forward.\n\n**Input → Hidden → Output**: patterns flow through the network.`}
            how={`**1. Stack layers** — add hidden layers\n**2. Change width** — add more neurons\n**3. Run forward pass** — watch signals flow\n\nNeurons glow brighter when activated. Connections = weighted signals.`}
            why={`Universal function approximators. Powering: image recognition, language models, game AI, drug discovery. Can learn ANY pattern with enough layers.`}
            what={`Add layers, change widths, run forward passes. Rotate the 3D view with your mouse to see the full architecture.`}
          />
          <div className="bg-workshop-surface rounded-xl p-4 border border-workshop-border">
            <div className="flex justify-between text-xs text-workshop-muted mb-2">
              <span>Architecture</span>
              <span className="font-mono text-workshop-text text-sm">
                {layers.join(" → ")}
              </span>
            </div>
            <div className="space-y-1.5 mb-3">
              {layers.map((count, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-xs text-workshop-muted"
                >
                  <span>
                    {i === 0
                      ? "Input"
                      : i === layers.length - 1
                        ? "Output"
                        : `Hidden ${i}`}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => changeNeurons(i, -1)}
                      className="w-5 h-5 bg-workshop-border rounded flex items-center justify-center text-[10px] cursor-pointer hover:bg-workshop-accent/30"
                    >
                      −
                    </button>
                    <span className="font-mono w-3 text-center text-workshop-text">
                      {count}
                    </span>
                    <button
                      onClick={() => changeNeurons(i, 1)}
                      className="w-5 h-5 bg-workshop-border rounded flex items-center justify-center text-[10px] cursor-pointer hover:bg-workshop-accent/30"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mb-2">
              <button
                onClick={addLayer}
                className="flex-1 px-2 py-2 bg-workshop-accent3/20 border border-workshop-accent3/30 text-workshop-accent3 rounded-lg text-xs cursor-pointer hover:bg-workshop-accent3/30"
              >
                + Add Layer
              </button>
              <button
                onClick={removeLayer}
                disabled={layers.length <= 2}
                className="flex-1 px-2 py-2 bg-workshop-accent2/20 border border-workshop-accent2/30 text-workshop-accent2 rounded-lg text-xs cursor-pointer hover:bg-workshop-accent2/30 disabled:opacity-30"
              >
                − Remove
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={simulateForward}
                disabled={forwardPass}
                className="flex-1 px-2 py-2 bg-workshop-accent/20 border border-workshop-accent/30 text-workshop-accent rounded-lg text-xs cursor-pointer hover:bg-workshop-accent/30 disabled:opacity-50"
              >
                {forwardPass ? "⚡ Flowing..." : "▶ Run Forward Pass"}
              </button>
              <button
                onClick={() => {
                  setLayers([2, 4, 1]);
                  ls.reset();
                  setHasRunForward(false);
                  setMessage("");
                }}
                className="flex-1 px-2 py-2 bg-workshop-border rounded-lg text-xs text-workshop-muted cursor-pointer hover:bg-workshop-surface"
              >
                Reset
              </button>
            </div>
          </div>
          {message && <LiveHint>{message}</LiveHint>}
        </div>
      </div>
    </div>
  );
}
