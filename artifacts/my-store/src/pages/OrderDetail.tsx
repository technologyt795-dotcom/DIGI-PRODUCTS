import { useState } from 'react';
import { useParams, Link } from 'wouter';
import { ArrowRight, Download, Loader2, Printer, Package } from 'lucide-react';
import { useGetMyOrder } from '@workspace/api-client-react';
import { useCustomerAuth } from '@/hooks/use-customer-auth';
import { useStoreSettings } from '@/contexts/StoreSettingsContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '') + '/api';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending:    { label: 'قيد الانتظار', color: '#f59e0b' },
  processing: { label: 'جاري التجهيز', color: '#3b82f6' },
  shipped:    { label: 'تم الشحن',     color: '#8b5cf6' },
  delivered:  { label: 'تم التسليم',   color: '#10b981' },
  cancelled:  { label: 'ملغى',         color: '#ef4444' },
};

const DOWNLOAD_ALLOWED = new Set(['processing', 'shipped', 'delivered']);

// Decorative dots SVG pattern (mimicking the reference invoice)
function DotPattern({ color, opacity = 0.25 }: { color: string; opacity?: number }) {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" style={{ opacity }}>
      {[0, 20, 40, 60].map(x =>
        [0, 20, 40, 60].map(y => (
          <circle key={`${x}-${y}`} cx={x + 10} cy={y + 10} r="3.5" fill={color} />
        ))
      )}
    </svg>
  );
}

// Ring / circle decorative element
function RingDecor({ color, size = 44 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" fill="none">
      <circle cx="22" cy="22" r="20" stroke={color} strokeWidth="3" strokeOpacity="0.5" />
      <circle cx="22" cy="22" r="10" stroke={color} strokeWidth="3" strokeOpacity="0.3" />
    </svg>
  );
}

