"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase";

export default function RoleAssignmentForm(){
 const [email,setEmail]=useState("");
 const [role,setRole]=useState("collector");
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState("");
 const [error,setError]=useState("");
 async function save(){
  setBusy(true);setMessage("");setError("");
  if(!email.trim()){setError("Enter the user's email address.");setBusy(false);return;}
  const {error}=await createClient().rpc("set_user_role_by_email",{p_email:email.trim(),p_role:role});
  setBusy(false);
  if(error){setError(error.message);return;}
  setMessage(`Role updated. ${email.trim()} will receive the ${role} dashboard after signing in again.`);
 }
 return <div className="card" style={{marginBottom:17}}>
  <div className="card-head"><div><h3>Assign Dashboard Role</h3><div className="muted">Enter an existing Supabase Auth user's email.</div></div></div>
  <div className="form-grid" style={{marginTop:15}}>
   <div className="field"><label>User Email</label><input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="collector@example.com"/></div>
   <div className="field"><label>Role</label><select className="input" value={role} onChange={e=>setRole(e.target.value)}><option value="collector">Collector</option><option value="staff">Office Staff</option><option value="admin">Administrator</option></select></div>
  </div>
  {message&&<div className="notice" style={{marginTop:12}}>{message}</div>}
  {error&&<div className="error" style={{marginTop:12}}>{error}</div>}
  <button className="btn primary" style={{marginTop:12}} disabled={busy} onClick={save}>{busy?"Updating...":"Update Role"}</button>
 </div>
}
