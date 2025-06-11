import Sidebar from "./components/Sidebar";
import MainContent from "./components/MainContent";
import { CloudStageProvider } from "./context/CloudStageContext";
import "./App.css";

function App() {
  return (
    <CloudStageProvider>
      <div className="cloudstage-root">
        <Sidebar />
        <MainContent />
      </div>
    </CloudStageProvider>
  );
}

export default App;
