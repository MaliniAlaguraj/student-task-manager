import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, ShieldCheck, ArrowRight, MessageSquareWarning } from 'lucide-react';

export default function Landing() {
  return (
    <div className="landing">
      <header className="landing-hero">
        <MessageSquareWarning size={44} />
        <h1>Smart Campus Complaint Management System</h1>
        <p>Report a problem on campus, follow its progress, and see it resolved. Choose how you want to continue.</p>
      </header>
      <main className="role-grid">
        <Link to="/student" className="role-card">
          <GraduationCap size={36} />
          <h2>Student Portal</h2>
          <p>Submit a complaint, track it by ID, and view everything you have reported.</p>
          <span className="role-go">Open student portal <ArrowRight size={16} /></span>
        </Link>
        <Link to="/admin/login" className="role-card">
          <ShieldCheck size={36} />
          <h2>Admin Dashboard</h2>
          <p>Monitor all complaints, filter them, and update their status.</p>
          <span className="role-go">Admin login <ArrowRight size={16} /></span>
        </Link>
      </main>
    </div>
  );
}
