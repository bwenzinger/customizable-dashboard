import type { SystemStyleObject } from '@mui/system';
import type { Theme as MuiTheme } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Theme {
    customStyles: {
      floatingCard: SystemStyleObject<MuiTheme>;
      interactiveCard: SystemStyleObject<MuiTheme>;
      editableGridCanvas: SystemStyleObject<MuiTheme>;
      pagePaddingBottom: SystemStyleObject<MuiTheme>;
      shadowGutter: SystemStyleObject<MuiTheme>;
    };
  }

  interface ThemeOptions {
    customStyles?: {
      floatingCard?: SystemStyleObject<MuiTheme>;
      interactiveCard?: SystemStyleObject<MuiTheme>;
      editableGridCanvas?: SystemStyleObject<MuiTheme>;
      pagePaddingBottom?: SystemStyleObject<MuiTheme>;
      shadowGutter?: SystemStyleObject<MuiTheme>;
    };
  }
}
