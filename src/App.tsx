import { Route, Routes } from 'react-router-dom'
import { GameProvider } from './lib/game-context.tsx'
import { SettingsProvider } from './lib/settings-context.tsx'
import GamePage from './pages/GamePage.tsx'
import RulesPage from './pages/RulesPage.tsx'
import SettingsPage from './pages/SettingsPage.tsx'
import './App.css'

function App() {
  return (
    <SettingsProvider>
      <GameProvider>
        <Routes>
          <Route path="/" element={<GamePage />} />
          <Route path="/rules" element={<RulesPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </GameProvider>
    </SettingsProvider>
  );
};

export default App
