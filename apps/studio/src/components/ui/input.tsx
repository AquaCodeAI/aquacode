'use client';

import { ComponentProps } from 'react';
import { Input as HUInput, Textarea as HUTextArea } from '@heroui/input';
import { extendVariants } from '@heroui/system';
import { FormEvent } from 'react';

export const Input = extendVariants(HUInput, {
  variants: {
    variant: {
      base: {
        inputWrapper: 'shadow-none',
      },
    },
    color: {
      default: {
        inputWrapper: 'bg-background-500 border-default',
      },
    },
    size: {
      lg: {
        inputWrapper: 'rounded-medium',
      },
    },
  },

  defaultVariants: {
    color: 'default',
    labelPlacement: 'outside-top',
    variant: 'bordered',
    size: 'lg',
    placeholder: ' ',
  },
});

export const TextArea = extendVariants(HUTextArea, {
  variants: {
    color: {
      default: {
        inputWrapper: 'bg-background-500 border-default',
      },
    },
  },
  defaultVariants: {
    color: 'default',
    labelPlacement: 'outside-top',
    variant: 'bordered',
    size: 'lg',
    placeholder: ' ',
    radius: 'md',
  },
});

export interface NumberInputProps extends Omit<Omit<Omit<InputProps, 'value'>, 'defaultValue'>, 'onValueChange'> {
  value?: number;
  defaultValue?: number;
  maxDecimals?: number;
  onValueChange?: (value: number) => void;
}

export const NumberInput = ({ value, defaultValue, maxDecimals, onValueChange, ...props }: NumberInputProps) => {
  const handleOnInput = (e: FormEvent<HTMLInputElement>) => {
    const target = e.currentTarget;
    const value = target.value;
    if (value.includes('.') && maxDecimals) {
      const [intPart, decimalPart] = value.split('.');
      if (decimalPart.length > maxDecimals) {
        target.value = intPart + '.' + decimalPart.slice(0, maxDecimals);
      }
    }
  };

  return (
    <Input
      value={value?.toString()}
      defaultValue={defaultValue?.toString()}
      type='number'
      onInput={handleOnInput}
      onValueChange={(v) => onValueChange?.(Number(v) || 0)}
      {...props}
    />
  );
};

export type InputProps = ComponentProps<typeof Input>;
export type TextAreaProps = ComponentProps<typeof TextArea>;
