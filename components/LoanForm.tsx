"use client";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase";

const products = ["Gadgets", "Cash", "Livestock", "Other"] as const;

export default function LoanForm(){
 const [borrowers,setBorrowers]=useState<any[]>([]);
 const [open,setOpen]=useState(false);
 const [borrower,setBorrower]=useState("");
 const [product,setProduct]=useState<(typeof products)[number]>("Cash");
 const [amount,setAmount]=useState("");
 const [interestRate,setInterestRate]=useState("15");
 const [due,setDue]=useState("");
 const [frequency,setFrequency]=useState("weekly"); const [nextDueDate,setNextDueDate]=useState("");
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");

 useEffect(()=>{
   createClient().from("borrowers").select("id,full_name,borrower_code").eq("status","active").order("full_name").then(({data})=>setBorrowers(data??[]));
 },[]);

 const principal=Number(amount)||0;
 const interest=useMemo(()=>principal*(Number(interestRate)||0)/100,[principal,interestRate]);
 const total=principal+interest;

 async function save(){
  setBusy(true);setError("");
  if(!borrower||principal<=0||Number(interestRate)<0||Number(interestRate)>100||Number(due)<=0){
    setError("Complete the borrower, amount, interest rate, and scheduled due amount.");setBusy(false);return;
  }
  const supabase=createClient();
  const {error}=await supabase.from("loans").insert({
    borrower_id:borrower,
    loan_code:"L-"+Date.now().toString().slice(-7),
    product,
    original_amount:principal,
    interest_rate:Number(interestRate),
    interest_amount:Number(interest.toFixed(2)),
    total_payable:Number(total.toFixed(2)),
    principal_balance:principal,
    interest_balance:Number(interest.toFixed(2)),
    balance:Number(total.toFixed(2)),
    frequency,
    due_amount:Number(due),
    next_due_date:nextDueDate||null,
    status:"active"
  });
  setBusy(false);
  if(error)setError(error.message);else window.location.reload();
 }

 return <div className="card">
  <div className="card-head"><div><h3>Create Loan</h3><div className="muted">Choose the loan type and see the interest before saving.</div></div><button className="btn" onClick={()=>setOpen(!open)}>{open?"Close":"Open Form"}</button></div>
  {open&&<div style={{marginTop:15}}>
   <div className="form-grid">
    <div className="field"><label>Borrower</label><select className="input" value={borrower} onChange={e=>setBorrower(e.target.value)}><option value="">Select borrower</option>{borrowers.map(b=><option key={b.id} value={b.id}>{b.full_name} ({b.borrower_code})</option>)}</select></div>
    <div className="field"><label>Loan Type</label><select className="input" value={product} onChange={e=>setProduct(e.target.value as any)}>{products.map(p=><option key={p} value={p}>{p}</option>)}</select></div>
    <div className="field"><label>Principal / Loan Amount</label><input className="input" type="number" min="0.01" step="0.01" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="10000"/></div>
    <div className="field"><label>Interest Rate (%)</label><input className="input" type="number" min="0" max="100" step="0.01" value={interestRate} onChange={e=>setInterestRate(e.target.value)} placeholder="15"/></div>
    <div className="field"><label>Scheduled Due Amount</label><input className="input" type="number" min="0.01" step="0.01" value={due} onChange={e=>setDue(e.target.value)} placeholder="500"/></div>
    <div className="field"><label>Next Due Date</label><input className="input" type="date" value={nextDueDate} onChange={e=>setNextDueDate(e.target.value)}/></div>
    <div className="field"><label>Frequency</label><select className="input" value={frequency} onChange={e=>setFrequency(e.target.value)}><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select></div>
   </div>
   <div className="notice" style={{marginTop:15}}>
     <b>Interest preview:</b> {interestRate || 0}% of ₱{principal.toLocaleString()} = <b>₱{interest.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</b> interest. Total payable: <b>₱{total.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</b>.
   </div>
   {error&&<div className="error" style={{marginTop:12}}>{error}</div>}
   <button className="btn primary" style={{marginTop:15}} disabled={busy} onClick={save}>{busy?"Saving...":"Create Loan"}</button>
  </div>}
 </div>
}
