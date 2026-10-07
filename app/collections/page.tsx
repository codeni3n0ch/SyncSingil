import AppShell from "@/components/AppShell";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export default async function Collections(){
 const today=new Date().toISOString().slice(0,10);
 const {data:loans}=await (await createServerSupabaseClient()).from("loans").select("*,borrowers(full_name,borrower_code,area)").in("status",["active","overdue"]).order("next_due_date");
 const due=(loans??[]).filter((l:any)=>!l.next_due_date||l.next_due_date<=today);
 return <AppShell><div className="heading"><div><h1>Collection Schedule</h1><div className="sub">Live list of loans requiring collection attention.</div></div></div><div className="kpis"><K label="Due Accounts" value={due.length}/><K label="Due Amount" value={`₱${due.reduce((a:any,x:any)=>a+Number(x.due_amount),0).toLocaleString()}`}/><K label="Overdue" value={(loans??[]).filter((x:any)=>x.status==="overdue").length}/><K label="Active Portfolio" value={(loans??[]).length}/></div><div className="panel" style={{marginTop:17}}><table><thead><tr><th>Priority</th><th>Borrower</th><th>Area</th><th>Due Amount</th><th>Schedule</th><th>Due Date</th><th>Status</th></tr></thead><tbody>{due.map((l:any,i:number)=><tr key={l.id}><td><b>#{i+1}</b></td><td><b>{l.borrowers?.full_name}</b><br/><span className="muted">{l.loan_code}</span></td><td>{l.borrowers?.area??"—"}</td><td>₱{Number(l.due_amount).toLocaleString()}</td><td>{l.frequency}</td><td>{l.next_due_date??"Not set"}</td><td><span className={`badge ${l.status==="overdue"?"red":"orange"}`}>{l.status}</span></td></tr>)}{!due.length&&<tr><td colSpan={7} className="empty">No loans currently due.</td></tr>}</tbody></table></div></AppShell>
}
function K({label,value}:{label:string,value:any}){return <div className="kpi"><div className="kpi-top"><span>{label}</span><span className="kpi-icon">₱</span></div><strong>{value}</strong></div>}
