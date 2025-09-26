import React from 'react';
import { cn } from '../../utils/cn';

export interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  children: React.ReactNode;
}

const Form = React.forwardRef<HTMLFormElement, FormProps>(
  ({ className, children, ...props }, ref) => (
    <form
      ref={ref}
      className={cn('space-y-4', className)}
      {...props}
    >
      {children}
    </form>
  )
);

Form.displayName = 'Form';

export interface FormFieldProps {
  children: React.ReactNode;
  className?: string;
}

const FormField: React.FC<FormFieldProps> = ({ children, className }) => (
  <div className={cn('space-y-2', className)}>
    {children}
  </div>
);

export interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

const FormLabel = React.forwardRef<HTMLLabelElement, FormLabelProps>(
  ({ className, children, required, ...props }, ref) => (
    <label
      ref={ref}
      className={cn('block text-sm font-medium text-gray-200', className)}
      {...props}
    >
      {children}
      {required && <span className="text-red-400 ml-1">*</span>}
    </label>
  )
);

FormLabel.displayName = 'FormLabel';

export interface FormErrorProps {
  children: React.ReactNode;
  className?: string;
}

const FormError: React.FC<FormErrorProps> = ({ children, className }) => (
  <p className={cn('text-sm text-red-400', className)}>
    {children}
  </p>
);

export interface FormHelperTextProps {
  children: React.ReactNode;
  className?: string;
}

const FormHelperText: React.FC<FormHelperTextProps> = ({ children, className }) => (
  <p className={cn('text-sm text-gray-400', className)}>
    {children}
  </p>
);

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <FormField>
        {label && (
          <FormLabel htmlFor={textareaId}>{label}</FormLabel>
        )}
        <textarea
          id={textareaId}
          className={cn(
            'flex min-h-[80px] w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 resize-vertical',
            error && 'border-red-500 focus:ring-red-400',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <FormError>{error}</FormError>}
        {helperText && !error && <FormHelperText>{helperText}</FormHelperText>}
      </FormField>
    );
  }
);

Textarea.displayName = 'Textarea';

export { Form, FormField, FormLabel, FormError, FormHelperText, Textarea };