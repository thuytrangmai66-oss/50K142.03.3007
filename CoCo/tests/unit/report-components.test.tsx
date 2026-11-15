import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ReportPeriodForm } from '../../src/features/reports/ReportPeriodForm';
import { ReportPicker } from '../../src/features/reports/ReportPicker';
import { reportChoices } from '../../src/features/reports/report-catalog';
import { REPORT_PERIOD_ERROR } from '../../src/lib/vietnam-time';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

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

it.each([
  ['2024-02-29', '2024-03-01', '2024-02-28T17:00:00Z', '2024-03-01T17:00:00Z'],
  ['2024-02-29', '2024-02-29', '2024-02-28T17:00:00Z', '2024-02-29T17:00:00Z'],
  ['2025-12-31', '2026-01-01', '2025-12-30T17:00:00Z', '2026-01-01T17:00:00Z'],
])('native calendar %s to %s preserves display and Vietnam boundaries', (start, end, lower, upper) => {
  const onConfirm = vi.fn(); render(<ReportPeriodForm onConfirm={onConfirm}/>);
  fireEvent.change(screen.getByLabelText('Chọn ngày cho Từ ngày'), { target: { value: start } });
  fireEvent.change(screen.getByLabelText('Chọn ngày cho Đến ngày'), { target: { value: end } });
  expect(screen.getByLabelText('Từ ngày')).toHaveValue(start.split('-').reverse().join('/'));
  expect(screen.getByLabelText('Đến ngày')).toHaveValue(end.split('-').reverse().join('/'));
  fireEvent.click(screen.getByRole('button', { name: 'Xác nhận' }));
  expect(onConfirm).toHaveBeenCalledWith(expect.objectContaining({ kind: 'range', startDate: start, endDate: end,
    startMs: Date.parse(lower), endExclusiveMs: Date.parse(upper) }));
});

it('manual dates synchronize the native picker without normalizing invalid text', () => {
  const onConfirm = vi.fn(); render(<ReportPeriodForm onConfirm={onConfirm}/>);
  fireEvent.change(screen.getByLabelText('Từ ngày'), { target: { value: '15/11/2026' } });
  expect(screen.getByLabelText('Chọn ngày cho Từ ngày')).toHaveValue('2026-11-15');
  fireEvent.change(screen.getByLabelText('Từ ngày'), { target: { value: '31/02/2026' } });
  expect(screen.getByLabelText('Chọn ngày cho Từ ngày')).toHaveValue('');
  expect(screen.getByLabelText('Từ ngày')).toHaveValue('31/02/2026');
  fireEvent.click(screen.getByRole('button', { name: 'Xác nhận' }));
  expect(screen.getByRole('alert')).toHaveTextContent(REPORT_PERIOD_ERROR); expect(onConfirm).not.toHaveBeenCalled();
});

it('text, calendar area and keyboard invoke the picker safely while manual input remains available', () => {
  render(<ReportPeriodForm onConfirm={vi.fn()}/>);
  const native = screen.getByLabelText('Chọn ngày cho Từ ngày'), text = screen.getByLabelText('Từ ngày');
  const showPicker = vi.fn(); Object.defineProperty(native, 'showPicker', { configurable: true, value: showPicker });
  fireEvent.click(text); fireEvent.click(native); fireEvent.keyDown(text, { key: 'ArrowDown', altKey: true }); fireEvent.keyDown(native, { key: 'Enter' });
  expect(showPicker).toHaveBeenCalledTimes(4);
  showPicker.mockImplementation(() => { throw new DOMException('Unavailable outside activation', 'NotAllowedError'); });
  expect(() => fireEvent.click(native)).not.toThrow();
  Object.defineProperty(native, 'showPicker', { value: undefined });
  expect(() => fireEvent.click(text)).not.toThrow();
  fireEvent.change(text, { target: { value: '15/11/2026' } }); expect(text).toHaveValue('15/11/2026');
});

it('changing period kind removes irrelevant native controls and clears previous dates', () => {
  render(<ReportPeriodForm onConfirm={vi.fn()}/>);
  fireEvent.change(screen.getByLabelText('Chọn ngày cho Đến ngày'), { target: { value: '2026-12-31' } });
  fireEvent.click(screen.getByRole('button', { name: 'Theo ngày' }));
  expect(screen.getByLabelText('Ngày')).toHaveValue(''); expect(screen.getByLabelText('Chọn ngày cho Ngày')).toHaveValue('');
  fireEvent.click(screen.getByRole('button', { name: 'Theo tháng' }));
  expect(document.querySelectorAll('input[type="date"]')).toHaveLength(0);
  fireEvent.click(screen.getByRole('button', { name: 'Theo năm' })); expect(screen.getByLabelText('Năm')).toHaveValue('');
  fireEvent.click(screen.getByRole('button', { name: 'Theo khoảng thời gian' }));
  expect(screen.getByLabelText('Từ ngày')).toHaveValue(''); expect(screen.getByLabelText('Đến ngày')).toHaveValue('');
});
