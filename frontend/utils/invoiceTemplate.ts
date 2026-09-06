// Shared printable invoice/receipt template used across every module (Reception, Bar,
// Restaurant, ...) so every generated invoice looks the same: hotel logo, a real HTML
// table for the line items, and consistent Mirador branding.

export const HOTEL_LOGO_SRC = '/assets/logo_mirador_transparent_cropped.png';
export const HOTEL_NAVY = '#0b1f3a';
export const HOTEL_ORANGE = '#f97316';

export const escapeHtml = (value: unknown): string =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

export const formatCurrency = (amount: number, currency = 'FCFA'): string => {
  const rounded = Math.round(amount * 100) / 100;
  const [integerPart, decimalPart] = rounded.toFixed(2).split('.');
  const withThousands = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const formatted = decimalPart === '00' ? withThousands : `${withThousands}.${decimalPart}`;
  return `${formatted} ${currency}`;
};

export interface InvoiceInfoBox {
  title: string;
  lines: Array<{ label: string; value: string }>;
}

export interface InvoiceColumn {
  label: string;
  align?: 'left' | 'right';
}

export interface InvoiceTotalRow {
  label: string;
  value: string;
  emphasis?: boolean;
}

export interface InvoiceOptions {
  documentTitle: string;
  moduleLabel: string;
  invoiceNumber: string;
  invoiceDate: string;
  statusLabel?: string;
  infoBoxes: InvoiceInfoBox[];
  columns: InvoiceColumn[];
  rows: Array<Array<string | number>>;
  totals: InvoiceTotalRow[];
  signatureLabels?: [string, string];
  footerText?: string;
}

const buildInfoBoxHtml = (box: InvoiceInfoBox): string => `
  <div class="box">
    <div class="box-title">${escapeHtml(box.title)}</div>
    ${box.lines.map(line => `
      <div class="detail-line"><strong>${escapeHtml(line.label)}</strong><span>${escapeHtml(line.value)}</span></div>
    `).join('')}
  </div>
`;

const buildRowHtml = (row: Array<string | number>, columns: InvoiceColumn[]): string => `
  <tr>
    ${row.map((cell, index) => {
      const align = columns[index]?.align === 'right' ? ' class="number"' : '';
      return `<td${align}>${escapeHtml(cell)}</td>`;
    }).join('')}
  </tr>
`;

