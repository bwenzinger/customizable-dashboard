import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './Demo.tsx';
import { CssBaseline, ThemeProvider } from '@mui/material';
import theme from './theme.ts';

if (import.meta.env.DEV) {
  // The browser helper reads the dev-only JSX source metadata injected by Vite/Babel.
  void import('click-to-component-browser');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </StrictMode>
);
