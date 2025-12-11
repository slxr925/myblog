import { useCallback } from 'react';
import { eventEmitter, EVENTS } from '../utils/events';

/**
 * Hook to trigger folder data refresh across components
 */
export const useFolderRefresh = () => {
  const refreshFolders = useCallback(() => {
    eventEmitter.emit(EVENTS.FOLDER_DATA_CHANGED);
  }, []);

  return { refreshFolders };
};