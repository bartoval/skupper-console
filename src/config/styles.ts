// This file imports design tokens from `@patternfly/react-tokens` and defines:
// 1. `hexColors`: An object that maps semantic color names (e.g., White, Black300) to their corresponding hex color values derived from the PatternFly tokens.
// 2. `styles`: An object containing a `default` style configuration. This configuration utilizes PatternFly tokens for values such as font size, font family, border width, border radius, and color assignments for various semantic purposes (e.g., background, text, info, error, warning). This provides a centralized place to manage and reuse consistent styling throughout the application based on the PatternFly design system.

import {
  t_color_gray_90,
  t_color_gray_50,
  t_color_gray_30,
  t_color_green_50,
  t_color_blue_40,
  t_color_purple_10,
  t_color_purple_50,
  t_color_orange_10,
  t_color_orange_30,
  t_color_orange_70,
  t_color_red_50,
  t_color_red_60,
  t_color_teal_50,
  t_color_white,
  t_global_font_size_body_default,
  t_global_font_family_100,
  t_global_border_width_100,
  t_global_border_radius_large,
  t_global_font_weight_200
} from '@patternfly/react-tokens';

export const hexColors = {
  White: t_color_white.value,
  Black300: t_color_gray_30.value,
  Black500: t_color_gray_50.value,
  Black900: t_color_gray_90.value,
  Blue400: t_color_blue_40.value,
  Purple100: t_color_purple_10.value,
  Purple500: t_color_purple_50.value,
  Orange100: t_color_orange_10.value,
  Orange300: t_color_orange_30.value,
  Orange700: t_color_orange_70.value,
  Red500: t_color_red_50.value,
  Red600: t_color_red_60.value,
  Teal500: t_color_teal_50.value,
  Green500: t_color_green_50.value
};

export const styles = {
  default: {
    fontSize: t_global_font_size_body_default,
    fontLightBold: t_global_font_weight_200,
    fontFamily: t_global_font_family_100.value,
    borderWidth: t_global_border_width_100.value,
    borderRadius: t_global_border_radius_large.value,
    lightBackgroundColor: hexColors.White,
    lightTextColor: hexColors.White,
    darkBackgroundColor: hexColors.Black500,
    darkTextColor: hexColors.Black900,
    infoColor: hexColors.Blue400,
    errorColor: hexColors.Red600,
    warningColor: hexColors.Orange300
  }
};
