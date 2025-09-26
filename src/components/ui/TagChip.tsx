import React from 'react';
import { cn } from '../../utils/cn';

export interface TagChipProps {
  tag: string;
  onRemove?: () => void;
  variant?: 'default' | 'removable' | 'clickable';
  onClick?: () => void;
  className?: string;
}

const TagChip: React.FC<TagChipProps> = ({
  tag,
  onRemove,
  variant = 'default',
  onClick,
  className
}) => {
  const baseStyles = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors';
  const variantStyles = {
    default: 'bg-amber-100 text-amber-800 border border-amber-200',
    removable: 'bg-amber-100 text-amber-800 border border-amber-200 hover:bg-amber-200',
    clickable: 'bg-amber-100 text-amber-800 border border-amber-200 hover:bg-amber-200 cursor-pointer'
  };

  const handleClick = () => {
    if (variant === 'clickable' && onClick) {
      onClick();
    }
  };

  return (
    <span
      className={cn(baseStyles, variantStyles[variant], className)}
      onClick={handleClick}
    >
      {tag}
      {variant === 'removable' && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-amber-300 transition-colors"
          aria-label={`Remove ${tag} tag`}
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </span>
  );
};

export interface TagInputProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
  className?: string;
}

const TagInput: React.FC<TagInputProps> = ({
  tags,
  onTagsChange,
  placeholder = 'Add tags...',
  suggestions = [],
  className
}) => {
  const [inputValue, setInputValue] = React.useState('');
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const filteredSuggestions = suggestions.filter(
    suggestion => 
      suggestion.toLowerCase().includes(inputValue.toLowerCase()) &&
      !tags.includes(suggestion)
  );

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      onTagsChange([...tags, trimmedTag]);
    }
    setInputValue('');
    setShowSuggestions(false);
  };

  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (inputValue.trim()) {
        addTag(inputValue);
      }
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  return (
    <div className={cn('relative', className)}>
      <div className="flex flex-wrap gap-2 p-3 border border-gray-600 rounded-md bg-gray-800 focus-within:ring-2 focus-within:ring-amber-400 focus-within:border-transparent">
        {tags.map((tag, index) => (
          <TagChip
            key={index}
            tag={tag}
            variant="removable"
            onRemove={() => removeTag(tag)}
          />
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setShowSuggestions(true);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="flex-1 min-w-0 bg-transparent border-none outline-none text-gray-100 placeholder:text-gray-400"
        />
      </div>
      
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-600 rounded-md shadow-lg max-h-40 overflow-y-auto">
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => addTag(suggestion)}
              className="w-full px-3 py-2 text-left text-gray-100 hover:bg-gray-700 transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export { TagChip, TagInput };