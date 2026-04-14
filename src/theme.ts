import { createTheme } from '@mui/material/styles';

// const PAGE_PADDING_X = 20;
// const PAGE_PADDING_BOTTOM = 20;
const MAX_SHADOW_HORIZONTAL_GUTTER = 20; // this should be adjusted if customStyles -> interactiveCard boxShadow is updated
const MAX_SHADOW_VERTICAL_GUTTER = 20; // this should be adjusted if customStyles -> interactiveCard boxShadow is updated
const resizeHandleHoverSelector =
  '.draggable-grid-cell:has(.draggable-grid-resize-handle:hover) &';
const interactiveCardHoverStyles = {
  transform: 'translateY(var(--draggable-grid-hover-lift-y, -2px))',
  boxShadow:
    '0px 4px 8px rgba(16, 24, 40, 0.06),0px 12px 24px rgba(16, 24, 40, 0.10)',
  cursor: 'pointer',
};

// Create a theme instance.
let theme = createTheme({
  spacing: 4,
  palette: {
    background: {
      // A modern, cool gray often used in dashboards (Google/Stripe style)
      default: '#F4F6F8',
    },
  },
  components: {
    MuiCard: {
      defaultProps: {
        // Disable default elevation to rely on custom box-shadow
        elevation: 0,
      },
    },
  },
});

// Augment the theme with custom styles that can reference the base theme
theme = createTheme(theme, {
  customStyles: {
    floatingCard: {
      boxShadow:
        '0px 1px 2px rgba(16, 24, 40, 0.04),0px 4px 12px rgba(16, 24, 40, 0.06)',
      borderRadius: '12px',
      backgroundColor: '#ffffff',
      padding: '12px',
      transition:
        'box-shadow 180ms cubic-bezier(0.2, 0, 0, 1),transform 180ms cubic-bezier(0.2, 0, 0, 1)',
    },
    interactiveCard: {
      border: `1px solid ${theme.palette.grey[200]}`,
      borderRadius: '8px',
      ':hover': interactiveCardHoverStyles,
      [resizeHandleHoverSelector]: interactiveCardHoverStyles,
      boxShadow: '0 2px 4px #0000000f',
    },
    shadowGutter: {
      marginX: `-${MAX_SHADOW_HORIZONTAL_GUTTER}px`,
      paddingX: `${MAX_SHADOW_HORIZONTAL_GUTTER}px`,
      paddingBottom: `${MAX_SHADOW_VERTICAL_GUTTER}px`,
    },
  },
});

export default theme;
