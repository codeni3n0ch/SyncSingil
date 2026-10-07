import AppShell from "@/components/AppShell";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import LoanForm from "@/components/LoanForm";

export default async function LoansPage(){
 const {data:loans}=await (await createServerSupabaseClient()).from("loans").select("*,borrowers(full_name,borrower_code)").order("created_at",{ascending:false});
 return <AppShell><div className="heading"><div><h1>Loans</h1><div className="sub">Create and monitor real loan accounts.</div></div></div><LoanForm/>
 <div className="panel" style={{marginTop:17}}><table><thead><tr><th>Borrower</th><th>Loan Code</th><th>Product</th><th>Original</th><th>Interest</th><th>Balance</th><th>Frequency</th><th>Due</th><th>Status</th></tr></thead><tbody>{(loans??[]).map((l:any)=><tr key={l.id}><td><b>{l.borrowers?.full_name}</b><br/><span className="muted">{l.borrowers?.borrower_code}</span></td><td>{l.loan_code}</td><td>{l.product}</td><td>₱{Number(l.original_amount).toLocaleString()}</td><td>{Number(l.interest_rate||0).toFixed(2)}%</td><td><b>₱{Number(l.balance).toLocaleString(undefined,{minimumFractionDigits:2})}</b></td><td>{l.frequency}</td><td>₱{Number(l.due_amount).toLocaleString()}</td><td><span className={`badge ${l.status==="overdue"?"red":l.status==="paid"?"blue":"green"}`}>{l.status}</span></td></tr>)}</tbody></table></div></AppShell>
}
