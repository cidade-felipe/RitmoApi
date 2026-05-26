import { useRef, useState } from 'react';
import { CalendarDays } from 'lucide-react';

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
const completeDisplayDatePattern = /^\d{2}\/\d{2}\/\d{4}$/;

const formatIsoDateToDisplay = (value) => {
  if (!isoDatePattern.test(String(value || ''))) {
    return '';
  }

  const [year, month, day] = String(value).split('-');
  return `${day}/${month}/${year}`;
};

const formatDateDigitsToDisplay = (value) => {
  const digits = String(value ?? '')
    .replace(/\D/g, '')
    .slice(0, 8);

  const day = digits.slice(0, 2);
  const month = digits.slice(2, 4);
  const year = digits.slice(4, 8);

  return [day, month, year].filter(Boolean).join('/');
};

const parseDisplayDateToIso = (value) => {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(value ?? '').trim());
  if (!match) {
    return null;
  }

  const [, dayValue, monthValue, yearValue] = match;
  const day = Number(dayValue);
  const month = Number(monthValue);
  const year = Number(yearValue);

  const date = new Date(year, month - 1, day);
  const isValidDate = date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day;

  if (!isValidDate) {
    return null;
  }

  return `${yearValue}-${monthValue}-${dayValue}`;
};

export function DateField({
  label,
  value,
  onChange,
  required = false,
  disabled = false,
  max,
  min,
  helperText,
  containerStyle,
  containerClassName = '',
  labelClassName = '',
  inputClassName = '',
  shellClassName = '',
  buttonClassName = '',
  buttonMode = 'full',
  buttonAriaLabel,
  allowManualInput = false,
  placeholder = 'dd/mm/aaaa',
  onManualValidationChange
}) {
  const inputRef = useRef(null);
  const pickerInputRef = useRef(null);
  const [manualValue, setManualValue] = useState('');
  const [isManualEditing, setIsManualEditing] = useState(false);
  const [hasInvalidManualValue, setHasInvalidManualValue] = useState(false);
  const displayManualValue = isManualEditing || hasInvalidManualValue
    ? manualValue
    : formatIsoDateToDisplay(value);

  const emitChange = (nextValue) => {
    onChange?.({
      target: {
        value: nextValue
      }
    });
  };

  const handleOpenPicker = () => {
    const pickerTarget = allowManualInput ? pickerInputRef.current : inputRef.current;

    if (disabled || !pickerTarget) {
      return;
    }

    if (typeof pickerTarget.showPicker === 'function') {
      pickerTarget.showPicker();
      return;
    }

    pickerTarget.focus();
  };

  const handleNativeChange = (event) => {
    if (allowManualInput) {
      setManualValue(formatIsoDateToDisplay(event.target.value));
      setIsManualEditing(false);
      setHasInvalidManualValue(false);
      onManualValidationChange?.({ isInvalid: false, value: formatIsoDateToDisplay(event.target.value) });
    }

    onChange?.(event);
  };

  const handleManualFocus = () => {
    setManualValue(hasInvalidManualValue ? manualValue : formatIsoDateToDisplay(value));
    setIsManualEditing(true);
  };

  const updateManualValidity = (formattedValue, isoValue) => {
    const isInvalid = completeDisplayDatePattern.test(formattedValue) && !isoValue;

    setHasInvalidManualValue(isInvalid);
    onManualValidationChange?.({ isInvalid, value: formattedValue });
  };

  const handleManualChange = (event) => {
    const formattedValue = formatDateDigitsToDisplay(event.target.value);
    setManualValue(formattedValue);

    if (!formattedValue) {
      emitChange('');
      updateManualValidity('', null);
      return;
    }

    const isoValue = parseDisplayDateToIso(formattedValue);
    if (isoValue) {
      emitChange(isoValue);
      updateManualValidity(formattedValue, isoValue);
      return;
    }

    emitChange('');
    updateManualValidity(formattedValue, null);
  };

  const handleManualBlur = () => {
    if (!manualValue.trim()) {
      emitChange('');
      updateManualValidity('', null);
      setIsManualEditing(false);
      return;
    }

    const isoValue = parseDisplayDateToIso(manualValue);
    if (!isoValue) {
      emitChange('');
      updateManualValidity(manualValue, null);
      setIsManualEditing(false);
      return;
    }

    setManualValue(formatIsoDateToDisplay(isoValue));
    setIsManualEditing(false);
    updateManualValidity(formatIsoDateToDisplay(isoValue), isoValue);
    emitChange(isoValue);
  };

  return (
    <div className={containerClassName} style={containerStyle}>
      <label className={`input-label ${labelClassName}`.trim()}>{label}</label>
      <div className={`date-input-shell ${shellClassName}`.trim()}>
        {allowManualInput ? (
          <>
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              className={`input-field date-input-field date-input-field-compact ${inputClassName}`.trim()}
              value={displayManualValue}
              onFocus={handleManualFocus}
              onChange={handleManualChange}
              onBlur={handleManualBlur}
              required={required}
              disabled={disabled}
              placeholder={placeholder}
              aria-invalid={hasInvalidManualValue || undefined}
            />
            <input
              ref={pickerInputRef}
              type="date"
              className="date-picker-native-input"
              value={value}
              onChange={handleNativeChange}
              disabled={disabled}
              max={max}
              min={min}
              tabIndex={-1}
              aria-hidden="true"
            />
          </>
        ) : (
          <input
            ref={inputRef}
            type="date"
            className={`input-field date-input-field ${buttonMode === 'icon' ? 'date-input-field-compact' : ''} ${inputClassName}`.trim()}
            value={value}
            onChange={handleNativeChange}
            required={required}
            disabled={disabled}
            max={max}
            min={min}
          />
        )}
        <button
          type="button"
          className={`date-picker-btn ${buttonMode === 'icon' ? 'date-picker-btn-icon' : ''} ${buttonClassName}`.trim()}
          onClick={handleOpenPicker}
          disabled={disabled}
          aria-label={buttonAriaLabel || `Abrir calendário para ${label}`}
        >
          <CalendarDays size={16} />
          {buttonMode !== 'icon' ? <span>Abrir calendário</span> : null}
        </button>
      </div>
      {helperText ? <div className="date-input-helper">{helperText}</div> : null}
    </div>
  );
}
