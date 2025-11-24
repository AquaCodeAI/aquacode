'use client';

import { forwardRef } from 'react';
import { DatePicker as HUDatePicker, DatePickerProps as HUDatePickerProps } from '@heroui/date-picker';

export const DatePicker = forwardRef<HTMLDivElement, HUDatePickerProps>(function DatePicker(props, ref) {
  return <HUDatePicker {...props} ref={ref} color={props.color ?? 'default'} variant={props.variant ?? 'bordered'} />;
});

export type DatePickerProps = HUDatePickerProps;
