import React, { createContext, useCallback, useContext, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { CheckCircle2, XCircle } from 'lucide-react';
import Landing from './pages/Landing.jsx';
import Student from './pages/Student.jsx';
import { AdminLogin, AdminLayout } from './pages/Admin.jsx';

const ToastCtx = createContext(() => {});
export const useToast = () => useContext(ToastCtx);

export function StatusBadge({ status }) {
  return <span className={'badge ' + status.toLowerCase().replace(' ', '-')}>{status}</span>;
}

export default function App() {
  const [toasts, setToasts] = useState([]);
  const toast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  return (
    <ToastCtx.Provider value={toast}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/student" element={<Student />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout view="overview" />} />
        <Route path="/admin/complaints" element={<AdminLayout view="complaints" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <div className="toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={'toast ' + t.type}>
            {t.type === 'success' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
