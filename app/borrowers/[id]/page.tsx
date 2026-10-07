import AppShell from "@/components/AppShell";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import Link from "next/link";

export default async function BorrowerDetail({params}:{params:Promise<{id:string}>}) {
 const {id}=await params; const supabase=await createServerSupabaseClient();
 const {data:b}=await supabase.from("borrowers").select("*").eq("id",id).single();
 if(!b) return <AppShell><div className="empty">Borrower not found.</div></AppShell>;
 const {data:loans}=await supabase.from("loans").select("*").eq("borrower_id",id).order("created_at",{ascending:false});
 const {data:payments}=await supabase.from("payments").select("*").eq("borrower_id",id).order("payment_date",{ascending:false});
 const balance=(loans??[]).reduce((a:any,x:any)=>a+Number(x.balance),0);
 const interest=(loans??[]).reduce((a:any,x:any)=>a+Number(x.interest_balance||0),0);
 return <AppShell><div className="heading"><div><h1>{b.full_name}</h1><div className="sub">{b.borrower_code} • {b.status}</div></div><Link className="btn primary" href="/payments">Record Payment</Link></div>
 <div className="grid2"><div className="card"><h3>Borrower Information</h3><div className="form-grid" style={{marginTop:15}}><Info label="Full Name" value={b.full_name}/><Info label="Contact" value={b.contact_number??"—"}/><Info label="Address" value={b.address??"—"}/><Info label="Area" value={b.area??"—"}/></div></div><div className="card"><h3>Account Summary</h3><div style={{fontSize:32,fontWeight:800,margin:"15px 0 5px"}}>₱{balance.toLocaleString(undefined,{minimumFractionDigits:2})}</div><div className="muted">Total outstanding balance</div><div className="notice" style={{marginTop:15}}>Outstanding interest: <b>₱{interest.toLocaleString(undefined,{minimumFractionDigits:2})}</b></div></div></div>
 <div className="card" style={{marginTop:17}}><div className="card-head"><h3>Loans</h3><Link className="btn" href="/loans">Manage Loans</Link></div><table><thead><tr><th>Loan Code</th><th>Product</th><th>Original</th><th>Interest</th><th>Interest Due</th><th>Balance</th><th>Frequency</th><th>Status</th></tr></thead><tbody>{(loans??[]).map((l:any)=><tr key={l.id}><td>{l.loan_code}</td><td>{l.product}</td><td>₱{Number(l.original_amount).toLocaleString()}</td><td>{Number(l.interest_rate||0).toFixed(2)}%</td><td>₱{Number(l.interest_balance||0).toLocaleString(undefined,{minimumFractionDigits:2})}</td><td><b>₱{Number(l.balance).toLocaleString(undefined,{minimumFractionDigits:2})}</b></td><td>{l.frequency}</td><td><span className={`badge ${l.status==="overdue"?"red":l.status==="paid"?"blue":"green"}`}>{l.status}</span></td></tr>)}</tbody></table></div>
 <div className="card" style={{marginTop:17}}><h3>Payment History</h3><table><thead><tr><th>Date</th><th>Amount</th><th>Interest Portion</th><th>Principal Portion</th><th>Rate</th><th>Balance After</th><th>Method</th></tr></thead><tbody>{(payments??[]).map((p:any)=><tr key={p.id}><td>{p.payment_date}</td><td><b>₱{Number(p.amount).toLocaleString(undefined,{minimumFractionDigits:2})}</b></td><td>₱{Number(p.interest_amount||0).toLocaleString(undefined,{minimumFractionDigits:2})}</td><td>₱{Number(p.principal_amount||0).toLocaleString(undefined,{minimumFractionDigits:2})}</td><td>{Number(p.interest_rate_snapshot||0).toFixed(2)}%</td><td>₱{Number(p.balance_after||0).toLocaleString(undefined,{minimumFractionDigits:2})}</td><td>{p.method}</td></tr>)}</tbody></table></div>
 </AppShell>
}
function Info({label,value}:{label:string,value:string}){return <div><div className="muted">{label}</div><b>{value}</b></div>}
