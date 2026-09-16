import { Spinner } from '@sk-web-gui/react';
import { FC, ReactNode } from 'react';

interface AsyncContentProps {
  isLoading: boolean;
  /** Truthy when loading failed; shows `errorText` instead of the content. */
  error?: unknown;
  errorText: string;
  /** When true (and loaded without error), shows `emptyText` instead of the content. */
  isEmpty?: boolean;
  emptyText?: ReactNode;
  /** Centers the spinner with vertical spacing, for content that fills a whole section. */
  centered?: boolean;
  children: ReactNode;
}

/** Shows a spinner while loading, an error or empty message when relevant, and otherwise the content. */
export const AsyncContent: FC<AsyncContentProps> = ({
  isLoading,
  error,
  errorText,
  isEmpty = false,
  emptyText,
  centered = false,
  children,
}) => {
  if (isLoading) {
    return centered ?
        <div className="flex justify-center my-32">
          <Spinner size={4} />
        </div>
      : <Spinner size={3} />;
  }
  if (error) {
    return <p className="m-0 text-error-surface-primary">{errorText}</p>;
  }
  if (isEmpty) {
    return <p className="m-0 text-dark-secondary">{emptyText}</p>;
  }
  return <>{children}</>;
};
