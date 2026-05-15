// Avatares predefinidos para los usuarios
export const AVATAR_LIST = [
  'avatar_01.png',
  'avatar_02.png',
  'avatar_03.png',
  'avatar_04.png',
  'avatar_05.png',
  'avatar_06.png',
  'avatar_07.png',
  'avatar_08.png',
] as const;

export type AvatarName = (typeof AVATAR_LIST)[number];

// Obtener la ruta de la imagen del avatar según su nombre
export function getAvatarSource(avatarName: string | null | undefined): any {
  if (!avatarName) return null;

  switch (avatarName) {
    case 'avatar_01.png':
      return require('@/assets/avatars/avatar_01.png');
    case 'avatar_02.png':
      return require('@/assets/avatars/avatar_02.png');
    case 'avatar_03.png':
      return require('@/assets/avatars/avatar_03.png');
    case 'avatar_04.png':
      return require('@/assets/avatars/avatar_04.png');
    case 'avatar_05.png':
      return require('@/assets/avatars/avatar_05.png');
    case 'avatar_06.png':
      return require('@/assets/avatars/avatar_06.png');
    case 'avatar_07.png':
      return require('@/assets/avatars/avatar_07.png');
    case 'avatar_08.png':
      return require('@/assets/avatars/avatar_08.png');
    default:
      return null;
  }
}
