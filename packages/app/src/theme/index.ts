import {
  createUnifiedTheme,
  createBaseThemeOptions,
  genPageTheme,
  palettes,
} from '@backstage/theme';

import * as tokens from "@bcgov/design-tokens/js";

export const bcDesignSystemTheme = createUnifiedTheme({
  ...createBaseThemeOptions({
    palette: {
      ...palettes.light,
      background: {
        default: tokens.surfaceColorBackgroundWhite,
        paper: tokens.surfaceColorBackgroundLightGray,
      },
      text: {
        primary: '#2D2D2D',
        secondary: '#474543',
        disabled: '#9F9D9C',
        link: '#255A90',
        placeholder: '#9F9D9C',
      },
      primary: {
        main: '#013366',
      },
      secondary: {
        main: '#FCBA19',
      },
      navigation: {
        background: '#013366',
        indicator: '#FCBA19',
        color: '#FFFFFF',
        selectedColor: '#FFFFFF',
        navItem: {
          hoverBackground: '#1E5189',
        },
      },
    },
  }),
  pageTheme: {
    home: genPageTheme({
      colors: [tokens.surfaceColorBackgroundWhite],
      options: {
        fontColor: tokens.typographyColorPrimary,
      },
      shape: 'none',
    }),
  },
});
