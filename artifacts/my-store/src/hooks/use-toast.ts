import { toast as sonnerToast } from 'sonner';
import * as React from 'react';

type ToastOptions = {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
};

function toast({ title, description, action }: ToastOptions) {
  const message =
    typeof title === 'string'
      ? title
      : typeof description === 'string'
        ? description
        : '';

  const options = {
    description:
      typeof description === 'string' && typeof title === 'string'
        ? description
        : undefined,
  };

  const id = action
    ? sonnerToast(message, {
        ...options,
        action: {
          label: 'إجراء',
          onClick: () => {},
        },
      })
    : sonnerToast(message, options);

  return {
    id: String(id),
    dismiss: () => sonnerToast.dismiss(id),
    update: () => {},
  };
}

function useToast() {
  return {
    toast,
    dismiss: (toastId?: string) => {
      if (toastId) {
        sonnerToast.dismiss(toastId);
      } else {
        sonnerToast.dismiss();
      }
    },
  };
}

export { useToast, toast };