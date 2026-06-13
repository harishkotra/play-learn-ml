# Play & Learn ML — Interactive ML Playground

**Play & Learn ML** turns abstract ML concepts into tangible, interactive playgrounds. Instead of math formulas and static charts, you drag ropes, snap magnets, grow trees, convene juries, stack Lego neurons, ride a roller coaster, sort predictions, unfold high-dimensional origami, and play tug-of-war with support vectors — all in your browser.

13 modules. 5 levels each. 4 languages. Zero math formulas.

---

## What You'll Learn — 13 Modules, 5 Levels Each

| Module | Concept | The Metaphor | How You Play |
|---|---|---|---|
| **Stretchy Rope** | Linear Regression | A rope pulled by data points like springs | Drag points to see SSE and R² update in real-time |
| **Magnetic Clusters** | K-Means | Magnets pulling iron filings | Place centroids, snap to cluster, watch inertia drop |
| **20 Questions** | Decision Trees | A tree branching with yes/no questions | Click leaves, split axes, grow a full tree |
| **Jury Room** | Ensemble Learning | Weak classifiers voting together | Toggle jurors, switch voting methods |
| **Lego Blocks** | Neural Networks | 3D Lego bricks stacked into layers | Add layers, change widths, watch signals glow |
| **Roller Coaster** | Gradient Descent | A ball rolling down the loss landscape | Adjust LR & momentum, watch the ball find the minimum |
| **Sorting Machine** | Confusion Matrix | Drag cards into TP/TN/FP/FN bins | Sort by actual vs predicted, see accuracy and error types |
| **Emperor's Tailor** | Overfitting | A model that perfectly fits noise | Slide polynomial degree — watch train error drop while test error soars |
| **Probability Seesaw** | Logistic Regression | S-curve separating two classes | Fit a sigmoid, see probability contours balance |
| **Shadow Puppets** | PCA | Points casting shadows on a line | Drag to rotate PC1, maximize variance captured |
| **Tug-of-War** | SVM | Support vectors holding the margin | Add/remove points, watch the margin expand and contract |
| **Spam or Not** | Naive Bayes | Sorting emails by word probabilities | Drag emails into categories, watch Bayes' rule update |
| **Unfolding Origami** | t-SNE / UMAP | High-D data unfolding into 2D | Adjust perplexity, watch clusters emerge from 6D → 2D |

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
│   ├── Layout.jsx             # Sidebar nav + language switcher + mobile toggle
│   ├── ConceptMap.jsx         # Home screen with module cards
│   ├── DefinitionGuide.jsx    # Collapsible What/How/Why/What panels (i18n)
│   ├── LevelSystem.jsx        # Reusable 5-level progression system (i18n)
│   └── LanguageSwitcher.jsx   # EN / ES / FR / 中文 toggle
├── utils/
│   ├── datasets.js            # Toy dataset generators (moons, blobs, circles, XOR)
│   ├── physics.js             # Spring/magnetic force simulation
│   ├── scoring.js             # Zustand store for progress/star tracking
│   ├── i18n.js                # 4-language translation dictionaries
│   └── LanguageContext.jsx    # React context for locale + localStorage
└── workbenches/
    ├── LinearRegression/      # StretchyRope.jsx (+ regression.js for OLS)
    ├── KMeans/                # MagneticClusters.jsx
    ├── DecisionTrees/         # TwentyQuestions.jsx
    ├── Ensemble/              # JuryRoom.jsx
    ├── NeuralNetworks/        # LegoBlocks.jsx (React Three Fiber)
    ├── GradientDescent/       # RollerCoaster.jsx (contour + GD animation)
    ├── ConfusionMatrix/       # SortingMachine.jsx (drag-drop bins)
    ├── Overfitting/           # EmperorsTailor.jsx (polynomial regression)
    ├── LogisticRegression/    # ProbabilitySeesaw.jsx (sigmoid + gradient descent)
    ├── PCA/                   # ShadowPuppets.jsx (drag-rotate projections)
    ├── SVM/                   # TugOfWar.jsx (click to add/remove points, margin)
    ├── NaiveBayes/            # SpamOrNot.jsx (drag-sort, word probabilities)
    └── TSNE/                  # UnfoldingOrigami.jsx (t-SNE KL optimization)
