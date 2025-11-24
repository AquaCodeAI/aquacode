import { ReactNode, ChangeEvent } from 'react';
import { Input, Switch } from '@/components/ui';
import { cn } from '@/utils/cn';

interface WorkspaceModalDetailRowProps {
  label: string;
  value?: string | number | boolean;
  isFirst?: boolean;
  isEditable?: boolean;
  onChange?: (value: any) => void;
  placeholder?: string;
  type?: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'textarea';
  required?: boolean;
  maxLength?: number;
  options?: string[];
  children?: ReactNode;
}

// UI Configuration
const INPUT_SIZE = 'sm';
const TEXTAREA_DEFAULT_ROWS = 3;

// Fallback Values
const FALLBACK_EMPTY_VALUE = '';
const FALLBACK_NUMBER_VALUE = 0;
const FALLBACK_DISPLAY_VALUE = '—';

// UI Labels
const LABEL_SELECT_PREFIX = 'Select ';
const LABEL_REQUIRED_INDICATOR = '*';

export function WorkspaceModalDetailRow({
  label,
  value,
  isFirst = false,
  isEditable = false,
  onChange,
  placeholder,
  type = 'text',
  required = false,
  maxLength,
  options,
  children,
}: WorkspaceModalDetailRowProps) {
  const stringValue = String(value ?? FALLBACK_EMPTY_VALUE);
  const booleanValue = Boolean(value);

  const handleSwitchChange = (checked: boolean) => {
    onChange?.(checked);
  };

  const handleSelectChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onChange?.(event.target.value);
  };

  const handleTextareaChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onChange?.(event.target.value);
  };

  const handleNumberChange = (val: string) => {
    onChange?.(val ? Number(val) : FALLBACK_NUMBER_VALUE);
  };

  const handleTextChange = (val: string) => {
    onChange?.(val);
  };

  const renderBooleanField = () => {
    return <Switch isSelected={booleanValue} onValueChange={handleSwitchChange} />;
  };

  const renderSelectField = () => {
    if (!options) return null;

    return (
      <select
        value={stringValue}
        onChange={handleSelectChange}
        required={required}
        className={cn(
          'w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900',
          'focus:border-neutral-900 focus:outline-none',
          'dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:focus:border-white'
        )}
      >
        <option value={FALLBACK_EMPTY_VALUE}>
          {LABEL_SELECT_PREFIX}
          {label}
        </option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  };

  const renderTextareaField = () => {
    return (
      <textarea
        value={stringValue}
        onChange={handleTextareaChange}
        placeholder={placeholder}
        required={required}
        maxLength={maxLength}
        rows={TEXTAREA_DEFAULT_ROWS}
        className={cn(
          'w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900',
          'focus:border-neutral-900 focus:outline-none',
          'dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:focus:border-white'
        )}
      />
    );
  };

  const renderNumberField = () => {
    return (
      <Input
        type='number'
        variant='flat'
        value={stringValue}
        onValueChange={handleNumberChange}
        placeholder={placeholder}
        isRequired={required}
        size={INPUT_SIZE}
      />
    );
  };

  const renderDateField = () => {
    return (
      <Input
        type='date'
        variant='flat'
        value={stringValue}
        onValueChange={handleTextChange}
        placeholder={placeholder}
        isRequired={required}
        size={INPUT_SIZE}
      />
    );
  };

  const renderTextField = () => {
    return (
      <Input
        type='text'
        variant='flat'
        value={stringValue}
        onValueChange={handleTextChange}
        placeholder={placeholder}
        isRequired={required}
        maxLength={maxLength}
        size={INPUT_SIZE}
      />
    );
  };

  const renderEditableContent = () => {
    switch (type) {
      case 'boolean':
        return renderBooleanField();
      case 'select':
        return renderSelectField();
      case 'textarea':
        return renderTextareaField();
      case 'number':
        return renderNumberField();
      case 'date':
        return renderDateField();
      case 'text':
      default:
        return renderTextField();
    }
  };

  const renderReadOnlyContent = () => {
    const hasValue = value !== undefined && value !== null;
    const displayValue = hasValue ? String(value) : FALLBACK_DISPLAY_VALUE;

    return (
      <div className='scrollbar-hide w-auto overflow-x-auto pl-4 text-right whitespace-nowrap text-neutral-800 dark:text-white'>
        {displayValue}
      </div>
    );
  };

  const renderContent = () => {
    if (children) {
      return children;
    }

    if (isEditable) {
      return <div className='max-w-md flex-1'>{renderEditableContent()}</div>;
    }

    return renderReadOnlyContent();
  };

  const showBorderTop = !isFirst;
  const showRequiredIndicator = required && isEditable;

  return (
    <div
      className={`flex items-center justify-between px-2.5 py-2 text-sm transition-colors ${showBorderTop ? 'border-t border-neutral-200 dark:border-white/20' : ''}`}
    >
      <span className='mr-5 font-normal text-neutral-900 dark:text-white'>
        {label}
        {showRequiredIndicator && <span className='ml-1 text-red-500'>{LABEL_REQUIRED_INDICATOR}</span>}
      </span>
      {renderContent()}
    </div>
  );
}
