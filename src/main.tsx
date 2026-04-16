import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './Demo.tsx';
import { CssBaseline, ThemeProvider } from '@mui/material';
import theme from './theme.ts';
import { ClickToComponent } from "click-to-react-component";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
      <ClickToComponent />
    </ThemeProvider>
  </StrictMode>
);
