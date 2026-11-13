import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { FormDialog } from '../../components/ui/FormDialog';
import { Button } from '../../components/ui/Button';
import { formatMoney } from '../../domain/formatters';
import type { SaleQuote } from '../../domain/sale-payment';
import { COCO_BANK } from '../../lib/payment/vietqr';

export function TransferQrDialog({ quote, busy, onClose, onConfirm }: {
  quote: SaleQuote; busy: boolean; onClose(): void; onConfirm(): void;
}) {
  const [image, setImage] = useState(''), [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    setImage(''); setError('');
    QRCode.toDataURL(quote.qrPayload!, { errorCorrectionLevel: 'M', margin: 4, width: 512 })
      .then(value => { if (active) setImage(value); }, () => { if (active) setError('Không thể tạo mã QR. Vui lòng quay lại và thử lại.'); });
    return () => { active = false; };
  }, [quote]);
  return <FormDialog title="Thanh toán chuyển khoản" showClose={false} busy={busy} onClose={onClose}>
    <div className="transfer-qr">
      <p>{quote.snapshot.invoiceId} - {quote.snapshot.customer.name}</p>
      <strong className="transfer-amount">{formatMoney(quote.snapshot.total)}</strong>
      {error ? <p role="alert">{error}</p> : image ? <img src={image} alt={`QR ${COCO_BANK.name}, ${COCO_BANK.account}, ${COCO_BANK.holder}, ${quote.snapshot.total} đồng`}/> : <p role="status">Đang tạo mã QR…</p>}
      <div className="form-actions">
        <Button className="button-beige" disabled={busy || !image || Boolean(error)} onClick={onConfirm}>{busy ? 'Đang xử lý…' : 'Đã nhận'}</Button>
        <Button className="button-secondary" disabled={busy} onClick={onClose}>Quay lại</Button>
      </div>
    </div>
  </FormDialog>;
}
