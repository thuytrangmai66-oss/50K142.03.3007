import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../auth/use-auth';
import { useResource } from '../reference-data/use-resource';
import { ResultDialog } from '../../components/ui/ResultDialog';
import { FormDialog } from '../../components/ui/FormDialog';
import { Button } from '../../components/ui/Button';
import type { PurchaseDraftService } from '../../services/purchase-drafts';

type Result = Awaited<ReturnType<PurchaseDraftService['pendingResults']>>[number];

function ResultDelivery({ result, onRejected }: { result: Result; onRejected(lineId: string): void }) {
  const { purchaseDrafts } = useAuth();
  const [visible, setVisible] = useState(false), [reasonOpen, setReasonOpen] = useState(false), [error, setError] = useState('');
  const release = useRef<() => void>(), busy = useRef(false);
  const { notice, approval } = result;
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    // Hold the browser lock while the native dialog is open, including other
    // tabs signed in as the same employee. An unread notice survives a crash.
    navigator.locks.request(`coco:purchase-result:${notice.id}`, { signal: controller.signal }, async () => {
      if (!active) return;
      const pending = await purchaseDrafts.pendingResults(approval.draftId);
      if (!active || !pending.some(item => item.notice.id === notice.id)) return;
      await new Promise<void>(resolve => { release.current = resolve; setVisible(true); });
    }).catch(cause => { if (active && cause.name !== 'AbortError') setError('Không thể nhận kết quả phê duyệt'); });
    return () => { active = false; controller.abort(); release.current?.(); };
  }, [purchaseDrafts, notice.id, approval.draftId]);
  async function close() {
    if (busy.current) return;
    busy.current = true;
    try {
      await purchaseDrafts.acknowledgeResult(notice.id);
      setVisible(false); setReasonOpen(false); release.current?.();
      if (approval.decision.status === 'rejected') onRejected(approval.lineId);
    } catch { setError('Không thể ghi nhận đã xem kết quả'); }
    finally { busy.current = false; }
  }
  if (!visible) return error ? <p role="alert">{error}</p> : null;
  const rejected = approval.decision.status === 'rejected';
  return <>
    <ResultDialog message={rejected ? 'Yêu cầu phê duyệt bị từ chối' : 'Yêu cầu phê duyệt được chấp thuận'} error={rejected} symbol={rejected ? 'cross' : undefined} onClose={() => void close()}>
      {rejected && <Button className="button-beige purchase-view-reason" onClick={() => setReasonOpen(true)}>Xem lý do</Button>}
      {error && <p role="alert">{error}</p>}
    </ResultDialog>
    {reasonOpen && approval.decision.status === 'rejected' && <FormDialog title="Lý do từ chối" onClose={() => void close()}>
      <div className="purchase-rejection-reason"><textarea aria-label="Lý do từ chối" readOnly value={approval.decision.reason} />{error && <p role="alert">{error}</p>}</div>
    </FormDialog>}
  </>;
}

export function PurchaseResults({ draftId, onRejected }: { draftId: string; onRejected(lineId: string): void }) {
  const { purchaseDrafts } = useAuth();
  const load = useCallback(() => purchaseDrafts.pendingResults(draftId), [purchaseDrafts, draftId]);
  const { data, error } = useResource(load);
  if (error) return <p role="alert">Không thể tải kết quả phê duyệt</p>;
  const next = data?.[0];
  return next ? <ResultDelivery key={next.notice.id} result={next} onRejected={onRejected} /> : null;
}