export default function OrderDetail() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const { token } = useCustomerAuth();
  const { settings } = useStoreSettings();

  const { data: order, isLoading, isError } = useGetMyOrder(orderNumber!, {
    request: token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
    query: { enabled: !!token && !!orderNumber },
  });

  const [downloading, setDownloading] = useState<Record<number, boolean>>({});

  const handlePrint = () => window.print();

  const handleDownload = async (item: any, idx: number) => {
    if (downloading[idx]) return;
    setDownloading(prev => ({ ...prev, [idx]: true }));
    try {
      const res = await fetch(
        `${BASE}/customer/downloads/${order?.orderNumber}/${idx}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!res.ok) throw new Error('فشل التحميل');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = item.name || 'download';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      toast.error('تعذّر تحميل الملف، حاول مرة أخرى');
    } finally {
      setDownloading(prev => ({ ...prev, [idx]: false }));
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-10 max-w-4xl" dir="rtl">
        <div className="space-y-4">
          <div className="h-8 w-48 bg-muted animate-pulse rounded-md" />
          <div className="h-96 bg-muted animate-pulse rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="container mx-auto px-4 py-10 max-w-3xl text-center" dir="rtl">
        <Package className="h-16 w-16 text-muted-foreground/40 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">الطلب غير موجود</h2>
        <p className="text-muted-foreground mb-6">تعذّر العثور على هذا الطلب في حسابك.</p>
        <Button asChild><Link href="/my-orders">العودة لطلباتي</Link></Button>
      </div>
    );
  }

  const status = STATUS_MAP[order.status] ?? { label: order.status, color: '#6b7280' };
  const date = new Date(order.createdAt).toLocaleDateString('ar-SA', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  const time = new Date(order.createdAt).toLocaleTimeString('ar-SA', {
    hour: '2-digit', minute: '2-digit',
  });
  const canDownload = DOWNLOAD_ALLOWED.has(order.status);
  const storeName    = settings?.storeName    ?? 'المتجر';
  const contactEmail = settings?.contactEmail ?? '';
  const contactPhone = settings?.contactPhone ?? '';
  const address      = settings?.address      ?? '';
  const logoUrl      = settings?.logoUrl      ?? null;

  const items = order.items as any[];
  const subtotal       = Number(order.subtotal)       || 0;
  const shipping       = Number(order.shippingCost)   || 0;
  const tax            = Number(order.tax)            || 0;
  const discountAmount = Number(order.discountAmount) || 0;
  const total          = Number(order.total)          || 0;

  return (
    <>
      <style>{`
        /* ── Theme-aware invoice variables ──────────────────── */
        .invoice-root {
          --inv-primary:    hsl(var(--primary));
          --inv-primary-fg: hsl(var(--primary-foreground));
          --inv-secondary:  hsl(var(--secondary));
          --inv-card:       hsl(var(--card));
          --inv-card-fg:    hsl(var(--card-foreground));
          --inv-border:     hsl(var(--border));
          --inv-muted:      hsl(var(--muted));
          --inv-muted-fg:   hsl(var(--muted-foreground));
        }

        /* ── Print styles ───────────────────────────────────── */
        @media print {
          .no-print { display: none !important; }
          .invoice-page { box-shadow: none !important; }
          body { background: white !important; }
          header, footer, nav, .no-print { display: none !important; }
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        @media screen {
          .print-only { display: none !important; }
        }

        /* ── Table ──────────────────────────────────────────── */
        .inv-table { width: 100%; border-collapse: collapse; }
        .inv-table th {
          background: var(--inv-primary);
          color: var(--inv-primary-fg);
          padding: 10px 14px;
          font-size: 12px;
          font-weight: 700;
          text-align: right;
          letter-spacing: 0.03em;
        }
        .inv-table td {
          padding: 10px 14px;
          font-size: 13px;
          border-bottom: 1px solid var(--inv-border);
          color: var(--inv-card-fg);
          vertical-align: middle;
        }
        .inv-table tr:last-child td { border-bottom: none; }
        .inv-table tr:nth-child(even) td { background: var(--inv-muted); }
        .inv-table th:first-child,
        .inv-table td:first-child { border-radius: 0; }

        /* ── Status badge ───────────────────────────────────── */
        .inv-status-badge {
          display: inline-flex;
          align-items: center;
          padding: 3px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.04em;
        }

        /* ── Totals ─────────────────────────────────────────── */
        .inv-totals-row {
          display: flex;
          justify-content: space-between;
          padding: 6px 0;
          font-size: 13px;
          color: var(--inv-muted-fg);
        }
        .inv-totals-row.total {
          padding: 12px 16px;
          background: var(--inv-primary);
          color: var(--inv-primary-fg);
          border-radius: 8px;
          font-size: 16px;
          font-weight: 800;
          margin-top: 8px;
        }
        .inv-totals-row.total span { color: var(--inv-primary-fg) !important; }
      `}</style>

      {/* ─── Screen actions ──────────────────────────────────── */}
      <div className="container mx-auto px-4 pt-8 pb-4 max-w-4xl no-print" dir="rtl">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <Link href="/my-orders" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
            <ArrowRight className="h-4 w-4" />
            العودة لطلباتي
          </Link>
          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
            <Printer className="h-4 w-4" />
            طباعة / PDF
          </Button>
        </div>
      </div>

      {/* ─── Invoice page ────────────────────────────────────── */}
      <div className="container mx-auto px-4 pb-12 max-w-4xl invoice-root" dir="rtl">
        <div
          className="invoice-page rounded-2xl overflow-hidden shadow-xl"
          style={{ background: 'var(--inv-card)', border: '1px solid var(--inv-border)' }}
        >

          {/* ════ TOP CONTACT BAR ════════════════════════════════ */}
          <div
            style={{
              background: 'var(--inv-primary)',
              color: 'var(--inv-primary-fg)',
              padding: '10px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '8px',
              fontSize: '11px',
              opacity: 0.92,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
              {logoUrl ? (
                <img src={logoUrl} alt={storeName} style={{ height: 24, width: 'auto', objectFit: 'contain', borderRadius: 4 }} />
              ) : (
                <span style={{
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: '6px',
                  padding: '2px 8px',
                  fontWeight: 900,
                  letterSpacing: '0.06em',
                  fontSize: 12,
                }}>
                  {storeName}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', opacity: 0.9 }}>
              {contactPhone && <span>📞 {contactPhone}</span>}
              {contactEmail && <span>✉ {contactEmail}</span>}
              {address      && <span>📍 {address}</span>}
            </div>
          </div>

          {/* ════ HERO HEADER ════════════════════════════════════ */}
          <div
            style={{
              background: 'var(--inv-primary)',
              color: 'var(--inv-primary-fg)',
              padding: '28px 32px 32px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Decorative dots — top left */}
            <div style={{ position: 'absolute', top: -8, left: -8, opacity: 0.18 }}>
              <DotPattern color="var(--inv-primary-fg)" opacity={1} />
            </div>
            {/* Decorative rings — bottom right */}
            <div style={{ position: 'absolute', bottom: -10, right: 200, opacity: 0.22 }}>
              <RingDecor color="var(--inv-primary-fg)" size={80} />
            </div>
            <div style={{ position: 'absolute', bottom: 10, right: 260, opacity: 0.14 }}>
              <RingDecor color="var(--inv-primary-fg)" size={40} />
            </div>

            <div style={{ position: 'relative', zIndex: 1 }}>
              {/* Big title */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <h1 style={{
                    fontSize: 'clamp(36px, 6vw, 56px)',
                    fontWeight: 900,
                    letterSpacing: '-0.02em',
                    margin: 0,
                    lineHeight: 1.1,
                    color: 'var(--inv-primary-fg)',
                  }}>
                    فاتورة
                  </h1>
                  <p style={{ fontSize: 12, opacity: 0.7, marginTop: 4, letterSpacing: '0.12em', fontWeight: 600 }}>
                    INVOICE
                  </p>
                </div>
                {/* X O X decorative */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: 0.35, fontSize: 28, fontWeight: 900, letterSpacing: 4 }}>
                  <span>×</span>
                  <span style={{ fontSize: 20, borderRadius: '50%', border: '3px solid currentColor', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
                  <span>×</span>
                </div>
              </div>

              {/* 2-col: invoice meta + customer info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '24px' }}>
                {/* Invoice meta */}
                <div style={{
                  background: 'rgba(255,255,255,0.12)',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  backdropFilter: 'blur(4px)',
                }}>
                  <div style={{ display: 'grid', gap: '6px' }}>
                    {[
                      ['رقم الفاتورة', order.orderNumber],
                      ['التاريخ', date],
                      ['الوقت', time],
                      ['الحالة', null],
                    ].map(([label, val]) => (
                      <div key={label as string} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, gap: 8, alignItems: 'center' }}>
                        <span style={{ opacity: 0.7 }}>{label}</span>
                        {val ? (
                          <span style={{ fontWeight: 700, fontFamily: 'monospace', textAlign: 'left' }}>{val}</span>
                        ) : (
                          <span
                            className="inv-status-badge"
                            style={{ background: status.color, color: '#fff' }}
                          >
                            {status.label}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Customer info */}
                <div style={{
                  background: 'rgba(255,255,255,0.12)',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  backdropFilter: 'blur(4px)',
                }}>
                  <p style={{ fontSize: 10, fontWeight: 700, opacity: 0.6, letterSpacing: '0.1em', marginBottom: 8 }}>فاتورة إلى</p>
                  <p style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>{order.customerName}</p>
                  {order.customerEmail && (
                    <p style={{ fontSize: 12, opacity: 0.8, marginBottom: 2 }}>{order.customerEmail}</p>
                  )}
                  {order.customerPhone && (
                    <p style={{ fontSize: 12, opacity: 0.8, marginBottom: 2 }}>{order.customerPhone}</p>
                  )}
                  {order.address && (
                    <p style={{ fontSize: 12, opacity: 0.75, marginTop: 4, lineHeight: 1.5 }}>{order.address}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ════ ITEMS TABLE ════════════════════════════════════ */}
          <div style={{ padding: '0' }}>
            <table className="inv-table">
              <thead>
                <tr>
                  <th style={{ width: 40, textAlign: 'center' }}>#</th>
                  <th>المنتج</th>
                  <th style={{ width: 80, textAlign: 'center' }}>الكمية</th>
                  <th style={{ width: 110, textAlign: 'left' }}>السعر</th>
                  <th style={{ width: 110, textAlign: 'left' }}>الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item: any, idx: number) => (
                  <tr key={idx}>
                    <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--inv-muted-fg)', fontSize: 12 }}>
                      {idx + 1}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <img
                          src={item.image}
                          alt={item.name}
                          style={{
                            width: 40, height: 40, borderRadius: 6,
                            objectFit: 'cover', flexShrink: 0,
                            border: '1px solid var(--inv-border)',
                          }}
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                        <div>
                          <p style={{ fontWeight: 600, margin: 0 }}>{item.name}</p>
                          {item.isDigital && (
                            <span style={{
                              fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                              color: 'var(--inv-primary)', opacity: 0.85,
                            }}>
                              منتج رقمي
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 600 }}>{item.quantity}</td>
                    <td style={{ textAlign: 'left', direction: 'ltr' }}>{formatPrice(item.price)}</td>
                    <td style={{ textAlign: 'left', direction: 'ltr', fontWeight: 700 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                        <span>{formatPrice(item.price * item.quantity)}</span>
                        {/* Download button */}
                        {item.isDigital && item.downloadUrl && canDownload && (
                          <button
                            className="no-print"
                            onClick={() => handleDownload(item, idx)}
                            disabled={downloading[idx]}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                              fontSize: 11, fontWeight: 700, padding: '3px 10px',
                              background: 'var(--inv-primary)', color: 'var(--inv-primary-fg)',
                              border: 'none', borderRadius: 6, cursor: 'pointer', opacity: downloading[idx] ? 0.6 : 1,
                            }}
                          >
                            {downloading[idx]
                              ? <Loader2 style={{ width: 12, height: 12 }} className="animate-spin" />
                              : <Download style={{ width: 12, height: 12 }} />}
                            تحميل
                          </button>
                        )}
                        {item.isDigital && !canDownload && order.status !== 'cancelled' && (
                          <span className="no-print" style={{ fontSize: 10, color: 'var(--inv-muted-fg)' }}>
                            ينتظر التأكيد
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ════ TOTALS + NOTES ═════════════════════════════════ */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 320px',
            gap: '24px',
            padding: '24px 32px 28px',
            borderTop: '1px solid var(--inv-border)',
          }}>

            {/* Left: notes / digital lock notice */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 12 }}>
              {order.notes && (
                <div style={{
                  background: 'var(--inv-muted)', borderRadius: 8,
                  padding: '12px 14px', fontSize: 12, lineHeight: 1.7,
                  color: 'var(--inv-muted-fg)', border: '1px solid var(--inv-border)',
                }}>
                  <p style={{ fontWeight: 700, marginBottom: 4, fontSize: 11, letterSpacing: '0.06em' }}>ملاحظات</p>
                  <p style={{ margin: 0 }}>{order.notes}</p>
                </div>
              )}
              {items.some((i: any) => i.isDigital) && !canDownload && order.status !== 'cancelled' && (
                <div className="no-print" style={{
                  background: 'var(--inv-muted)', borderRadius: 8,
                  padding: '12px 14px', fontSize: 12, textAlign: 'center',
                  color: 'var(--inv-muted-fg)', border: '1px solid var(--inv-border)',
                }}>
                  🔒 روابط تحميل المنتجات الرقمية ستتاح بعد تأكيد الطلب
                </div>
              )}
              {/* Decorative bottom-left dots */}
              <div style={{ opacity: 0.15, marginTop: 'auto' }}>
                <DotPattern color="var(--inv-primary)" opacity={1} />
              </div>
            </div>

            {/* Right: totals breakdown */}
            <div>
              <div className="inv-totals-row">
                <span>المجموع الفرعي</span>
                <span style={{ fontWeight: 600, direction: 'ltr' }}>{formatPrice(subtotal)}</span>
              </div>
              {shipping > 0 && (
                <div className="inv-totals-row">
                  <span>الشحن</span>
                  <span style={{ fontWeight: 600, direction: 'ltr' }}>{formatPrice(shipping)}</span>
                </div>
              )}
              {tax > 0 && (
                <div className="inv-totals-row">
                  <span>الضريبة</span>
                  <span style={{ fontWeight: 600, direction: 'ltr' }}>{formatPrice(tax)}</span>
                </div>
              )}
              {discountAmount > 0 && (
                <div className="inv-totals-row" style={{ color: '#10b981' }}>
                  <span>خصم {order.discountCode ? `(${order.discountCode})` : ''}</span>
                  <span style={{ fontWeight: 600, direction: 'ltr' }}>- {formatPrice(discountAmount)}</span>
                </div>
              )}
              <div style={{ borderTop: '2px solid var(--inv-border)', margin: '10px 0' }} />
              <div className="inv-totals-row total">
                <span>الإجمالي</span>
                <span style={{ direction: 'ltr' }}>{formatPrice(total)}</span>
              </div>
            </div>
          </div>

          {/* ════ FOOTER ═════════════════════════════════════════ */}
          <div
            style={{
              background: 'var(--inv-primary)',
              color: 'var(--inv-primary-fg)',
              padding: '14px 32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 8,
              fontSize: 12,
              opacity: 0.9,
            }}
          >
            <span style={{ fontWeight: 700 }}>شكراً لتسوقك معنا</span>
            <span style={{ fontWeight: 900, letterSpacing: '0.06em', opacity: 0.85 }}>{storeName}</span>
            {/* X O X footer decor */}
            <span style={{ opacity: 0.3, letterSpacing: 6, fontWeight: 900 }}>× ○ ×</span>
          </div>

        </div>
      </div>
    </>
  );
}
