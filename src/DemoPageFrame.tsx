import type { ReactNode } from 'react';
import { Box, Typography } from '@mui/material';

type DemoPageFrameProps = {
  controls: ReactNode;
  children: ReactNode;
  isEmpty: boolean;
};

export function DemoPageFrame({
  controls,
  children,
  isEmpty,
}: DemoPageFrameProps) {
  return (
    <Box
      component="main"
      sx={{
        minHeight: '100vh',
        width: '100%',
        maxWidth: 1600,
        mx: 'auto',
        px: { xs: 3, sm: 6, lg: 8 },
        py: { xs: 6, md: 10 },
      }}
    >
      <Box component="header" sx={{ maxWidth: 760, mb: 7 }}>
        <Typography
          component="p"
          color="primary.main"
          sx={{
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            mb: 3,
          }}
        >
          Interactive grid demo
        </Typography>
        <Typography
          component="h1"
          sx={{
            fontSize: { xs: 30, md: 40 },
            fontWeight: 750,
            lineHeight: 1.2,
            letterSpacing: '-0.03em',
            mb: 3,
          }}
        >
          A layout you can make your own.
        </Typography>
        <Typography
          color="text.secondary"
          sx={{ fontSize: 16, lineHeight: 1.7 }}
        >
          Explore smooth drag-and-drop and flexible resizing. Move cards into
          place, watch their neighbors make room, and reshape the layout. This
          reusable grid could power a dashboard, a workspace, or a visual board.
        </Typography>
      </Box>

      <Box
        component="section"
        aria-labelledby="product-controls-heading"
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: '16px',
          bgcolor: 'background.paper',
          p: { xs: 4, md: 5 },
          mb: 6,
        }}
      >
        <Typography
          id="product-controls-heading"
          component="h2"
          sx={{ fontSize: 16, fontWeight: 700, mb: 2 }}
        >
          Example product controls
        </Typography>
        <Typography
          color="text.secondary"
          sx={{ fontSize: 14, lineHeight: 1.6, mb: 4 }}
        >
          Add Item supplies example content. Save and Save As keep named
          dashboards in this browser. These controls show one way a product
          could use the interactive grid below.
        </Typography>
        {controls}
      </Box>

      <Box
        component="section"
        aria-labelledby="grid-demo-heading"
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: '16px',
          bgcolor: 'background.paper',
          boxShadow: '0px 6px 24px rgba(16, 24, 40, 0.04)',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            p: { xs: 4, md: 5 },
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography
            id="grid-demo-heading"
            component="h2"
            sx={{ fontSize: 20, fontWeight: 700, mb: 2 }}
          >
            Try the grid
          </Typography>
          <Typography
            color="text.secondary"
            sx={{ fontSize: 14, lineHeight: 1.7 }}
          >
            {isEmpty
              ? 'Start with Add Item above. Then grab a card to move it, or drag its bottom-right corner to resize.'
              : 'Grab a card to move it, or drag its bottom-right corner to resize.'}{' '}
            The bottom handle adds or removes rows. Switch to Viewing to explore
            the finished dashboard.
          </Typography>
        </Box>
        {/* Keep the grid's own scrolling and interaction surface intact inside
            a sized canvas; the surrounding portfolio page can scroll normally. */}
        <Box
          sx={{
            height: 'max(520px, 68vh)',
            p: { xs: 2, md: 4 },
            bgcolor: '#e9eef5',
          }}
        >
          {children}
        </Box>
        <Typography
          component="p"
          color="text.secondary"
          sx={{
            px: { xs: 4, md: 5 },
            py: 3,
            m: 0,
            fontSize: 12,
            lineHeight: 1.6,
            borderTop: '1px solid',
            borderColor: 'divider',
          }}
        >
          Try a new arrangement freely. Undo or Ctrl/Cmd + Z restores a change;
          Collapse and Optimize offer different ways to tidy the layout.
        </Typography>
      </Box>
    </Box>
  );
}
