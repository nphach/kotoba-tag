import { Route, Routes } from 'react-router-dom'
import GamePage from './pages/GamePage.tsx'
import RulesPage from './pages/RulesPage.tsx'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/" element={<GamePage />} />
      <Route path="/rules" element={<RulesPage />} />
    </Routes>
  );
};

export default App
