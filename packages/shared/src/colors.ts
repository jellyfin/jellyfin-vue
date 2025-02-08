export const lightColors = () => ({
  accent: '#FF4081',
  background: '#f2f2f2',
  card: '#FFFFFF',
  tooltip: '#374151',
  chip: '#e4e4e4',
  error: '#FF5252',
  info: '#33b5e5',
  primary: '#9d37c2',
  secondary: '#424242',
  success: '#4CAF50',
  thumb: '#000000',
  warning: '#FB8C00',
  surface: '#f5f5f5'
});

export const darkColors = () => ({
  accent: '#FF4081',
  background: '#111827',
  card: '#1c2331',
  chip: '#4b5563',
  divider: '#374151',
  error: '#FF5252',
  info: '#0099CC',
  menu: '#374151',
  tooltip: '#374151',
  surface: '#1f2937',
  primary: '#9d37c2',
  secondary: '#2f3951',
  success: '#4CAF50',
  thumb: '#252e41',
  warning: '#FB8C00'
});

export type ColorPalette = keyof ReturnType<typeof lightColors> & keyof ReturnType<typeof darkColors>;
