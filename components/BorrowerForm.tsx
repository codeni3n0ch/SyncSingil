 "use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase";

export default function BorrowerForm(){
 const [open,setOpen]=useState(false); const [name,setName]=useState(""); const [contact,setContact]=useState(""); const [address,setAddress]=useState(""); const [area,setArea]=useState(""); const [busy,setBusy]=useState(false); const [error,setError]=useState("");
 async function save(){
  setBusy(true);setError("");
  if(!name.trim()){setError("Full name is required.");setBusy(false);return;}
  if(contact && !/^[0-9+()\-\s]{7,20}$/.test(contact)){setError("Enter a valid contact number.");setBusy(false);return;}
  const supabase=createClient();
  const code="B-"+Date.now().toString().slice(-6);
  const {error}=await supabase.from("borrowers").insert({borrower_code:code,full_name:name,contact_number:contact,address,area,status:"active"});
  setBusy(false); if(error){setError(error.message);return;} window.location.reload();
 }
 return <div className="card">
  <div className="card-head"><div><h3>Add Borrower</h3><div className="muted">Create a real borrower record in Supabase.</div></div><button className="btn" onClick={()=>setOpen(!open)}>{open?"Close":"Open Form"}</button></div>
  {open&&<div style={{marginTop:15}}><div className="form-grid">
   <div className="field"><label>Full Name</label><input className="input" value={name} onChange={e=>setName(e.target.value)} placeholder="Juan Dela Cruz"/></div>
   <div className="field"><label>Contact Number</label><input className="input" value={contact} onChange={e=>setContact(e.target.value)} placeholder="09XXXXXXXXX"/></div>
   <div className="field"><label>Address</label><input className="input" value={address} onChange={e=>setAddress(e.target.value)} placeholder="Complete address"/></div>
   <div className="field"><label>Area / Zone</label><input className="input" value={area} onChange={e=>setArea(e.target.value)} placeholder="Zone 1"/></div>
  </div>{error&&<div className="error" style={{marginTop:12}}>{error}</div>}<button className="btn primary" style={{marginTop:15}} disabled={busy||!name.trim()} onClick={save}>{busy?"Saving...":"Save Borrower"}</button></div>}
 </div>
}
