import { useEffect, useRef, useCallback } from 'react';
import { getEcho, disconnectEcho } from '../echo';

export function useRealtime({ channel = 'content', event = '.content.updated', onEvent } = {}) {
  const handlerRef = useRef(onEvent);

  useEffect(() => {
    handlerRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    const echo = getEcho();

    const channelInstance = echo.channel(channel);
    channelInstance.listen(event, (payload) => {
      if (handlerRef.current) {
        handlerRef.current(payload);
      }
    });

    return () => {
      channelInstance.stopListening(event);
    };
  }, [channel, event]);
}

export function useRealtimeContent({ onContentChange } = {}) {
  const lastTimestampRef = useRef(0);

  const handleEvent = useCallback((payload) => {
    const ts = payload?.timestamp || 0;
    if (ts <= lastTimestampRef.current) return;
    lastTimestampRef.current = ts;

    if (onContentChange) {
      onContentChange(payload);
    }

    window.dispatchEvent(new CustomEvent('content-changed', {
      detail: { ...payload, at: Date.now() },
    }));
  }, [onContentChange]);

  useRealtime({
    channel: 'content',
    event: '.content.updated',
    onEvent: handleEvent,
  });

  return null;
}

export default useRealtime;
