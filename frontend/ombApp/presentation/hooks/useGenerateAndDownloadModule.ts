import { useCallback } from 'react';
import { generateAndDownloadModule } from '@/core/actions/generate-and-download-module';

export function useGenerateAndDownloadModule() {
  return useCallback(async (moduleJson: any) => {

    const response = await generateAndDownloadModule(moduleJson);
    
    if (response && response.data) {
      // Blob: objeto con los datos binarios del archivo
      const blob = response.data;

      // Extraer el nombre del archivo del header 'Content-Disposition'
      const disposition = response.headers['content-disposition'];
      let filename = 'module.zip';

      if (disposition) {
        const match = disposition.match(/filename="?([^";]+)"?/); // Extrae el nombre del archivo
        if (match && match[1]) filename = match[1];
      }
      
      // Crea una URL temporal para el blob
      const url = window.URL.createObjectURL(blob);

      // Crea un enlace temporal para descargar el archivo al hacer clic
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;

      // Agrega el enlace al DOM, hace clic y luego lo borra
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } else {
      throw new Error('Error al generar el módulo');
    }
  }, []);
}
