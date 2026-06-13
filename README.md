# Play & Learn ML — Interactive ML Playground

**Play & Learn ML** turns abstract ML concepts into tangible, interactive playgrounds. Instead of math formulas and static charts, you drag ropes, snap magnets, grow trees, convene juries, stack Lego neurons, ride a roller coaster of gradient descent, sort predictions into confusion bins, and watch a tailor perfectly fit noise.

---

## What You'll Learn — 8 Modules, 5 Levels Each

| Module | Concept | The Metaphor | How You Play |
|---|---|---|---|
| **Stretchy Rope** | Linear Regression | A rope (regression line) pulled by data points like springs | Drag points to see SSE and R² update in real-time |
| **Magnetic Clusters** | K-Means | Magnets (centroids) pulling iron filings (data points) | Place magnets, snap to cluster, watch inertia drop |
| **20 Questions** | Decision Trees | A tree that grows branches as you ask yes/no questions | Click leaves, split on X/Y axes, grow a full tree |
| **Jury Room** | Ensemble Learning | Weak classifier "jurors" voting together | Toggle jurors on the chart, switch voting methods |
| **Lego Blocks** | Neural Networks | 3D Lego bricks you stack into layers | Add layers, change widths, watch signals flow |
| **Roller Coaster** | Gradient Descent | A ball rolling down the loss landscape | Adjust learning rate and momentum, watch the ball find the minimum |
| **Sorting Machine** | Confusion Matrix | Drag predictions into TP/TN/FP/FN bins | Sort cards by actual vs predicted, see accuracy and error types |
| **Emperor's Tailor** | Overfitting | A model that perfectly fits the noise | Adjust polynomial degree — watch train error drop while test error soars |

Each module has **5 progressive levels** — start simple and ramp up to expert challenges.

---

## Quick Start

```bash
npm install
npm run dev
# Open http://localhost:5173
```

For a production build:

```bash
npm run build
npm run preview
```

---

## Architecture

```
src/
├── components/
│   ├── Layout.jsx          # Sidebar nav + router shell
│   ├── ConceptMap.jsx      # Home screen with module cards
│   ├── DefinitionGuide.jsx # Collapsible What/How/Why/What panels
│   └── LevelSystem.jsx     # Reusable 5-level progression system
├── utils/
│   ├── datasets.js         # Toy dataset generators (moons, blobs, circles, XOR)
│   ├── physics.js          # Spring/magnetic force simulation
│   └── scoring.js          # Zustand store for progress/star tracking
└── workbenches/
    ├── LinearRegression/
    │   ├── StretchyRope.jsx # Interactive D3 canvas + panels
    │   └── regression.js    # OLS computation (y = mx + b)
    ├── KMeans/
    │   └── MagneticClusters.jsx
    ├── DecisionTrees/
    │   └── TwentyQuestions.jsx
    ├── Ensemble/
    │   └── JuryRoom.jsx
    ├── NeuralNetworks/
    │   └── LegoBlocks.jsx   # React Three Fiber 3D scene
    ├── GradientDescent/
    │   └── RollerCoaster.jsx # D3 contour plot + animated ball
    ├── ConfusionMatrix/
    │   └── SortingMachine.jsx # D3 drag-and-drop card sorter
    └── Overfitting/
        └── EmperorsTailor.jsx # D3 polynomial regression viewer
```

### Technology Stack

| Technology | Purpose |
|---|---|
| **React 19** | UI framework — component architecture, state management |
| **Vite 8** | Build tool — instant HMR, fast production builds |
| **Tailwind CSS 4** | Utility-first styling — dark theme, responsive layout |
| **D3.js 7** | SVG rendering for all 2D interactive canvases |
| **React Three Fiber** | 3D rendering for the Neural Network module |
| **Three.js** | 3D scene graph — lights, geometry, animations |
| **Zustand** | Lightweight state for progress persistence |
| **React Router** | Client-side routing between modules |

### Data Flow

```
User Interaction (drag, click, toggle)
    │
    ▼
React State (useState, useLevelSystem)
    │
    ├──► D3/Three.js re-render (canvas updates)
    │
    └──► LevelSystem check (auto-detect completion)
            │
            ▼
        Level up! ★  (progress saved to localStorage via Zustand)
```

---

## Key Design Principles

### 1. Physical Metaphors
Every concept maps to a tangible interaction:
- **SSE** → elastic bands that change color (green = small error, pink = large)
- **Inertia** → "messiness" meter that fills up
- **Decision boundary** → colored background grid on the canvas
- **Neuron activation** → glow intensity on 3D blocks
- **Gradient Descent** → a ball rolling down a heatmapped loss landscape
- **Confusion Matrix** → drag-and-drop cards into TP/TN/FP/FN bins
- **Overfitting** → polynomial curve that wiggles through every training point

### 2. Progressive Levels
Each module has 5 auto-detected levels:
- **L1**: Just interact (drag a point, toggle a juror)
- **L2–L4**: Achieve numeric goals (R² > 0.85, inertia < 3.0, etc.)
- **L5**: Expert challenge (perfect fit, minimal splits)

### 3. Learn by Doing
No static explanations — every concept is revealed through interaction:
- Drag a point far from the line → see leverage in action
- Add an outlier → watch the rope bend
- Toggle 1 juror vs 6 → see the decision boundary transform
- Crank the learning rate on gradient descent → watch the ball overshoot and fly off
- Drag a prediction card into the wrong bin → see accuracy drop in real-time
- Slide polynomial degree from 1 to 14 → watch the model go from underfit to overfit

---

## How to Contribute

### Fork & Clone

```bash
git clone https://github.com/harishkotra/play-learn-ml.git
cd play-learn-ml
npm install
npm run dev
```

### Project Conventions

- **No comments in code** — the code should be self-documenting
- **Each module is a single file** under `src/workbenches/<Module>/`
- **Share components** via `src/components/`
- **Use the `useLevelSystem` hook** for adding level progression

### Ideas for New Features

| Feature | Description | Difficulty |
|---|---|---|
| **Logistic Regression** | "Probability Seesaw" — S-curve that separates binary classes | Medium |
| **PCA / Dimensionality Reduction** | "Shadow Puppets" — drag to rotate data and see its projection | Medium |
| **SVM / Support Vectors** | "Tug-of-War" — support vectors are the outermost points holding the margin | Hard |
| **Logistic Regression** | "Probability Seesaw" — S-curve that separates binary classes | Medium |
| **Naive Bayes** | "Spam or Not" — drag emails into categories, see probabilities | Medium |
| **t-SNE / UMAP** | "Unfolding Origami" — watch high-dimensional data unfold into 2D | Hard |
| **Mobile touch support** | Add touch event handlers for tablet/phone interaction | Medium |
| **Multi-language support** | i18n for the definition guide and level prompts | Medium |

### Pull Request Process

1. Open an issue describing your feature
2. Fork the repo and create a branch (`feature/your-idea`)
3. Ensure `npm run build` passes
4. Submit a PR with a clear description of what changed and why

---

*"Tell me and I forget, teach me and I remember, involve me and I learn." — Benjamin Franklin*