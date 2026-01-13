/// <reference types="react-scripts" />

declare module 'react-hot-toast' {  
  export interface ToastOptions {
    duration?: number;
    style?: React.CSSProperties;
    success?: {
      duration?: number;
      iconTheme?: {
        primary?: string;
        secondary?: string;
      };
    };
    error?: {
      duration?: number;
      iconTheme?: {
        primary?: string;
        secondary?: string;
      };
    };
  }

  export interface ToasterProps {
    position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
    toastOptions?: ToastOptions;
  }

  export const Toaster: React.FC<ToasterProps>;
  
  const toast: {
    (message: string, options?: any): string;
    success: (message: string, options?: any) => string;
    error: (message: string, options?: any) => string;
    loading: (message: string, options?: any) => string;
    dismiss: (toastId?: string) => void;
  };
  
  export default toast;
}