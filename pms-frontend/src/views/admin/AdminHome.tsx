import { Link } from 'react-router-dom';

export default function AdminHome(){
  return (
    <div className="min-h-screen p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Admin Console</h1>
      <p className="text-sm text-gray-600">Create projects and assign roles to users.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link to="/admin/projects/new" className="p-6 rounded-xl border bg-white hover:shadow">
          <div className="text-lg font-semibold">Create New Project</div>
          <div className="text-sm text-gray-600">Add a project with code, name, city, stage, status, health.</div>
        </Link>
        <Link to="/admin/roles" className="p-6 rounded-xl border bg-white hover:shadow">
          <div className="text-lg font-semibold">Assign Roles</div>
          <div className="text-sm text-gray-600">Assign project-specific roles to users and manage memberships.</div>
        </Link>
      </div>
    </div>
  );
}
