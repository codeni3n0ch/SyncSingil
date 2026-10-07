"use client";
import { useEffect,useMemo,useState } from "react";
import { createClient } from "@/lib/supabase";

export default function PaymentForm(){
 const [loans,setLoans]=useState<any[]>([]);
 const [loan,setLoan]=useState("");
 const [amount,setAmount]=useState("");
 const [date,setDate]=useState(new Date().toISOString().slice(0,10));
 const [method,setMethod]=useState("Cash");
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");

 useEffect(()=>{
   createClient().from("loans").select("id,loan_code,balance,borrower_id,interest_rate,interest_balance,principal_balance,total_payable,borrowers(full_name)").in("status",["active","overdue"]).order("loan_code").then(({data,error})=>{
     if(error) setError(error.message);
     setLoans(data??[]);
   });
 },[]);

 const selected=loans.find(x=>x.id===loan);
 const paymentAmount=Number(amount)||0;
 const interestApplied=useMemo(()=>selected?Math.min(paymentAmount,Number(selected.interest_balance||0)):0,[selected,paymentAmount]);
 const principalApplied=Math.max(0,paymentAmount-interestApplied);
 const balanceAfter=selected?Math.max(0,Number(selected.balance)-paymentAmount):0;

 async function save(){
  setBusy(true);setError("");
  const n=Number(amount);
  if(!loan||!Number.isFinite(n)||n<=0){setError("Select a loan and enter a payment amount greater than ₱0.00.");setBusy(false);return;}
  if(selected&&n>Number(selected.balance)){setError(`Payment cannot be greater than the remaining balance of ₱${Number(selected.balance).toLocaleString(undefined,{minimumFractionDigits:2})}.`);setBusy(false);return;}
  const supabase=createClient();
  const {data:{user}}=await supabase.auth.getUser();
  const {error}=await supabase.from("payments").insert({loan_id:loan,borrower_id:selected.borrower_id,amount:n,payment_date:date,method,recorded_by:user?.id??null});
  if(error){setError(error.message);setBusy(false);return;}
  setBusy(false);window.location.reload();
 }

 return <div className="card">
  <div className="card-head"><h3>Record New Payment</h3><span className="badge blue">Interest-aware collection</span></div>
  <div style={{marginTop:15}}>
   <div className="field"><label>Loan / Borrower</label><select className="input" value={loan} onChange={e=>setLoan(e.target.value)}><option value="">Select loan</option>{loans.map(l=><option key={l.id} value={l.id}>{l.loan_code} — {l.borrowers?.full_name} — ₱{Number(l.balance).toLocaleString()} balance</option>)}</select></div>
   <div className="form-grid" style={{marginTop:13}}>
    <div className="field"><label>Payment Amount</label><input className="input" type="number" min="0.01" step="0.01" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="500.00"/></div>
    <div className="field"><label>Payment Date</label><input className="input" type="date" value={date} onChange={e=>setDate(e.target.value)}/></div>
    <div className="field"><label>Payment Method</label><select className="input" value={method} onChange={e=>setMethod(e.target.value)}><option>Cash</option><option>Bank Transfer</option><option>GCash</option><option>Other</option></select></div>
   </div>
   {selected&&<div className="notice" style={{marginTop:15}}>
     <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10}}>
       <div><div className="muted">Interest rate</div><b>{Number(selected.interest_rate||0).toFixed(2)}%</b></div>
       <div><div className="muted">Interest remaining</div><b>₱{Number(selected.interest_balance||0).toLocaleString(undefined,{minimumFractionDigits:2})}</b></div>
       <div><div className="muted">This payment to interest</div><b>₱{interestApplied.toLocaleString(undefined,{minimumFractionDigits:2})}</b></div>
       <div><div className="muted">This payment to principal</div><b>₱{principalApplied.toLocaleString(undefined,{minimumFractionDigits:2})}</b></div>
       <div><div className="muted">Balance after collection</div><b>₱{balanceAfter.toLocaleString(undefined,{minimumFractionDigits:2})}</b></div>
     </div>
     <div style={{marginTop:10}}>The collection uses the loan's saved interest rate and applies payment to outstanding interest first, then principal.</div>
   </div>}
   {error&&<div className="error" style={{marginTop:12}}>{error}</div>}
   <button className="btn primary" style={{marginTop:15}} disabled={busy} onClick={save}>{busy?"Saving...":"✓ Save Payment"}</button>
  </div>
 </div>
}
