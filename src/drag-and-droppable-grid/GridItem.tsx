import { Box, useTheme } from '@mui/material';

interface GridItemProps {
  children: React.ReactNode;
}

export function GridItem(props: GridItemProps) {
  const theme = useTheme();
  return (
    <Box sx={{ ...theme.customStyles.floatingCard }}>{props.children}</Box>
  );
}
