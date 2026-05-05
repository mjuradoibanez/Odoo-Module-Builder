import { useState } from 'react';
import { removeFavorite } from '@/core/actions/remove-favorite';

export const useRemoveFavorite = () => {
  const [isRemoving, setIsRemoving] = useState(false);

  const remove = async (favoriteId: number): Promise<boolean> => {
    setIsRemoving(true);
    
    const result = await removeFavorite(favoriteId);
    setIsRemoving(false);
    return result;
  };

  return { remove, isRemoving };
};
