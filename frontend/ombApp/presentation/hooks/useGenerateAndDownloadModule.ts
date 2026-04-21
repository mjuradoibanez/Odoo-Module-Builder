import { useCallback } from 'react';
import { generateAndDownloadModule } from '@/core/actions/generate-and-download-module';

export function useGenerateAndDownloadModule() {
  return useCallback(async (moduleJson: any) => {
    const blob = await generateAndDownloadModule(moduleJson);
    if (blob) {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'module.zip';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } else {
      throw new Error('Error al generar el módulo');
    }
  }, []);
}
