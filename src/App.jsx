import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MultiBox from './components/MultiBox';
import ViewListInfo from './components/ViewListInfo';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/multiBox" element={<MultiBox />} />
          <Route path="/viewListInfo" element={<ViewListInfo />} />
          <Route path="/" element={<MultiBox />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