```

### Technology Stack

| Technology | Purpose |
|---|---|---|
| **React 19** | UI framework — component architecture, state management |
| **Vite 8** | Build tool — instant HMR, fast production builds |
| **Tailwind CSS 4** | Utility-first styling — dark theme, responsive layout |
| **D3.js 7** | SVG rendering for all 2D interactive canvases |
| **React Three Fiber** | 3D rendering for the Neural Network module |
| **Three.js** | 3D scene graph — lights, geometry, animations |
| **Zustand** | Lightweight state for progress persistence |
| **React Router** | Client-side routing between modules |
| **i18n** | 4-language support (EN, ES, FR, 中文) with localStorage persistence |

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
- **Logistic Regression** → a sigmoid-shaped seesaw balancing two classes
- **PCA** → rotating a line while points cast perpendicular "shadow" projections
- **SVM** → glowing support vectors holding up a margin like ropes in a tug-of-war
- **Naive Bayes** → sorting physical mail while word probabilities tick up and down
- **t-SNE** → origami paper unfolding from a crumpled ball into a flat shape

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
- Crank the learning rate on gradient descent → watch the ball fly off the landscape
- Drag a prediction card into the wrong bin → see accuracy drop in real-time
- Slide polynomial degree from 1 to 14 → watch the model go from underfit to overfit
- Rotate the PCA line → see the variance bar fill up as you find the optimal angle
- Click near the SVM decision boundary → watch the margin shrink as you add a point
- Sort an email into Spam → see "free" and "win" word probabilities spike
- Press "Unfold" on t-SNE → watch random noise crystallize into distinct clusters

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
| **K-Nearest Neighbors** | "Voting Neighbors" — click a point, see its K nearest neighbors vote on its class | Easy |
| **DBSCAN Clustering** | "Crowds & Outliers" — adjust epsilon density, watch clusters form and outliers appear | Medium |
| **Random Forest** | "Forest of Stumps" — grow many shallow trees and watch them vote together | Medium |
| **Gradient Boosting** | "Fix the Mistakes" — each new tree focuses on correcting the previous tree's errors | Hard |
| **Reinforcement Learning** | "Maze Rat" — a rat learns which turns lead to cheese through trial and error | Hard |
| **Attention Mechanism** | "Spotlight" — drag a spotlight across text to see which words the model focuses on | Hard |
| **Cross-Validation** | "Fold the Data" — split data into folds, train on some, test on others, rotate | Medium |
| **Feature Engineering** | "Kitchen Sink" — mix, combine, and transform features to improve model performance | Medium |
| **Regularization (L1/L2)** | "Weight Watcher" — add a penalty term and watch coefficients shrink toward zero | Medium |
| **Activation Functions** | "Shape Shifter" — toggle ReLU, sigmoid, tanh, see how each squashes or gates signals | Easy |
| **Batch Normalization** | "Level Adjuster" — normalize layer outputs, watch training stabilize before your eyes | Medium |
| **Collaborative Filtering** | "Book Club" — find users similar to you, recommend what they liked that you haven't read | Medium |
| **GANs (Generative)** | "Art Forger" — a forger and a detective compete; the forger gets better at faking paintings | Hard |

### Pull Request Process

1. Open an issue describing your feature
2. Fork the repo and create a branch (`feature/your-idea`)
3. Ensure `npm run build` passes
4. Submit a PR with a clear description of what changed and why

#### Screenshots

<img width="1741" height="2227" alt="screencapture-localhost-8501-2026-06-12-00_00_48" src="https://github.com/user-attachments/assets/5fad9696-bff7-4e58-a2d4-a3c339a727da" />
<img width="1740" height="1272" alt="screencapture-localhost-5173-linear-regression-2026-06-12-21_07_43" src="https://github.com/user-attachments/assets/01dc687d-7216-4b32-a4f5-9c74dc42ae90" />
<img width="1740" height="1272" alt="screencapture-localhost-5173-decision-trees-2026-06-12-21_07_47" src="https://github.com/user-attachments/assets/ddf1151c-bcc3-4a2a-bd1f-86ca5447c9d6" />
<img width="1740" height="1272" alt="screencapture-localhost-5173-k-means-2026-06-12-21_07_56" src="https://github.com/user-attachments/assets/655e84aa-7b57-410e-a736-1052adc2946d" />
<img width="1740" height="1343" alt="screencapture-localhost-5173-ensemble-2026-06-12-21_08_06" src="https://github.com/user-attachments/assets/c85d5502-2c0f-47e9-9887-0f4b87b8812f" />
<img width="1740" height="1272" alt="screencapture-localhost-5173-neural-networks-2026-06-12-21_08_29" src="https://github.com/user-attachments/assets/9212a092-2924-483d-9cfb-a720a27236fe" />
<img width="1660" height="995" alt="screencapture-localhost-5173-gradient-descent-2026-06-13-23_42_32" src="https://github.com/user-attachments/assets/ad92f79b-c86b-4950-b548-09a6ce9bf867" />
<img width="1660" height="995" alt="screencapture-localhost-5173-confusion-matrix-2026-06-13-23_42_44" src="https://github.com/user-attachments/assets/af58baf7-3a1d-4f59-873d-e6411e151c94" />
<img width="1660" height="995" alt="screencapture-localhost-5173-overfitting-2026-06-13-23_42_50" src="https://github.com/user-attachments/assets/91892128-9497-45fa-9228-03367c83dd58" />
<img width="1660" height="1173" alt="screencapture-play-learn-ml-vercel-app-2026-06-13-23_52_46" src="https://github.com/user-attachments/assets/7b9ba221-9881-4695-be3d-7fdbb77e0826" />
<img width="1660" height="995" alt="screencapture-localhost-5173-pca-2026-06-14-00_09_44" src="https://github.com/user-attachments/assets/6f2f9065-0988-490b-a833-1ce710a868a6" />
<img width="1660" height="995" alt="screencapture-localhost-5173-logistic-regression-2026-06-14-00_09_38" src="https://github.com/user-attachments/assets/b3ed42c3-cab2-4a04-9627-7c03ba31227e" />
<img width="1660" height="995" alt="screencapture-localhost-5173-tsne-2026-06-14-00_10_34" src="https://github.com/user-attachments/assets/f2ffd1ea-576d-447b-b1e1-b2382d353c12" />
<img width="1660" height="995" alt="screencapture-localhost-5173-svm-2026-06-14-00_09_55" src="https://github.com/user-attachments/assets/fddcb6d9-b059-4085-a0d5-c97242ef5cdd" />
<img width="1660" height="995" alt="screencapture-localhost-5173-naive-bayes-2026-06-14-00_10_09" src="https://github.com/user-attachments/assets/fe19818e-95f4-4ef3-8c4c-4addd518e601" />

---

*"Tell me and I forget, teach me and I remember, involve me and I learn." — Benjamin Franklin*
