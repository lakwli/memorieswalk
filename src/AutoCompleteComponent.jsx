import React, { useState, useRef } from 'react';
import { Autocomplete, TextField } from '@mui/material';

//still have problem of typing C to list down canada and china with canada prefill

const AutoCompleteComponent = ({
  options,
  label,
  placeholder,
  variant = 'outlined',
  onValueChange,
  ...props
}) => {
  const [typedValue, setTypedValue] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [filteredOptions, setFilteredOptions] = useState(options);
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);
  const isDeletingRef = useRef(false);

  const handleInputChange = (event, newInputValue, reason) => {
    if (reason === 'reset') { 
      // Option selected from the list
      setTypedValue(newInputValue);
      setInputValue(newInputValue);
      if (onValueChange) {
        onValueChange(newInputValue);
      }
      setOpen(false); // Close the options list after selection
    } else if (reason === 'clear') {
      // User cleared the input
      setTypedValue('');
      setInputValue('');
      setFilteredOptions(options);
      if (onValueChange) {
        onValueChange('');
      }
      setOpen(false); // Close the options list when input is cleared
    } else {
      if (isDeletingRef.current) {
        // User is deleting, do not perform autofill
        setTypedValue(newInputValue);
        setInputValue(newInputValue);
        setOpen(newInputValue.length > 0); // Open if input is not empty

        // Update filtered options based on new input
        const newFilteredOptions = options.filter((option) =>
          option.toLowerCase().startsWith(newInputValue.toLowerCase())
        );
        setFilteredOptions(newFilteredOptions);
      } else {
        // User is typing, perform autofill
        setTypedValue(newInputValue);
        if (newInputValue.length > 0) {
          const matches = options.filter((option) =>
            option.toLowerCase().startsWith(newInputValue.toLowerCase())
          );
          if (matches.length > 0) {
            const firstMatch = matches[0];
            setInputValue(firstMatch);

            setTimeout(() => {
              if (inputRef.current) {
                inputRef.current.setSelectionRange(
                  newInputValue.length,
                  firstMatch.length
                );
              }
            }, 0);

            setFilteredOptions(matches); // Update filtered options
            setOpen(true); // Open the options list when there are matches
          } else {
            setInputValue(newInputValue);
            setFilteredOptions([]); // No matches
            setOpen(false); // Close the options list if no matches
          }
        } else {
          setInputValue('');
          setFilteredOptions(options); // Reset to full options list
          setOpen(false); // Close the options list if input is empty
        }
      }
    }

    // Reset the deleting flag after handling input change
    isDeletingRef.current = false;
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Backspace' || event.key === 'Delete') {
      isDeletingRef.current = true;
    }

    if (event.key === 'Enter') {
      // Accept the suggestion
      if (onValueChange) {
        onValueChange(inputValue);
      }
      setOpen(false); // Close the options list
    } else if (event.key === 'ArrowRight' || event.key === 'Tab') {
      // Move cursor to the end
      if (inputRef.current) {
        const length = inputValue.length;
        inputRef.current.setSelectionRange(length, length);
      }
    } else if (event.key === 'ArrowDown') {
      // Open the options list when the down arrow key is pressed
      event.preventDefault(); // Prevent default cursor move
      setOpen(true);
    }
  };

  // Render the input, making sure to correctly assign refs
  const renderInput = (params) => (
    <TextField
      {...params}
      label={label}
      placeholder={placeholder}
      variant={variant}
      onKeyDown={handleKeyDown}
      inputRef={(node) => {
        inputRef.current = node;

        // Ensure MUI's internal ref is preserved
        if (params.InputProps.ref) {
          if (typeof params.InputProps.ref === 'function') {
            params.InputProps.ref(node);
          } else if (
            params.InputProps.ref &&
            'current' in params.InputProps.ref
          ) {
            params.InputProps.ref.current = node;
          }
        }
      }}
      inputProps={{
        ...params.inputProps,
        autoComplete: 'off', // Disable browser autocomplete
      }}
    />
  );

  return (
    <Autocomplete
      freeSolo
      options={filteredOptions} // Use filtered options
      inputValue={inputValue}
      onInputChange={handleInputChange}
      open={open} // Control the open state
      disableOpenOnFocus // Prevent opening on focus
      onClose={() => setOpen(false)} // Close when an option is selected or clicking outside
      renderInput={renderInput}
      {...props}
    />
  );
};

export default AutoCompleteComponent;
