import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../api/admin';

export default function AdminProjectNew(){
  const nav = useNavigate();
  const [form, setForm] = useState({ code: '', name: '', city: '', stage: 'Construction', status: 'Ongoing', health: 'Good' });
  const [err, setErr] = useState<string|null>(null);
  const [ok, setOk] = useState<string|null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null); setOk(null);
    try {
      await adminApi.createProject(form);
      setOk('Project created');
      setTimeout(()=> nav('/admin'), 800);
    } catch (e:any) {
      setErr(e?.response?.data?.message || 'Failed to create');
    }
  };

  const inputCls = "mt-1 block w-full rounded-md border border-gray-300 px-3 py-2";

  return (
    <div className="min-h-screen p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Create New Project</h1>
        <button onClick={()=> nav('/admin')} className="px-3 py-1.5 rounded border">Back</button>
      </div>
      <form onSubmit={onSubmit} className="max-w-xl space-y-4 bg-white p-6 rounded-2xl border">
        <label className="block text-sm font-medium">Code
          <input className={inputCls} value={form.code} onChange={e=> setForm({...form, code:e.target.value})} placeholder="CH-ANN" required />
        </label>
        <label className="block text-sm font-medium">Name
          <input className={inputCls} value={form.name} onChange={e=> setForm({...form, name:e.target.value})} placeholder="City Hospital Annex" required />
        </label>
        <label className="block text-sm font-medium">City
          <input className={inputCls} value={form.city} onChange={e=> setForm({...form, city:e.target.value})} placeholder="Chennai" required />
        </label>
        <label className="block text-sm font-medium">Stage
          <select className={inputCls} value={form.stage} onChange={e=> setForm({...form, stage:e.target.value})}>
            <option>Construction</option><option>Fitout</option><option>Design</option>
          </select>
        </label>
        <label className="block text-sm font-medium">Status
          <select className={inputCls} value={form.status} onChange={e=> setForm({...form, status:e.target.value})}>
            <option>Ongoing</option><option>Completed</option>
          </select>
        </label>
        <label className="block text-sm font-medium">Health
          <select className={inputCls} value={form.health} onChange={e=> setForm({...form, health:e.target.value})}>
            <option>Good</option><option>At Risk</option><option>Delayed</option>
          </select>
        </label>
        <button className="px-4 py-2 rounded bg-emerald-600 text-white">Submit</button>
        {ok && <div className="text-emerald-600 text-sm">{ok}</div>}
        {err && <div className="text-red-600 text-sm">{err}</div>}
      </form>
    </div>
  );
}
