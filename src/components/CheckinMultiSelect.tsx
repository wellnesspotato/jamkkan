import { useEffect, useId, useRef, useState } from 'react'
import { CHECKIN_COPY } from '../constants/checkinConfig'

type CheckinMultiSelectProps = {
  options: readonly string[]
  selected: string[]
  customValue: string
  customEnabled: boolean
  onChange: (values: string[]) => void
  onCustomValueChange: (value: string) => void
  onCustomEnabledChange: (enabled: boolean) => void
  disabled?: boolean
}

function CheckinMultiSelect({
  options,
  selected,
  customValue,
  customEnabled,
  onChange,
  onCustomValueChange,
  onCustomEnabledChange,
  disabled = false,
}: CheckinMultiSelectProps) {
  const customInputId = useId()
  const customInputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (customEnabled) {
      customInputRef.current?.focus()
    }
  }, [customEnabled])

  const toggleOption = (option: string) => {
    onChange(
      selected.includes(option)
        ? selected.filter((value) => value !== option)
        : [...selected, option],
    )
  }

  const handleCustomChange = (value: string) => {
    const previousCustomValue = customValue.trim()
    const nextCustomValue = value.trim()

    onCustomValueChange(value)
    onChange([
      ...selected.filter((selectedValue) => selectedValue !== previousCustomValue),
      ...(nextCustomValue === '' ? [] : [nextCustomValue]),
    ])
  }

  const toggleCustom = () => {
    if (customEnabled) {
      const previousCustomValue = customValue.trim()
      onCustomEnabledChange(false)
      onChange(
        selected.filter((selectedValue) => selectedValue !== previousCustomValue),
      )
      return
    }

    const nextCustomValue = customValue.trim()
    onCustomEnabledChange(true)
    if (nextCustomValue !== '' && !selected.includes(nextCustomValue)) {
      onChange([...selected, nextCustomValue])
    }
  }

  return (
    <div className="checkin-options">
      {options.map((option) => {
        const isSelected = selected.includes(option)

        return (
          <button
            className="checkin-option"
            type="button"
            key={option}
            aria-pressed={isSelected}
            data-selected={isSelected}
            disabled={disabled}
            onClick={() => toggleOption(option)}
          >
            {option}
          </button>
        )
      })}
      <button
        className="checkin-option"
        type="button"
        aria-pressed={customEnabled}
        aria-expanded={customEnabled}
        aria-controls={customInputId}
        data-selected={customEnabled}
        disabled={disabled}
        onClick={toggleCustom}
      >
        {CHECKIN_COPY.customOption}
      </button>
      {customEnabled && (
        <input
          ref={customInputRef}
          id={customInputId}
          className="checkin-custom-input"
          type="text"
          value={customValue}
          onChange={(event) => handleCustomChange(event.target.value)}
          aria-label={CHECKIN_COPY.customInputLabel}
          placeholder={CHECKIN_COPY.customInputPlaceholder}
          disabled={disabled}
        />
      )}
    </div>
  )
}

export default CheckinMultiSelect
