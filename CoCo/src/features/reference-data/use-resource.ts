import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../auth/use-auth';

export function useResource<T>(load: () => Promise<T>) {
  const { referenceData } = useAuth();
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState<{ source?: () => Promise<T>; data?: T; loading: boolean; error?: unknown }>({ loading: true });
  const reload = useCallback(() => setRevision(value => value + 1), []);
  useEffect(() => referenceData.subscribe(reload), [referenceData, reload]);
  useEffect(() => {
    let active = true;
    setState(previous => ({ source: load, data: previous.source === load ? previous.data : undefined, loading: true }));
    load().then(data => { if (active) setState({ source: load, data, loading: false }); }, error => { if (active) setState({ source: load, loading: false, error }); });
    return () => { active = false; };
  }, [load, revision]);
  const current = state.source === load ? state : { loading: true, data: undefined, error: undefined };
  return { ...current, loading: current.loading && current.data === undefined, reload };
}
