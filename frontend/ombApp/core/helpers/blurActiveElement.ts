import { Platform } from 'react-native';

// Para evitar warnings de aria-hidden en web, desenfocamos el elemento activo antes de navegar
export function blurActiveElement(): void {
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    const active = document.activeElement as HTMLElement | null;
    if (active && typeof active.blur === 'function') {
      active.blur();
    }
  }
}
