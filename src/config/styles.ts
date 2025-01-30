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
  t_global_font_weight_200,
  t_chart_theme_colorscales_multi_colored_ordered_colorscale_100,
  t_chart_theme_colorscales_multi_colored_ordered_colorscale_200,
  t_chart_theme_colorscales_multi_colored_ordered_colorscale_300,
  t_chart_theme_colorscales_multi_colored_ordered_colorscale_400,
  t_chart_theme_colorscales_multi_colored_ordered_colorscale_500,
  t_chart_theme_colorscales_multi_colored_ordered_colorscale_600,
  t_chart_theme_colorscales_multi_colored_ordered_colorscale_700,
  t_chart_theme_colorscales_multi_colored_ordered_colorscale_800,
  t_chart_theme_colorscales_multi_colored_ordered_colorscale_900,
  t_chart_theme_colorscales_multi_colored_ordered_colorscale_1000,
  t_chart_theme_colorscales_multi_colored_ordered_colorscale_1100,
  t_chart_theme_colorscales_multi_colored_ordered_colorscale_1200,
  t_chart_theme_colorscales_multi_colored_ordered_colorscale_1300,
  t_chart_theme_colorscales_multi_colored_ordered_colorscale_1400,
  t_chart_theme_colorscales_multi_colored_ordered_colorscale_1500,
  t_chart_theme_colorscales_multi_colored_ordered_colorscale_1600,
  t_chart_theme_colorscales_multi_colored_ordered_colorscale_1700,
  t_chart_theme_colorscales_multi_colored_ordered_colorscale_1800,
  t_chart_theme_colorscales_multi_colored_ordered_colorscale_1900,
  t_chart_theme_colorscales_multi_colored_ordered_colorscale_2000,
  t_chart_theme_colorscales_multi_colored_ordered_colorscale_2100,
  t_chart_theme_colorscales_multi_colored_ordered_colorscale_2200,
  t_chart_theme_colorscales_multi_colored_ordered_colorscale_2300,
  t_chart_theme_colorscales_multi_colored_ordered_colorscale_2400,
  t_chart_theme_colorscales_multi_colored_ordered_colorscale_2500
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
  Green500: t_color_green_50.value,
  multiChartColor1: t_chart_theme_colorscales_multi_colored_ordered_colorscale_100.value,
  multiChartColor2: t_chart_theme_colorscales_multi_colored_ordered_colorscale_200.value,
  multiChartColor3: t_chart_theme_colorscales_multi_colored_ordered_colorscale_300.value,
  multiChartColor4: t_chart_theme_colorscales_multi_colored_ordered_colorscale_400.value,
  multiChartColor5: t_chart_theme_colorscales_multi_colored_ordered_colorscale_500.value,
  multiChartColor6: t_chart_theme_colorscales_multi_colored_ordered_colorscale_600.value,
  multiChartColor7: t_chart_theme_colorscales_multi_colored_ordered_colorscale_700.value,
  multiChartColor8: t_chart_theme_colorscales_multi_colored_ordered_colorscale_800.value,
  multiChartColor9: t_chart_theme_colorscales_multi_colored_ordered_colorscale_900.value,
  multiChartColor10: t_chart_theme_colorscales_multi_colored_ordered_colorscale_1000.value,
  multiChartColor11: t_chart_theme_colorscales_multi_colored_ordered_colorscale_1100.value,
  multiChartColor12: t_chart_theme_colorscales_multi_colored_ordered_colorscale_1200.value,
  multiChartColor13: t_chart_theme_colorscales_multi_colored_ordered_colorscale_1300.value,
  multiChartColor14: t_chart_theme_colorscales_multi_colored_ordered_colorscale_1400.value,
  multiChartColor15: t_chart_theme_colorscales_multi_colored_ordered_colorscale_1500.value,
  multiChartColor16: t_chart_theme_colorscales_multi_colored_ordered_colorscale_1600.value,
  multiChartColor17: t_chart_theme_colorscales_multi_colored_ordered_colorscale_1700.value,
  multiChartColor18: t_chart_theme_colorscales_multi_colored_ordered_colorscale_1800.value,
  multiChartColor19: t_chart_theme_colorscales_multi_colored_ordered_colorscale_1900.value,
  multiChartColor20: t_chart_theme_colorscales_multi_colored_ordered_colorscale_2000.value,
  multiChartColor21: t_chart_theme_colorscales_multi_colored_ordered_colorscale_2100.value,
  multiChartColor22: t_chart_theme_colorscales_multi_colored_ordered_colorscale_2200.value,
  multiChartColor23: t_chart_theme_colorscales_multi_colored_ordered_colorscale_2300.value,
  multiChartColor24: t_chart_theme_colorscales_multi_colored_ordered_colorscale_2400.value,
  multiChartColor25: t_chart_theme_colorscales_multi_colored_ordered_colorscale_2500.value
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

export function generateChartColorClasses(dataLength?: number): string[] {
  if (!dataLength) {
    return [];
  }

  const colorClasses: string[] = [];
  const colorKeys = Object.keys(hexColors).filter((key) => key.startsWith('multiChartColor'));
  const numColors = colorKeys.length;

  for (let i = 0; i < dataLength; i++) {
    const colorIndex = i % numColors;
    const colorKey = colorKeys[colorIndex] as keyof typeof hexColors;
    const hexColor = hexColors[colorKey];

    colorClasses.push(hexColor);
  }

  return colorClasses;
}
