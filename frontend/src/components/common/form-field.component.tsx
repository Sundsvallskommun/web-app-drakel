import { cx, FormControl, FormLabel } from '@sk-web-gui/react';
import { FC, ReactNode } from 'react';

interface FormFieldProps {
  label: string;
  /** Marks the label with the required asterisk and sets `required` on the child input. */
  required?: boolean;
  /** Greys out the label and disables the child input. */
  disabled?: boolean;
  className?: string;
  /** The input, select or checkbox the label belongs to. */
  children: ReactNode;
}

/**
 * A labelled form field: `FormControl` + `FormLabel` + the input itself. `required` and `disabled` are
 * passed down to the child input by the FormControl, so they only need to be set here.
 */
export const FormField: FC<FormFieldProps> = ({ label, required, disabled, className, children }) => (
  <FormControl required={required} disabled={disabled} className={cx('w-full', className)}>
    <FormLabel>{label}</FormLabel>
    {children}
  </FormControl>
);
