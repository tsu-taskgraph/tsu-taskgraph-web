import { useState, useCallback } from 'react';

export function useWorkspaceToast() {
  const [edgeToast, setEdgeToast] = useState<{ id: number; message: string; variant: 'error' | 'success'; closing: boolean } | null>(null);

  const closeEdgeToast = useCallback((id?: number) => {
    setEdgeToast((current) => {
      if (!current || (id && current.id !== id)) return current;
      return { ...current, closing: true };
    });

    window.setTimeout(() => {
      setEdgeToast((current) => {
        if (!current || (id && current.id !== id)) return current;
        return null;
      });
    }, 220);
  }, []);

  const showEdgeToast = useCallback((message: string, variant: 'error' | 'success' = 'error') => {
    const id = Date.now();
    setEdgeToast({ id, message, variant, closing: false });
    window.setTimeout(() => closeEdgeToast(id), 4300);
  }, [closeEdgeToast]);

  return {
    edgeToast,
    setEdgeToast,
    closeEdgeToast,
    showEdgeToast
  };
}
