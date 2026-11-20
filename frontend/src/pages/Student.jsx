import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Home, FilePlus2, ListChecks, Search, Send } from 'lucide-react';
import { api, CATEGORIES, DEPARTMENTS, fmt } from '../api.js';
import { StatusBadge, useToast } from '../App.jsx';

function ComplaintCard({ c }) {
  return (
    <article className="card complaint">
      <div className="row between">
        <strong className="cid">{c.complaintId}</strong>
        <StatusBadge status={c.status} />
      </div>
      <p className="muted">{c.category} &bull; {c.department}</p>
      <p>{c.description}</p>
      <p className="muted small">Submitted {fmt(c.createdAt)} &bull; Last updated {fmt(c.updatedAt)}</p>
    </article>
  );
}

function SubmitForm({ onSubmitted }) {
  const toast = useToast();
  const empty = { studentName: '', registerNo: '', department: '', category: '', description: '' };
  const [f, setF] = useState(empty);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const err = {};
    if (!f.studentName.trim()) err.studentName = 'Enter your name.';
    if (!f.registerNo.trim()) err.registerNo = 'Enter your register number.';
    if (!f.department) err.department = 'Select your department.';
    if (!f.category) err.category = 'Select a category.';
    if (f.description.trim().length < 10) err.description = 'Describe the problem in at least 10 characters.';
    setErrors(err);
    if (Object.keys(err).length) return toast('Please fix the highlighted fields.', 'error');
    setBusy(true);
    try {
      const c = await api.submit(f);
      toast(`Complaint submitted. Your ID is ${c.complaintId}`);
      setF(empty);
      onSubmitted(c);
    } catch (ex) {
      toast(ex.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const field = (k, label, input) => (
    <label className={'field' + (errors[k] ? ' invalid' : '')}>
      <span>{label}</span>
      {input}
      {errors[k] && <em>{errors[k]}</em>}
    </label>
  );

  return (
    <form className="card form" onSubmit={submit} noValidate>
      <h2>Submit a complaint</h2>
      <div className="grid2">
        {field('studentName', 'Student name', <input value={f.studentName} onChange={set('studentName')} placeholder="e.g. Arun Kumar" />)}
        {field('registerNo', 'Register number', <input value={f.registerNo} onChange={set('registerNo')} placeholder="e.g. 21CS001" />)}
        {field('department', 'Department', (
          <select value={f.department} onChange={set('department')}>
            <option value="">Select department</option>
            {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
          </select>
        ))}
        {field('category', 'Complaint category', (
          <select value={f.category} onChange={set('category')}>
            <option value="">Select category</option>
            {CATEGORIES.map((d) => <option key={d}>{d}</option>)}
          </select>
        ))}
      </div>
      {field('description', 'Complaint description', <textarea rows="5" value={f.description} onChange={set('description')} placeholder="Where is the problem and what is wrong?" />)}
      <button className="btn primary" disabled={busy}><Send size={16} /> {busy ? 'Submitting...' : 'Submit complaint'}</button>
    </form>
  );
}

function MyComplaints({ initialReg }) {
  const toast = useToast();
  const [reg, setReg] = useState(initialReg || localStorage.getItem('studentReg') || '');
  const [list, setList] = useState(null);

  const load = useCallback(async (r, quiet) => {
    if (!r.trim()) return quiet || toast('Enter your register number.', 'error');
    try {
      setList(await api.byRegister(r));
      localStorage.setItem('studentReg', r.trim().toUpperCase());
    } catch (ex) { if (!quiet) toast(ex.message, 'error'); }
  }, [toast]);

  useEffect(() => { if (reg) load(reg, true); }, [initialReg]); // eslint-disable-line
  useEffect(() => { // pick up admin status changes without a manual refresh
    const t = setInterval(() => reg && load(reg, true), 8000);
    return () => clearInterval(t);
  }, [reg, load]);

  return (
    <section>
      <form className="card row searchbar" onSubmit={(e) => { e.preventDefault(); load(reg); }}>
        <input value={reg} onChange={(e) => setReg(e.target.value)} placeholder="Your register number, e.g. 21CS001" />
        <button className="btn primary"><Search size={16} /> Show my complaints</button>
      </form>
      {list && list.length === 0 && <p className="empty">No complaints found for this register number.</p>}
      <div className="list">{list && list.map((c) => <ComplaintCard key={c.complaintId} c={c} />)}</div>
    </section>
  );
}

function Track() {
  const toast = useToast();
  const [id, setId] = useState('');
  const [c, setC] = useState(null);
  const find = async (e) => {
    e.preventDefault();
    if (!id.trim()) return toast('Enter a complaint ID.', 'error');
    try { setC(await api.byId(id)); } catch (ex) { setC(null); toast(ex.message, 'error'); }
  };
  return (
    <section>
      <form className="card row searchbar" onSubmit={find}>
        <input value={id} onChange={(e) => setId(e.target.value)} placeholder="Complaint ID, e.g. CMP-1001" />
        <button className="btn primary"><Search size={16} /> Track complaint</button>
      </form>
      {c && <div className="list"><ComplaintCard c={c} /></div>}
    </section>
  );
}

export default function Student() {
  const [tab, setTab] = useState('submit');
  const [reg, setReg] = useState('');
  const tabs = [['submit', 'Submit complaint', FilePlus2], ['mine', 'My complaints', ListChecks], ['track', 'Track by ID', Search]];
  return (
    <div className="portal">
      <header className="topbar">
        <strong>Student Portal</strong>
        <Link to="/" className="btn ghost"><Home size={16} /> Home</Link>
      </header>
      <nav className="tabs">
        {tabs.map(([k, label, Icon]) => (
          <button key={k} className={tab === k ? 'active' : ''} onClick={() => setTab(k)}><Icon size={16} /> {label}</button>
        ))}
      </nav>
      <main className="container">
        {tab === 'submit' && <SubmitForm onSubmitted={(c) => { setReg(c.registerNo); localStorage.setItem('studentReg', c.registerNo); setTab('mine'); }} />}
        {tab === 'mine' && <MyComplaints initialReg={reg} />}
        {tab === 'track' && <Track />}
      </main>
    </div>
  );
}
