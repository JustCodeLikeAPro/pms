import { useEffect, useState } from 'react';
import { adminApi } from '../../api/admin';

const ROLES = [
  'Customer','PMC','Architect','Designer','Contractor','Legal/Liaisoning','Ava-PMT','DC (Contractor)','DC (PMC)','Inspector (PMC)','HOD (PMC)','Engineer (Contractor)'
];

export default function AdminAssignRoles(){
  const [projectQ, setProjectQ] = useState('');
  const [projects, setProjects] = useState<any[]>([]);
  const [projectId, setProjectId] = useState<string>('');
  const [userQ, setUserQ] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState(ROLES[0]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [err, setErr] = useState<string|null>(null);
  const [ok, setOk] = useState<string|null>(null);

  const doProjectSearch = async () => {
    try { setProjects(await adminApi.searchProjects(projectQ)); }
    catch (e:any) { setErr(e?.response?.data?.message || 'Project search failed'); }
  };

  const doUserSearch = async () => {
    try { setUsers(await adminApi.searchUsers(userQ)); }
    catch (e:any) { setErr(e?.response?.data?.message || 'User search failed'); }
  };

  const loadAssignments = async (pid: string) => {
    try { setAssignments(await adminApi.listAssignments(pid)); }
    catch (e:any) { setErr(e?.response?.data?.message || 'Failed to load assignments'); }
  };

  useEffect(()=>{ if (projectId) loadAssignments(projectId); }, [projectId]);

  const assign = async () => {
    setErr(null); setOk(null);
    if (!projectId || !userId || !role) { setErr('Select project, user, role'); return; }
    try {
      await adminApi.assign({ projectId, userId, role });
      setOk('Assigned');
      await loadAssignments(projectId);
    } catch (e:any) {
      setErr(e?.response?.data?.message || 'Failed to assign');
    }
  };

  const remove = async (id:string) => {
    setErr(null); setOk(null);
    try {
      await adminApi.removeAssignment(id);
      setOk('Removed');
      await loadAssignments(projectId);
    } catch (e:any) {
      setErr(e?.response?.data?.message || 'Failed to remove');
    }
  };

  const inputCls = "mt-1 block w-full rounded-md border border-gray-300 px-3 py-2";

  return (
    <div className="min-h-screen p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Assign Roles</h1>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-3 bg-white p-4 border rounded-xl">
          <div className="text-sm font-medium">1) Choose Project</div>
          <div className="flex gap-2">
            <input className={inputCls} placeholder="Search by code or name" value={projectQ} onChange={e=> setProjectQ(e.target.value)} />
            <button onClick={doProjectSearch} className="px-3 py-2 rounded bg-emerald-600 text-white">Search</button>
          </div>
          <div className="max-h-48 overflow-auto divide-y">
            {projects.map((p:any)=>(
              <button key={p.projectId} onClick={()=> setProjectId(p.projectId)} className={`w-full text-left px-2 py-1 hover:bg-emerald-50 ${projectId===p.projectId?'bg-emerald-100':''}`}>
                {p.code} — {p.name} <span className="text-xs text-gray-500">({p.city})</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3 bg-white p-4 border rounded-xl">
          <div className="text-sm font-medium">2) Choose User</div>
          <div className="flex gap-2">
            <input className={inputCls} placeholder="Search by email, name, code" value={userQ} onChange={e=> setUserQ(e.target.value)} />
            <button onClick={doUserSearch} className="px-3 py-2 rounded bg-emerald-600 text-white">Search</button>
          </div>
          <div className="max-h-48 overflow-auto divide-y">
            {users.map((u:any)=>(
              <button key={u.userId} onClick={()=> setUserId(u.userId)} className={`w-full text-left px-2 py-1 hover:bg-emerald-50 ${userId===u.userId?'bg-emerald-100':''}`}>
                {u.name || u.email} <span className="text-xs text-gray-500">{u.email}</span>
              </button>
            ))}
          </div>
          <div>
            <div className="text-sm font-medium">Role</div>
            <select className={inputCls} value={role} onChange={e=> setRole(e.target.value)}>
              {ROLES.map(r=><option key={r}>{r}</option>)}
            </select>
          </div>
          <button onClick={assign} className="px-4 py-2 rounded bg-emerald-600 text-white">Assign</button>
        </div>
      </div>

      <div className="bg-white p-4 border rounded-xl">
        <div className="text-sm font-medium mb-2">Assignments for selected project</div>
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-4">User</th>
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">Role</th>
                <th className="py-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((a:any)=>(
                <tr key={a.id} className="border-b">
                  <td className="py-1 pr-4">{a.user?.name || a.user?.email}</td>
                  <td className="py-1 pr-4">{a.user?.email}</td>
                  <td className="py-1 pr-4">{a.role}</td>
                  <td className="py-1 pr-4">
                    <button onClick={()=> remove(a.id)} className="px-2 py-1 rounded border hover:bg-gray-50">Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
      </div>

      {ok && <div className="text-emerald-600 text-sm">{ok}</div>}
      {err && <div className="text-red-600 text-sm">{err}</div>}
    </div>
  );
}
