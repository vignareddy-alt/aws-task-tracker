import { createContext, useContext } from 'react';

// The provider lives in components/ToastProvider.jsx.
export const ToastContext = createContext(null);

/**
 * Show a success or error message from any component:
 *   const toast = useToast();
 *   toast.success('Saved!');
 *   toast.error('Something failed');
 */
export default function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside <ToastProvider>');
  return context;
}
