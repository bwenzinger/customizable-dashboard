import type { ReactNode } from 'react';
import { Box, Chip, Typography } from '@mui/material';

type DemoPageFrameProps = {
  controls: ReactNode;
  actions: ReactNode;
  settings?: ReactNode;
  children: ReactNode;
  isEmpty: boolean;
};

export function DemoPageFrame({
  controls,
  actions,
  settings,
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
        py: { xs: 4, md: 6 },
      }}
    >
      <Box component="header" sx={{ mb: 5 }}>
        <Typography
          component="h1"
          sx={{
            fontSize: { xs: 28, md: 36 },
            fontWeight: 750,
            lineHeight: 1.2,
            letterSpacing: '-0.03em',
            mb: 2,
          }}
        >
          Drag. Resize. Make it yours.
        </Typography>
        <Typography
          color="text.secondary"
          sx={{ fontSize: 15, lineHeight: 1.6 }}
        >
          Move cards and watch the layout make room. The grid is the demo; the
          widgets are just examples.
        </Typography>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
            mt: 3,
          }}
        >
          <Chip
            label="Built from scratch"
            color="primary"
            size="small"
            sx={{ fontWeight: 700 }}
          />
          <Typography
            component="p"
            color="primary.dark"
            sx={{ fontSize: 13, fontWeight: 600, m: 0 }}
          >
            No drag-and-drop or grid-layout libraries.
          </Typography>
        </Box>
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
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 3,
            p: 4,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box>
            <Typography
              id="grid-demo-heading"
              component="h2"
              sx={{ fontSize: 18, fontWeight: 700, mb: 1 }}
            >
              Try it out
            </Typography>
            <Typography
              color="text.secondary"
              sx={{ fontSize: 13, lineHeight: 1.6 }}
            >
              {isEmpty
                ? 'Add a few cards to try moving and resizing.'
                : 'Drag a card. Resize its bottom-right corner. Undo anytime.'}
            </Typography>
          </Box>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 2,
            }}
          >
            {actions}
          </Box>
        </Box>
        {settings}
        {/* Preserve the grid's own scrolling and interaction surface inside the
            frame. Collapsing the example controls must not remount the grid. */}
        <Box
          sx={{
            height: 'max(420px, 64vh)',
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
            px: 4,
            py: 3,
            m: 0,
            fontSize: 12,
            lineHeight: 1.6,
            borderTop: '1px solid',
            borderColor: 'divider',
          }}
        >
          Bottom handle: more rows. Undo: Ctrl/Cmd + Z. Viewing: lock the
          layout.
        </Typography>
      </Box>

      <Box
        component="details"
        open
        sx={{
          mt: 4,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: '12px',
          bgcolor: 'background.paper',
        }}
      >
        <Box
          component="summary"
          sx={{
            px: 4,
            py: 3,
            cursor: 'pointer',
            color: 'text.secondary',
            '&:focus-visible': {
              outline: '2px solid',
              outlineColor: 'primary.main',
              outlineOffset: 2,
              borderRadius: '12px',
            },
          }}
        >
          <Typography component="span" sx={{ fontSize: 14, fontWeight: 600 }}>
            Example app controls
          </Typography>
          <Typography
            component="span"
            sx={{ ml: 2, fontSize: 12, display: { xs: 'none', sm: 'inline' } }}
          >
            Save and manage layouts in this browser
          </Typography>
        </Box>
        <Box sx={{ p: 4, pt: 0 }}>
          <Typography
            color="text.secondary"
            sx={{ fontSize: 13, lineHeight: 1.6, mb: 3 }}
          >
            An example of how a dashboard app could use the grid. Save layouts
            in this browser, make copies, or start a new dashboard. React and
            MUI provide the UI; the grid interactions are custom-built.
          </Typography>
          {controls}
        </Box>
      </Box>
    </Box>
  );
}
