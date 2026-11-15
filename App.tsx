import React from 'react';
import DesktopEnvironment from './components/DesktopEnvironment';
import { ThemeProvider } from './theme/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <DesktopEnvironment />
    </ThemeProvider>
  );
}

export default App;