export const buildInvoiceHtml = (options: InvoiceOptions): string => {
  const {
    documentTitle, moduleLabel, invoiceNumber, invoiceDate, statusLabel,
    infoBoxes, columns, rows, totals, signatureLabels, footerText
  } = options;

  return `
    <!doctype html>
    <html lang="fr">
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(documentTitle)}</title>
        <style>
          @page { size: A4; margin: 14mm; }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            color: ${HOTEL_NAVY};
            background: #eef2f7;
            font-family: "Times New Roman", Times, serif;
            font-size: 14px;
            line-height: 1.4;
          }
          .print-actions {
            position: sticky;
            top: 0;
            z-index: 10;
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            padding: 12px 18px;
            background: #ffffff;
            border-bottom: 1px solid #d7dde7;
            box-shadow: 0 6px 18px rgba(11, 31, 58, 0.12);
          }
          .print-actions button {
            border: 0;
            border-radius: 6px;
            padding: 10px 16px;
            color: #ffffff;
            background: ${HOTEL_NAVY};
            font-family: "Times New Roman", Times, serif;
            font-size: 15px;
            font-weight: 700;
            cursor: pointer;
          }
          .print-actions button.secondary {
            color: ${HOTEL_NAVY};
            background: #ffffff;
            border: 1px solid ${HOTEL_NAVY};
          }
          .invoice {
            width: 100%;
            max-width: 210mm;
            margin: 18px auto;
            min-height: calc(297mm - 28mm);
            border: 2px solid ${HOTEL_NAVY};
            background: #ffffff;
            padding: 22px;
            position: relative;
          }
          .top-rule {
            height: 8px;
            background: linear-gradient(90deg, ${HOTEL_NAVY} 0 72%, ${HOTEL_ORANGE} 72% 100%);
            margin: -22px -22px 20px;
          }
          .header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 24px;
            border-bottom: 3px solid ${HOTEL_ORANGE};
            padding-bottom: 16px;
          }
          .brand { display: flex; gap: 16px; align-items: center; }
          .brand img { width: 92px; height: 92px; object-fit: contain; }
          .hotel-name {
            margin: 0;
            color: ${HOTEL_NAVY};
            font-size: 30px;
            font-weight: 700;
            text-transform: uppercase;
          }
          .hotel-meta { margin-top: 6px; color: #243b5a; font-size: 13px; }
          .invoice-title { min-width: 220px; text-align: right; }
          .invoice-title h2 {
            margin: 0 0 8px;
            color: ${HOTEL_ORANGE};
            font-size: 28px;
            text-transform: uppercase;
          }
          .invoice-title div { margin: 3px 0; font-size: 14px; }
          .section-grid {
            display: grid;
            grid-template-columns: repeat(${Math.max(infoBoxes.length, 1)}, 1fr);
            gap: 16px;
            margin: 22px 0;
          }
          .box { border: 1.5px solid ${HOTEL_NAVY}; padding: 12px 14px; }
          .box-title {
            margin: -12px -14px 10px;
            padding: 7px 12px;
            color: #ffffff;
            background: ${HOTEL_NAVY};
            border-bottom: 3px solid ${HOTEL_ORANGE};
            font-size: 13px;
            font-weight: 700;
            text-transform: uppercase;
          }
          .detail-line {
            display: flex;
            justify-content: space-between;
            gap: 12px;
            padding: 3px 0;
          }
          .detail-line strong { color: ${HOTEL_NAVY}; }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 8px;
            border: 2px solid ${HOTEL_NAVY};
          }
          th {
            background: ${HOTEL_NAVY};
            color: #ffffff;
            border: 1px solid ${HOTEL_NAVY};
            border-bottom: 3px solid ${HOTEL_ORANGE};
            padding: 10px 8px;
            font-size: 13px;
            text-align: left;
            text-transform: uppercase;
          }
          th.number { text-align: right; }
          td { border: 1px solid ${HOTEL_NAVY}; padding: 10px 8px; vertical-align: top; }
          tbody tr:nth-child(even) td { background: #fff7ed; }
          .number { text-align: right; white-space: nowrap; }
          .totals {
            width: 42%;
            margin-left: auto;
            margin-top: 18px;
            border: 2px solid ${HOTEL_NAVY};
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 12px;
            border-bottom: 1px solid ${HOTEL_NAVY};
          }
          .total-row:last-child { border-bottom: 0; }
          .total-row.emphasis {
            color: #ffffff;
            background: ${HOTEL_NAVY};
            font-size: 18px;
            font-weight: 700;
          }
          .signature {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 56px;
            margin-top: 46px;
          }
          .signature-line {
            border-top: 1.5px solid ${HOTEL_NAVY};
            padding-top: 8px;
            text-align: center;
            color: #243b5a;
          }
          .footer {
            margin-top: 28px;
            padding-top: 10px;
            border-top: 3px solid ${HOTEL_ORANGE};
            color: #243b5a;
            font-size: 12px;
            text-align: center;
          }
          @media print {
            body {
              background: #ffffff;
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
            .print-actions { display: none; }
            .invoice {
              max-width: none;
              margin: 0;
              min-height: auto;
            }
          }
        </style>
      </head>
      <body>
        <div class="print-actions">
          <button class="secondary" type="button" onclick="window.close()">Fermer</button>
          <button type="button" onclick="window.print()">Imprimer la facture</button>
        </div>
        <main class="invoice">
          <div class="top-rule"></div>
          <header class="header">
            <div class="brand">
              <img src="${HOTEL_LOGO_SRC}" alt="Logo Mirador Hotel" />
              <div>
                <h1 class="hotel-name">Mirador Hotel</h1>
                <div class="hotel-meta">Yaounde - Cameroun</div>
                <div class="hotel-meta">${escapeHtml(moduleLabel)}</div>
              </div>
            </div>
            <div class="invoice-title">
              <h2>Facture</h2>
              <div><strong>N:</strong> ${escapeHtml(invoiceNumber)}</div>
              <div><strong>Date:</strong> ${escapeHtml(invoiceDate)}</div>
              ${statusLabel ? `<div><strong>Statut:</strong> ${escapeHtml(statusLabel)}</div>` : ''}
            </div>
          </header>

          ${infoBoxes.length > 0 ? `<section class="section-grid">${infoBoxes.map(buildInfoBoxHtml).join('')}</section>` : ''}

          <table>
            <thead>
              <tr>
                ${columns.map(col => `<th${col.align === 'right' ? ' class="number"' : ''}>${escapeHtml(col.label)}</th>`).join('')}
              </tr>
            </thead>
            <tbody>${rows.map(row => buildRowHtml(row, columns)).join('')}</tbody>
          </table>

          <section class="totals">
            ${totals.map(total => `
              <div class="total-row${total.emphasis ? ' emphasis' : ''}"><span>${escapeHtml(total.label)}</span><strong>${escapeHtml(total.value)}</strong></div>
            `).join('')}
          </section>

          ${signatureLabels ? `
            <section class="signature">
              <div class="signature-line">${escapeHtml(signatureLabels[0])}</div>
              <div class="signature-line">${escapeHtml(signatureLabels[1])}</div>
            </section>
          ` : ''}

          <footer class="footer">
            ${escapeHtml(footerText ?? 'Merci pour votre confiance. Facture imprimee par Mirador Hotel.')}
          </footer>
        </main>
      </body>
    </html>
  `;
};

export const openInvoiceWindow = (options: InvoiceOptions): void => {
  const invoiceWindow = window.open('', '_blank', 'width=920,height=760');
  if (!invoiceWindow) return;
  invoiceWindow.document.write(buildInvoiceHtml(options));
  invoiceWindow.document.close();
};
