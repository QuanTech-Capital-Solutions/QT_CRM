import { useEffect, useState, useRef } from 'react';
import { Mail, Save, Upload, Shield, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { type AdminProfile } from '../lib/types';

const resizeImageToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 256;
      const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
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

export function AdminProfilePage() {
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [authEmail, setAuthEmail] = useState('');
  const [createdAt, setCreatedAt] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    full_name: '',
    title: '',
    phone: '',
    avatar_url: null as string | null,
    bio: '',
  });

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setAuthEmail(user.email ?? '');
        setCreatedAt(user.created_at ?? '');
        const { data } = await supabase.from('admin_profiles').select('*').eq('id', user.id).maybeSingle();
        if (data) {
          setProfile(data as AdminProfile);
          setForm({
            full_name: (data as AdminProfile).full_name,
            title: (data as AdminProfile).title ?? '',
            phone: (data as AdminProfile).phone ?? '',
            avatar_url: (data as AdminProfile).avatar_url,
            bio: (data as AdminProfile).bio ?? '',
          });
        }
      }
      setLoading(false);
    })();
  }, []);

  const set = (field: string, value: string | null) => setForm((f) => ({ ...f, [field]: value }));

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('Image must be under 5 MB.'); return; }
    const dataUrl = await resizeImageToBase64(file);
    set('avatar_url', dataUrl);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    if (profile) {
      const { error } = await supabase
        .from('admin_profiles')
        .update({
          full_name: form.full_name,
          title: form.title || null,
          phone: form.phone || null,
          avatar_url: form.avatar_url,
          bio: form.bio || null,
        })
        .eq('id', user.id);
      if (!error) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    } else {
      const { error } = await supabase
        .from('admin_profiles')
        .insert({
          id: user.id,
          full_name: form.full_name,
          title: form.title || null,
          phone: form.phone || null,
          avatar_url: form.avatar_url,
          bio: form.bio || null,
        });
      if (!error) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    }
    setSaving(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-sm text-light-secondary dark:text-dark-secondary">Loading admin profile...</div>;
  }

  const inputCls = 'input-field bg-light-canvas dark:bg-dark-canvas border-light-border dark:border-dark-border text-sm';
  const labelCls = 'block text-xs font-medium text-light-secondary dark:text-dark-secondary mb-1.5';

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-xl bg-violet-500/10 flex items-center justify-center">
          <Shield size={22} className="text-violet-600 dark:text-violet-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Profile</h1>
          <p className="text-sm text-light-secondary dark:text-dark-secondary mt-0.5">Manage your administrator account details</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Account info card */}
        <div className="card border-light-border dark:border-dark-card bg-light-card dark:bg-dark-card p-5">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-light-secondary dark:text-dark-secondary mb-4">Account</h2>
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center overflow-hidden">
                {form.avatar_url ? (
                  <img src={form.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white text-2xl font-bold">
                    {form.full_name ? form.full_name.slice(0, 2).toUpperCase() : '?'}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-light-card dark:bg-dark-card border-2 border-light-canvas dark:border-dark-canvas flex items-center justify-center shadow-md hover:scale-110 transition-transform"
              >
                <Upload size={13} className="text-light-secondary dark:text-dark-secondary" />
              </button>
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleAvatar} />
            </div>

            {/* Email + created */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Mail size={14} className="text-light-secondary dark:text-dark-secondary" />
                <span className="font-medium">{authEmail || '—'}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-light-secondary dark:text-dark-secondary">
                <Calendar size={13} />
                <span>Account created {createdAt ? new Date(createdAt).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 text-xs font-medium">
                <Shield size={11} />
                Administrator
              </div>
            </div>
          </div>
        </div>

        {/* Profile details */}
        <div className="card border-light-border dark:border-dark-card bg-light-card dark:bg-dark-card p-5 space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-light-secondary dark:text-dark-secondary">Profile Details</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Full Name</label>
              <div className="relative">
                {/*<User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-light-secondary dark:text-dark-secondary" />*/}
                <input
                  className={`${inputCls} pl-9`}
                  value={form.full_name}
                  onChange={(e) => set('full_name', e.target.value)}
                  placeholder="Your full name"
                  required
                />
              </div>
            </div>
            <div>
              <label className={labelCls}>Title</label>
              <div className="relative">
                {/*<Briefcase size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-light-light-secondary dark:text-dark-secondary" />*/}
                <input
                  className={`${inputCls} pl-9`}
                  value={form.title}
                  onChange={(e) => set('title', e.target.value)}
                  placeholder="Managing Director"
                />
              </div>
            </div>
          </div>

          <div>
            <label className={labelCls}>Phone</label>
            <div className="relative">
              {/*<Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-light-secondary dark:text-dark-secondary" />*/}
              <input
                className={`${inputCls} pl-9`}
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                placeholder="+27 11 000 0000"
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Bio</label>
            <textarea
              rows={3}
              className={`${inputCls} resize-none w-full`}
              value={form.bio}
              onChange={(e) => set('bio', e.target.value)}
              placeholder="Short biography or professional summary..."
            />
          </div>
        </div>

        {/* Save */}
        <div className="flex items-center gap-4">
          <button type="submit" disabled={saving} className="btn-primary bg-violet-600 text-white hover:bg-violet-700 shadow-lg shadow-violet-600/20 disabled:opacity-60">
            <Save size={15} />
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
          {saved && <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Profile saved!</span>}
        </div>
      </form>
    </div>
  );
}
