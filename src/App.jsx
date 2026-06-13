import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "./utils/LanguageContext";
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
import ProbabilitySeesaw from "./workbenches/LogisticRegression/ProbabilitySeesaw";
import ShadowPuppets from "./workbenches/PCA/ShadowPuppets";
import TugOfWar from "./workbenches/SVM/TugOfWar";
import SpamOrNot from "./workbenches/NaiveBayes/SpamOrNot";
import UnfoldingOrigami from "./workbenches/TSNE/UnfoldingOrigami";

export default function App() {
  return (
    <LanguageProvider>
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
            <Route
              path="/logistic-regression"
              element={<ProbabilitySeesaw />}
            />
            <Route path="/pca" element={<ShadowPuppets />} />
            <Route path="/svm" element={<TugOfWar />} />
            <Route path="/naive-bayes" element={<SpamOrNot />} />
            <Route path="/tsne" element={<UnfoldingOrigami />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </LanguageProvider>
  );
}
