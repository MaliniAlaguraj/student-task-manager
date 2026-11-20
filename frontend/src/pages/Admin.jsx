import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Navigate, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, LogOut, Menu, X, Search, Eye, Inbox, Clock, Loader, CheckCircle2, Lock, Home } from 'lucide-react';
import { api, CATEGORIES, STATUSES, fmt } from '../api.js';
import { StatusBadge, useToast } from '../App.jsx';

export function AdminLogin() {
  const nav = useNavigate();
  const toast = useToast();
  const [f, setF] = useState({ username: '', password: '' });
  const submit = async (e) => {
    e.preventDefault();
    try {
      const { token } = await api.login(f);
      localStorage.setItem('adminToken', token);
      toast('Signed in as admin.');
      nav('/admin');
    } catch (ex) { toast(ex.message, 'error'); }
  };
  return (
    <div className="login-wrap">
      <form className="card form login" onSubmit={submit}>
        <Lock size={32} />
        <h2>Admin login</h2>
        <p className="demo-note">Demo credentials only: username <b>admin</b>, password <b>admin123</b>. This is not production security.</p>
        <label className="field"><span>Username</span><input value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} autoFocus /></label>
        <label className="field"><span>Password</span><input type="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></label>
        <button className="btn primary">Sign in</button>
        <Link to="/" className="btn ghost"><Home size={16} /> Back to home</Link>
      </form>
    </div>
  );
}

function Overview({ stats, onOpen }) {
  const cards = [
    ['Total complaints', stats.total, Inbox, 'total'],
    ['Pending', stats.pending, Clock, 'pending'],
    ['In progress', stats.inProgress, Loader, 'in-progress'],
    ['Resolved', stats.resolved, CheckCircle2, 'resolved'],
  ];
  const max = Math.max(1, ...stats.byCategory.map((c) => c.count));
  return (
    <>
      <div className="stats">
        {cards.map(([label, n, Icon, cls]) => (
          <div key={label} className={'card stat ' + cls}><Icon size={26} /><div><b>{n}</b><span>{label}</span></div></div>
        ))}
      </div>
      <section className="card">
        <div className="row between"><h2>Complaints by category</h2><button className="btn ghost" onClick={onOpen}>View all complaints</button></div>
        {stats.byCategory.length === 0 && <p className="empty">No complaints yet.</p>}
        {stats.byCategory.map((c) => (
          <div key={c.category} className="bar-row"><span>{c.category}</span><div className="bar"><i style={{ width: (c.count / max) * 100 + '%' }} /></div><b>{c.count}</b></div>
        ))}
      </section>
    </>
  );
}

function Complaints({ list, reload }) {
  const toast = useToast();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [st, setSt] = useState('');
  const [sel, setSel] = useState(null);

  const rows = useMemo(() => list.filter((c) =>
    (!cat || c.category === cat) && (!st || c.status === st) &&
    (!q || [c.complaintId, c.studentName, c.registerNo, c.description].some((v) => v.toLowerCase().includes(q.toLowerCase())))
  ), [list, q, cat, st]);

  const update = async (id, status) => {
    try {
      const u = await api.setStatus(id, status);
      toast(`${id} marked as ${status}.`);
      if (sel && sel.complaintId === id) setSel(u);
      reload();
    } catch (ex) { toast(ex.message, 'error'); }
  };

  return (
    <>
      <div className="card filters">
        <label className="search"><Search size={16} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by ID, name, register no. or text" /></label>
        <select value={cat} onChange={(e) => setCat(e.target.value)}><option value="">All categories</option>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
        <select value={st} onChange={(e) => setSt(e.target.value)}><option value="">All statuses</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
        <button className="btn ghost" onClick={() => { setQ(''); setCat(''); setSt(''); }}>Clear filters</button>
      </div>
      <div className="card table-wrap">
        <table>
          <thead><tr><th>ID</th><th>Student</th><th>Category</th><th>Description</th><th>Submitted</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.complaintId}>
                <td><b>{c.complaintId}</b></td>
                <td>{c.studentName}<br /><span className="muted small">{c.registerNo} &bull; {c.department}</span></td>
                <td>{c.category}</td>
                <td className="desc">{c.description}</td>
                <td className="small">{fmt(c.createdAt)}</td>
                <td><StatusBadge status={c.status} /></td>
                <td className="actions">
                  <select value={c.status} onChange={(e) => update(c.complaintId, e.target.value)} aria-label="Update status">{STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
                  <button className="btn ghost icon" title="View details" onClick={() => setSel(c)}><Eye size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="empty">No complaints match these filters.</p>}
      </div>
      {sel && (
        <div className="modal-bg" onClick={() => setSel(null)}>
          <div className="modal card" onClick={(e) => e.stopPropagation()}>
            <div className="row between"><h2>{sel.complaintId}</h2><button className="btn ghost icon" onClick={() => setSel(null)} aria-label="Close"><X size={18} /></button></div>
            <StatusBadge status={sel.status} />
            <dl>
              <dt>Student</dt><dd>{sel.studentName} ({sel.registerNo})</dd>
              <dt>Department</dt><dd>{sel.department}</dd>
              <dt>Category</dt><dd>{sel.category}</dd>
              <dt>Description</dt><dd>{sel.description}</dd>
              <dt>Submitted</dt><dd>{fmt(sel.createdAt)}</dd>
              <dt>Last updated</dt><dd>{fmt(sel.updatedAt)}</dd>
            </dl>
            <label className="field"><span>Update status</span>
              <select value={sel.status} onChange={(e) => update(sel.complaintId, e.target.value)}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
            </label>
          </div>
        </div>
      )}
    </>
  );
}

export function AdminLayout({ view }) {
  const nav = useNavigate();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [list, setList] = useState([]);
  const [stats, setStats] = useState(null);
  const authed = !!localStorage.getItem('adminToken');

  const logout = useCallback(() => { localStorage.removeItem('adminToken'); nav('/admin/login'); }, [nav]);
  const reload = useCallback(async () => {
    try {
      const [l, s] = await Promise.all([api.all(), api.stats()]);
      setList(l); setStats(s);
    } catch (ex) {
      if (ex.status === 401) { toast('Session expired. Please sign in again.', 'error'); logout(); }
      else toast(ex.message, 'error');
    }
  }, [logout, toast]);

  useEffect(() => { if (authed) reload(); }, [authed, view, reload]);
  if (!authed) return <Navigate to="/admin/login" replace />;

  const links = [['/admin', 'Overview', LayoutDashboard, true], ['/admin/complaints', 'All complaints', ClipboardList, false]];
  return (
    <div className="admin">
      <aside className={'sidebar' + (open ? ' open' : '')}>
        <h1>Campus Admin</h1>
        <nav>
          {links.map(([to, label, Icon, end]) => (
            <NavLink key={to} to={to} end={end} onClick={() => setOpen(false)}><Icon size={18} /> {label}</NavLink>
          ))}
        </nav>
        <button className="logout" onClick={logout}><LogOut size={18} /> Log out</button>
      </aside>
      <div className="admin-main">
        <header className="topbar">
          <button className="btn ghost icon menu-btn" onClick={() => setOpen(!open)} aria-label="Toggle menu"><Menu size={20} /></button>
          <strong>{view === 'overview' ? 'Overview' : 'All complaints'}</strong>
        </header>
        <main className="container wide">
          {!stats ? <p className="empty">Loading...</p> : view === 'overview'
            ? <Overview stats={stats} onOpen={() => nav('/admin/complaints')} />
            : <Complaints list={list} reload={reload} />}
        </main>
      </div>
    </div>
  );
}
