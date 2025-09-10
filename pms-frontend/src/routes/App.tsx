/**
 * routes/App.tsx
 * --------------
 * Defines routes with:
 *  - Private: requires JWT
 *  - AdminOnly: requires isSuperAdmin (from JWT payload or stored user)
 */

import { Route, Routes, Navigate, useLocation } from 'react-router-dom';
import Login from '../views/Login';
import Landing from '../views/Landing';
import MyProjects from '../views/MyProjects';
import ProjectDetails from '../views/ProjectDetails';
import AdminHome from '../views/admin/AdminHome'; // <-- ensure path/casing

function decodeJwtPayload(token: string): any | null {
  try {
    const [, b64] = token.split('.');
    if (!b64) return null;
    const fixed = b64.replace(/-/g, '+').replace(/_/g, '/');
    const pad = fixed.length % 4 ? '='.repeat(4 - (fixed.length % 4)) : '';
    return JSON.parse(atob(fixed + pad));
  } catch {
    return null;
  }
}

function Private({ children }: { children: JSX.Element }) {
  const token = localStorage.getItem('token');
  const loc = useLocation();
  if (!token) return <Navigate to="/login" state={{ from: loc }} replace />;
  return children;
}

function AdminOnly({ children }: { children: JSX.Element }) {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const payload = token ? decodeJwtPayload(token) : null;
  const isAdmin = !!(payload && payload.isSuperAdmin) || !!user?.isSuperAdmin;
  if (!isAdmin) return <Navigate to="/landing" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* regular protected pages */}
      <Route path="/landing" element={<Private><Landing /></Private>} />
      <Route path="/projects" element={<Private><MyProjects /></Private>} />
      <Route path="/projects/:id" element={<Private><ProjectDetails /></Private>} />

      {/* 🛡️ admin-only */}
      <Route
        path="/admin"
        element={
          <Private>
            <AdminOnly>
              <AdminHome />
            </AdminOnly>
          </Private>
        }
      />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
