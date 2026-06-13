import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import ConceptMap from "./components/ConceptMap";
import StretchyRope from "./workbenches/LinearRegression/StretchyRope";
import TwentyQuestions from "./workbenches/DecisionTrees/TwentyQuestions";
import MagneticClusters from "./workbenches/KMeans/MagneticClusters";
import JuryRoom from "./workbenches/Ensemble/JuryRoom";
import LegoBlocks from "./workbenches/NeuralNetworks/LegoBlocks";
import RollerCoaster from "./workbenches/GradientDescent/RollerCoaster";
import SortingMachine from "./workbenches/ConfusionMatrix/SortingMachine";
import EmperorsTailor from "./workbenches/Overfitting/EmperorsTailor";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<ConceptMap />} />
          <Route path="/linear-regression" element={<StretchyRope />} />
          <Route path="/decision-trees" element={<TwentyQuestions />} />
          <Route path="/k-means" element={<MagneticClusters />} />
          <Route path="/ensemble" element={<JuryRoom />} />
          <Route path="/neural-networks" element={<LegoBlocks />} />
          <Route path="/gradient-descent" element={<RollerCoaster />} />
          <Route path="/confusion-matrix" element={<SortingMachine />} />
          <Route path="/overfitting" element={<EmperorsTailor />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
