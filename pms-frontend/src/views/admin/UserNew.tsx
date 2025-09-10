import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { endpoints } from '../../api/endpoints';

const ROLES = [
  'Admin','Customer','PMC','Architect','Designer','Contractor',
  'Legal/Liasoning','Ava-PMT','Engineer (Contractor)',
  'DC (Contractor)','DC (PMC)','Inspector (PMC)','HOD (PMC)',
] as const;

export default function AdminUserNew(){
  const nav = useNavigate();
  const [form, setForm] = useState({
    code: '', role: ROLES[0], name: '', city: '',
    email: '', phone: '', isSuperAdmin: false
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string|null>(null);

  // ✅ confirmation modal
  const [confirmOpen, setConfirmOpen] = useState(false);

  const set = (k: keyof typeof form, v: any) => setForm(s => ({...s, [k]: v}));

  const submit = async () => {
    setErr(null);
    if(!form.code || !form.name || (!form.email && !form.phone)) {
      setErr('Code, Name and either Email or Phone are required'); return;
    }
    try{
      setBusy(true);
      const { data } = await api.post(endpoints.admin.users, form);
      if(data?.ok || data?.userId){
        setConfirmOpen(true); // ✅ open confirmation dialog
      }else{
        setErr(data?.error || 'Failed to create user');
      }
    }catch(e:any){ setErr(e?.response?.data?.error || 'Failed to create user'); }
    finally{ setBusy(false); }
  };

  const input = 'border rounded w-full p-3';
  const select = 'border rounded w-full p-3 bg-white';

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-3xl mx-auto bg-white border rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Create New User</h2>
          <button className="border rounded px-3 py-1" onClick={()=>nav(-1)}>Back</button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="text-sm">User Code</label><input className={input} value={form.code} onChange={e=>set('code', e.target.value.toUpperCase())}/></div>
          <div>
            <label className="text-sm">Role</label>
            <select className={select} value={form.role} onChange={e=>set('role', e.target.value)}>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div><label className="text-sm">Name</label><input className={input} value={form.name} onChange={e=>set('name', e.target.value)}/></div>
          <div><label className="text-sm">City</label><input className={input} value={form.city} onChange={e=>set('city', e.target.value)}/></div>
          <div><label className="text-sm">Email</label><input className={input} value={form.email} onChange={e=>set('email', e.target.value)}/></div>
          <div><label className="text-sm">Phone</label><input className={input} value={form.phone} onChange={e=>set('phone', e.target.value)}/></div>
          <div className="sm:col-span-2">
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isSuperAdmin} onChange={e=>set('isSuperAdmin', e.target.checked)} />
              Super Admin (full access)
            </label>
          </div>
        </div>

        {err && <div className="text-red-600 text-sm">{err}</div>}

        <button disabled={busy} onClick={submit} className="px-4 py-2 rounded bg-emerald-600 text-white disabled:opacity-60">
          {busy ? 'Submitting…' : 'Submit'}
        </button>
      </div>

      {/* ✅ Confirmation dialog */}
      {confirmOpen && (
        <div className="fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow">
              <h3 className="text-lg font-semibold">User created</h3>
              <p className="text-sm text-gray-600 mt-2">Your user was created successfully.</p>
              <div className="mt-4 flex justify-end">
                <button
                  className="px-4 py-2 rounded bg-emerald-600 text-white"
                  onClick={() => { setConfirmOpen(false); nav('/admin', { replace: true }); }}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
