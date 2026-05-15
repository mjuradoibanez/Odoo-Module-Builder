import { useState } from 'react';
import { addFavorite } from '@/core/actions/add-favorite';

export const useAddFavorite = () => {
  const [isAdding, setIsAdding] = useState(false);

  const add = async (userId: number, moduleId: number): Promise<boolean> => {
    setIsAdding(true);
    
    const result = await addFavorite(userId, moduleId);
    setIsAdding(false);
    return result !== null;
  };

  return { add, isAdding };
};
