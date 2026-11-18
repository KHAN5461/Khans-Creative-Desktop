import React from 'react';
import DesktopEnvironment from './components/DesktopEnvironment';
import { ThemeProvider } from './theme/ThemeContext';
import { SoundProvider } from './contexts/SoundContext';

function App() {
  return (
    <ThemeProvider>
      <SoundProvider>
        <DesktopEnvironment />
      </SoundProvider>
    </ThemeProvider>
  );
}

export default App;
