import { forwardRef } from 'react';
import { type Invoice, type CompanySettings, formatCurrency, formatDate, calcInvoiceTotals } from '../../lib/types';

const statusLabel: Record<string, { label: string; color: string }> = {
  Draft: { label: 'DRAFT', color: '#64748b' },
  Sent: { label: 'SENT', color: '#3b82f6' },
  Paid: { label: 'PAID', color: '#10b981' },
  Overdue: { label: 'OVERDUE', color: '#ef4444' },
};

interface InvoiceTemplateProps {
  invoice: Invoice;
  company: CompanySettings | null;
  clientEmail?: string;
  clientPhone?: string;
  className?: string;
}

export const InvoiceTemplate = forwardRef<HTMLDivElement, InvoiceTemplateProps>(
  ({ invoice, company, clientEmail, clientPhone, className = '' }, ref) => {
    const items = invoice.line_items?.length
      ? invoice.line_items
      : [{ id: '_legacy', description: invoice.project_name || 'Consulting Services', quantity: 1, unit_price: invoice.amount }];

    const { subtotal, vat, total } = calcInvoiceTotals(items, invoice.include_vat);
    const status = statusLabel[invoice.status] ?? statusLabel.Draft;
    const hasPaymentDetails = company && (company.bank_name || company.account_number);
    const hasBranding = company && company.company_name;

    return (
      <div
        ref={ref}
        id="qt-invoice-print"
        className={`bg-white text-gray-900 font-sans ${className}`}
        style={{ fontFamily: "'Inter', system-ui, sans-serif", minWidth: 600, maxWidth: 860, margin: '0 auto' }}
      >
        {/* Accent bar */}
        <div style={{ height: 6, background: 'linear-gradient(90deg, #7c3aed 0%, #6366f1 100%)' }} />

        {/* Header */}
        <div style={{ padding: '40px 48px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          {/* Company info */}
          <div style={{ flex: 1 }}>
            {company?.logo_data_url && (
              <img
                src={company.logo_data_url}
                alt="Company Logo"
                style={{ maxHeight: 72, maxWidth: 220, objectFit: 'contain', marginBottom: 16, display: 'block' }}
              />
            )}
            {hasBranding ? (
              <>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#111', lineHeight: 1.2 }}>{company.company_name}</div>
                {company.company_tagline && (
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{company.company_tagline}</div>
                )}
                {company.company_address && (
                  <div style={{ fontSize: 12, color: '#4b5563', marginTop: 10, whiteSpace: 'pre-line', lineHeight: 1.6 }}>
                    {company.company_address}
                  </div>
                )}
                <div style={{ fontSize: 12, color: '#4b5563', marginTop: 6 }}>
                  {company.company_email && <span>{company.company_email}</span>}
                  {company.company_email && company.company_phone && <span style={{ margin: '0 8px', color: '#d1d5db' }}>|</span>}
                  {company.company_phone && <span>{company.company_phone}</span>}
                </div>
              </>
            ) : (
              <div style={{ fontSize: 14, color: '#9ca3af', fontStyle: 'italic' }}>No company details configured</div>
            )}
          </div>

          {/* Invoice metadata */}
          <div style={{ textAlign: 'right', minWidth: 220 }}>
            <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-1px', color: '#111', lineHeight: 1 }}>INVOICE</div>
            <div style={{ fontSize: 14, color: '#7c3aed', fontWeight: 600, marginTop: 6 }}>{invoice.invoice_number}</div>

            {/* Status badge */}
            <div style={{
              display: 'inline-block',
              marginTop: 12,
              padding: '3px 12px',
              borderRadius: 99,
              border: `1.5px solid ${status.color}`,
              color: status.color,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.06em',
            }}>
              {status.label}
            </div>

            <div style={{ marginTop: 16, fontSize: 12, color: '#6b7280', lineHeight: 2 }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16 }}>
                <span style={{ color: '#9ca3af' }}>Invoice Date</span>
                <span style={{ fontWeight: 500, color: '#111' }}>{formatDate(invoice.invoice_date)}</span>
              </div>
              {invoice.due_date && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16 }}>
                  <span style={{ color: '#9ca3af' }}>Due Date</span>
                  <span style={{ fontWeight: 500, color: '#111' }}>{formatDate(invoice.due_date)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: '#e5e7eb', margin: '0 48px' }} />

        {/* Bill To */}
        <div style={{ padding: '28px 48px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: '#9ca3af', textTransform: 'uppercase', marginBottom: 8 }}>
            Bill To
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#111' }}>{invoice.client_name}</div>
          {invoice.project_name && (
            <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>{invoice.project_name}</div>
          )}
          {clientEmail && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{clientEmail}</div>}
          {clientPhone && <div style={{ fontSize: 12, color: '#6b7280' }}>{clientPhone}</div>}
        </div>

        {/* Line items table */}
        <div style={{ padding: '0 48px 28px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f3f0ff' }}>
                <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#7c3aed', borderRadius: '4px 0 0 4px' }}>
                  Description
                </th>
                <th style={{ textAlign: 'center', padding: '10px 14px', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#7c3aed', width: 60 }}>
                  Qty
                </th>
                <th style={{ textAlign: 'right', padding: '10px 14px', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#7c3aed', width: 130 }}>
                  Unit Price
                </th>
                <th style={{ textAlign: 'right', padding: '10px 14px', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#7c3aed', width: 130, borderRadius: '0 4px 4px 0' }}>
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={item.id} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                  <td style={{ padding: '12px 14px', fontSize: 13, color: '#111', borderBottom: '1px solid #f3f4f6' }}>
                    {item.description}
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: 13, color: '#4b5563', textAlign: 'center', borderBottom: '1px solid #f3f4f6' }}>
                    {item.quantity}
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: 13, color: '#4b5563', textAlign: 'right', borderBottom: '1px solid #f3f4f6' }}>
                    {formatCurrency(item.unit_price)}
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 500, color: '#111', textAlign: 'right', borderBottom: '1px solid #f3f4f6' }}>
                    {formatCurrency(item.quantity * item.unit_price)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
            <div style={{ minWidth: 280 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, color: '#4b5563', borderBottom: '1px solid #f3f4f6' }}>
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {invoice.include_vat && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, color: '#4b5563', borderBottom: '1px solid #f3f4f6' }}>
                  <span>VAT (15%)</span>
                  <span>{formatCurrency(vat)}</span>
                </div>
              )}
              <div style={{
                display: 'flex', justifyContent: 'space-between', padding: '12px 16px', marginTop: 6,
                background: 'linear-gradient(135deg, #7c3aed, #6366f1)', borderRadius: 8,
                fontSize: 16, fontWeight: 700, color: '#fff'
              }}>
                <span>Total Due</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment details */}
        {hasPaymentDetails && (
          <div style={{ margin: '0 48px 28px', padding: '20px 24px', background: '#f9fafb', borderRadius: 10, border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: '#9ca3af', textTransform: 'uppercase', marginBottom: 12 }}>
              Payment Details
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 32px', fontSize: 13 }}>
              {company.bank_name && (
                <div><span style={{ color: '#9ca3af' }}>Bank: </span><span style={{ color: '#111', fontWeight: 500 }}>{company.bank_name}</span></div>
              )}
              {company.account_name && (
                <div><span style={{ color: '#9ca3af' }}>Account Name: </span><span style={{ color: '#111', fontWeight: 500 }}>{company.account_name}</span></div>
              )}
              {company.account_number && (
                <div><span style={{ color: '#9ca3af' }}>Account Number: </span><span style={{ color: '#111', fontWeight: 500 }}>{company.account_number}</span></div>
              )}
              {company.branch_code && (
                <div><span style={{ color: '#9ca3af' }}>Branch Code: </span><span style={{ color: '#111', fontWeight: 500 }}>{company.branch_code}</span></div>
              )}
            </div>
          </div>
        )}

        {/* Notes */}
        {invoice.notes && (
          <div style={{ margin: '0 48px 28px', padding: '16px 24px', background: '#fffbeb', borderRadius: 10, border: '1px solid #fde68a' }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: '#9ca3af', textTransform: 'uppercase', marginBottom: 8 }}>
              Notes
            </div>
            <div style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{invoice.notes}</div>
          </div>
        )}

        {/* Footer */}
        <div style={{ padding: '20px 48px 36px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 11, color: '#d1d5db' }}>Generated by QT · QuanTech Capital Solutions</div>
          <div style={{ fontSize: 11, color: '#d1d5db' }}>Thank you for your business.</div>
        </div>
      </div>
    );
  }
);

InvoiceTemplate.displayName = 'InvoiceTemplate';
