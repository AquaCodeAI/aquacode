import { heroui, HeroUIPluginConfig } from '@heroui/theme';

const HeroUIConfig: HeroUIPluginConfig = {
  layout: {
    dividerWeight: '1.2px',
    boxShadow: {
      medium: '0px 0px 9px -2px #050A1740',
    },
    radius: {
      small: '5px',
      medium: '10px',
      large: '15px',
    },
  },
  themes: {
    light: {
      colors: {
        foreground: {},
        background: {},
        divider: {},
        content1: {},
        content2: {},
        content3: {},
        focus: {},
        default: {},
        primary: {},
        secondary: {},
        danger: {},
        warning: {},
        success: {},
      },
    },
    dark: {
      colors: {
        foreground: {},
        background: {},
        divider: {},
        content1: {},
        content2: {},
        content3: {},
        focus: {},
        default: {},
        primary: {},
        secondary: {},
        danger: {},
        warning: {},
        success: {},
      },
    },
  },
};

export default heroui(HeroUIConfig);
