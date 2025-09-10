import './RadioGroup.styles.css';

export interface RadioGroupOption<T = string> {
  value: T;
  label: string;
  disabled?: boolean;
}

export interface RadioGroupProps<T = string> {
  options: RadioGroupOption<T>[];
  value: T;
  onChange: (value: T) => void;
  name?: string;
  className?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function RadioGroup<T = string>({
  options,
  value,
  onChange,
  name,
  className = '',
  disabled = false,
  size = 'md',
}: RadioGroupProps<T>) {
  const groupName =
    name || `radio-group-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div
      className={`radio-group radio-group-${size} ${className}`}
      role="radiogroup"
    >
      {options.map((option, index) => {
        const isSelected = option.value === value;
        const isDisabled = disabled || option.disabled;
        const optionId = `${groupName}-${index}`;

        return (
          <label
            key={String(option.value)}
            htmlFor={optionId}
            className={`radio-option ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
          >
            <input
              type="radio"
              id={optionId}
              name={groupName}
              value={String(option.value)}
              checked={isSelected}
              disabled={isDisabled}
              onChange={() => !isDisabled && onChange(option.value)}
              className="radio-input"
            />
            <span className="radio-label">{option.label}</span>
          </label>
        );
      })}
    </div>
  );
}

export default RadioGroup;
