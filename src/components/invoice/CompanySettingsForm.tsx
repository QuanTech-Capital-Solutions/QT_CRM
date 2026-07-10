import { useState, useRef } from 'react';
import { Upload, X, Building2, CreditCard, Save } from 'lucide-react';
import { type CompanySettings } from '../../lib/types';
import { supabase } from '../../lib/supabase';

interface CompanySettingsFormProps {
  settings: CompanySettings | null;
  onSaved: (settings: CompanySettings) => void;
}

const resizeImageToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const MAX_W = 400, MAX_H = 180;
      const ratio = Math.min(MAX_W / img.width, MAX_H / img.height, 1);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * ratio);
      canvas.height = Math.round(img.height * ratio);
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/png', 0.85));
    };
    img.onerror = reject;
    img.src = url;
  });

export function CompanySettingsForm({ settings, onSaved }: CompanySettingsFormProps) {
  const [form, setForm] = useState({
    company_name: settings?.company_name ?? '',
    company_tagline: settings?.company_tagline ?? '',
    company_address: settings?.company_address ?? '',
    company_phone: settings?.company_phone ?? '',
    company_email: settings?.company_email ?? '',
    bank_name: settings?.bank_name ?? '',
    account_name: settings?.account_name ?? '',
    account_number: settings?.account_number ?? '',
    branch_code: settings?.branch_code ?? '',
    logo_data_url: settings?.logo_data_url ?? null as string | null,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (field: string, value: string | null) => setForm((f) => ({ ...f, [field]: value }));

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('Logo must be under 5 MB.'); return; }
    const dataUrl = await resizeImageToBase64(file);
    set('logo_data_url', dataUrl);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form };
    const { data, error } = await supabase
      .from('company_settings')
      .upsert(payload, { onConflict: 'user_id' })
      .select()
      .maybeSingle();
    setSaving(false);
    if (!error && data) {
      onSaved(data as CompanySettings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  };

  const inputCls = 'input-field bg-light-canvas dark:bg-dark-canvas border-light-border dark:border-dark-border text-sm';
  const labelCls = 'block text-xs font-medium text-light-secondary dark:text-dark-secondary mb-1.5';

  return (
    <form onSubmit={handleSave} className="max-w-2xl space-y-8">
      {/* Logo */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Building2 size={16} className="text-violet-600 dark:text-violet-400" />
          <h2 className="text-sm font-semibold">Company Branding</h2>
        </div>
        <div className="card border-light-border dark:border-dark-card bg-light-card dark:bg-dark-card p-5 space-y-4">
          {/* Logo upload */}
          <div>
            <label className={labelCls}>Company Logo</label>
            <div className="flex items-start gap-4">
              <div className="w-36 h-20 border-2 border-dashed border-light-border dark:border-dark-border rounded-lg flex items-center justify-center bg-light-canvas dark:bg-dark-canvas overflow-hidden flex-shrink-0">
                {form.logo_data_url ? (
                  <img src={form.logo_data_url} alt="Logo preview" className="max-w-full max-h-full object-contain p-2" />
                ) : (
                  <span className="text-xs text-light-secondary dark:text-dark-secondary text-center px-2">No logo yet</span>
                )}
              </div>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="btn-secondary border-light-border dark:border-dark-border text-sm hover:bg-light-canvas dark:hover:bg-dark-canvas"
                >
                  <Upload size={14} />
                  Upload Logo
                </button>
                {form.logo_data_url && (
                  <button
                    type="button"
                    onClick={() => set('logo_data_url', null)}
                    className="flex items-center gap-1.5 text-xs text-rose-500 hover:underline"
                  >
                    <X size={12} />
                    Remove
                  </button>
                )}
                <p className="text-xs text-light-secondary dark:text-dark-secondary">PNG or JPG, max 5 MB. Resized to 400×180 px.</p>
                <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/jpg,image/webp" className="hidden" onChange={handleLogoUpload} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Company Name</label>
              <input className={inputCls} value={form.company_name} onChange={(e) => set('company_name', e.target.value)} placeholder="QuanTech Capital Solutions" />
            </div>
            <div>
              <label className={labelCls}>Tagline (optional)</label>
              <input className={inputCls} value={form.company_tagline} onChange={(e) => set('company_tagline', e.target.value)} placeholder="Tech Consultation for Capital Markets" />
            </div>
          </div>
          <div>
            <label className={labelCls}>Company Address</label>
            <textarea rows={3} className={`${inputCls} resize-none w-full`} value={form.company_address} onChange={(e) => set('company_address', e.target.value)} placeholder={'1 Sandton Drive\nSandton, Johannesburg\n2196'} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Email</label>
              <input type="email" className={inputCls} value={form.company_email} onChange={(e) => set('company_email', e.target.value)} placeholder="contact@quantech.io" />
            </div>
            <div>
              <label className={labelCls}>Phone</label>
              <input className={inputCls} value={form.company_phone} onChange={(e) => set('company_phone', e.target.value)} placeholder="+27 11 000 0000" />
            </div>
          </div>
        </div>
      </section>

      {/* Banking details */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <CreditCard size={16} className="text-violet-600 dark:text-violet-400" />
          <h2 className="text-sm font-semibold">Payment Details</h2>
          <span className="text-xs text-light-secondary dark:text-dark-secondary">— shown on printed invoices</span>
        </div>
        <div className="card border-light-border dark:border-dark-card bg-light-card dark:bg-dark-card p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Bank Name</label>
              <input className={inputCls} value={form.bank_name} onChange={(e) => set('bank_name', e.target.value)} placeholder="First National Bank" />
            </div>
            <div>
              <label className={labelCls}>Account Name</label>
              <input className={inputCls} value={form.account_name} onChange={(e) => set('account_name', e.target.value)} placeholder="QuanTech Capital Solutions (Pty) Ltd" />
            </div>
            <div>
              <label className={labelCls}>Account Number</label>
              <input className={inputCls} value={form.account_number} onChange={(e) => set('account_number', e.target.value)} placeholder="62000000000" />
            </div>
            <div>
              <label className={labelCls}>Branch Code</label>
              <input className={inputCls} value={form.branch_code} onChange={(e) => set('branch_code', e.target.value)} placeholder="250655" />
            </div>
          </div>
        </div>
      </section>

      <div className="flex items-center gap-4">
        <button type="submit" disabled={saving} className="btn-primary bg-violet-600 text-white hover:bg-violet-700 shadow-lg shadow-violet-600/20 disabled:opacity-60">
          <Save size={15} />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
        {saved && <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Settings saved!</span>}
      </div>
    </form>
  );
}
