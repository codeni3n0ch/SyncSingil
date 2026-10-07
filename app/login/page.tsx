 "use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase";

export default function LoginPage() {
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [error,setError] = useState("");
  const [loading,setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault(); setError(""); setLoading(true);
    const { error } = await createClient().auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError(error.message);
    else window.location.href="/dashboard";
  }

  return <main className="login">
    <form className="login-box" onSubmit={submit}>
      <div className="login-logo"><div className="logo-mark">S</div><div><b>SyncSINGIL</b><small style={{display:"block",color:"#71808b"}}>Microloan Management</small></div></div>
      <h1>Welcome back</h1>
      <div className="sub">Sign in to manage borrowers and collections.</div>
      {error && <div className="error">{error}</div>}
      <div className="field"><label>Email</label><input className="input" value={email} onChange={e=>setEmail(e.target.value)} placeholder="admin@example.com" required type="email"/></div>
      <div className="field"><label>Password</label><input className="input" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" required type="password"/></div>
      <button className="btn primary" disabled={loading}>{loading ? "Signing in..." : "Sign in to Dashboard"}</button>
      <p className="muted" style={{textAlign:"center",marginTop:18}}>Authorized users only</p>
    </form>
  </main>;
}
