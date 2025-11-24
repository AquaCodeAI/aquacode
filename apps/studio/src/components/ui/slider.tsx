import { Slider as HeroUISlider } from '@heroui/slider';
import { extendVariants } from '@heroui/system';

export const Slider = extendVariants(HeroUISlider, {
  defaultVariants: {
    color: 'primary',
    key: 'primary',
  },
});
