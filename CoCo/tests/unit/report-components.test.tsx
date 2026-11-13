import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ReportPeriodForm } from '../../src/features/reports/ReportPeriodForm';
import { ReportPicker } from '../../src/features/reports/ReportPicker';
import { reportChoices } from '../../src/features/reports/report-catalog';
import { REPORT_PERIOD_ERROR } from '../../src/lib/vietnam-time';

afterEach(cleanup);

it('UI22 selects each real report kind without inventing a total or querying data', () => {
  const onSelect = vi.fn(); render(<ReportPicker onSelect={onSelect}/>);
  for (const choice of reportChoices) {
    fireEvent.click(screen.getByRole('button', { name: choice.label }));
    expect(onSelect).toHaveBeenLastCalledWith(choice.kind);
  }
  expect(onSelect).toHaveBeenCalledTimes(5);
});

it('SC106 confirms the complete inclusive date range with an exclusive UTC boundary', () => {
  const onConfirm = vi.fn(); render(<ReportPeriodForm onConfirm={onConfirm}/>);
  fireEvent.change(screen.getByLabelText('Từ ngày'), { target: { value: '01/01/2026' } });
  fireEvent.change(screen.getByLabelText('Đến ngày'), { target: { value: '08/01/2026' } });
  fireEvent.click(screen.getByRole('button', { name: 'Xác nhận' }));
  expect(onConfirm).toHaveBeenCalledOnce();
  expect(onConfirm).toHaveBeenCalledWith(expect.objectContaining({
    kind: 'range', startMs: Date.parse('2025-12-31T17:00:00Z'), endExclusiveMs: Date.parse('2026-01-08T17:00:00Z'),
  }));
});

it('SC107/109 blocks invalid and reversed dates, then allows correction without stale input', () => {
  const onConfirm = vi.fn(); render(<ReportPeriodForm onConfirm={onConfirm}/>);
  fireEvent.change(screen.getByLabelText('Từ ngày'), { target: { value: '02/11/2026' } });
  fireEvent.change(screen.getByLabelText('Đến ngày'), { target: { value: '01/11/2026' } });
  fireEvent.click(screen.getByRole('button', { name: 'Xác nhận' }));
  expect(screen.getByRole('alert')).toHaveTextContent(REPORT_PERIOD_ERROR);
  expect(onConfirm).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Theo ngày' }));
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(screen.getByLabelText('Ngày')).toHaveValue('');
  fireEvent.change(screen.getByLabelText('Ngày'), { target: { value: '33/01/2026' } });
  fireEvent.click(screen.getByRole('button', { name: 'Xác nhận' }));
  expect(screen.getByLabelText('Ngày')).toHaveAttribute('aria-invalid', 'true');
  expect(onConfirm).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText('Ngày'), { target: { value: '13/11/2026' } });
  fireEvent.click(screen.getByRole('button', { name: 'Xác nhận' }));
  expect(onConfirm).toHaveBeenCalledWith(expect.objectContaining({ kind: 'day', startDate: '2026-11-13' }));
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

it('SC110/112 switches month and year formats and does not reuse the previous value', () => {
  const onConfirm = vi.fn(); render(<ReportPeriodForm onConfirm={onConfirm}/>);
  fireEvent.click(screen.getByRole('button', { name: 'Theo tháng' }));
  fireEvent.change(screen.getByLabelText('Tháng'), { target: { value: '02/2024' } });
  fireEvent.click(screen.getByRole('button', { name: 'Xác nhận' }));
  expect(onConfirm).toHaveBeenLastCalledWith(expect.objectContaining({ endDate: '2024-02-29' }));
  fireEvent.click(screen.getByRole('button', { name: 'Theo năm' }));
  expect(screen.getByLabelText('Năm')).toHaveValue('');
  fireEvent.change(screen.getByLabelText('Năm'), { target: { value: '2026' } });
  fireEvent.click(screen.getByRole('button', { name: 'Xác nhận' }));
  expect(onConfirm).toHaveBeenLastCalledWith(expect.objectContaining({ startDate: '2026-01-01', endDate: '2026-12-31' }));
});
