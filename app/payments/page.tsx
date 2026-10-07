import AppShell from "@/components/AppShell";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import PaymentForm from "@/components/PaymentForm";

export default async function PaymentsPage(){
 const {data:payments}=await (await createServerSupabaseClient()).from("payments").select("*,borrowers(full_name,borrower_code),loans(loan_code)").order("created_at",{ascending:false}).limit(100);
 const total=(payments??[]).reduce((a:any,p:any)=>a+Number(p.amount),0);
 return <AppShell><div className="heading"><div><h1>Payments</h1><div className="sub">Record collections and automatically update loan balances.</div></div></div><div className="grid2"><PaymentForm/><div className="card"><h3>Recorded Collections</h3><div style={{fontSize:30,fontWeight:800,margin:"15px 0"}}>₱{total.toLocaleString()}</div><div className="muted">Loaded from payment records</div></div></div><div className="card" style={{marginTop:17}}><h3>Payment History</h3><table><thead><tr><th>Date</th><th>Borrower</th><th>Loan</th><th>Method</th><th>Amount</th><th>Interest</th><th>Principal</th><th>Rate</th><th>Balance After</th></tr></thead><tbody>{(payments??[]).map((p:any)=><tr key={p.id}><td>{p.payment_date}</td><td>{p.borrowers?.full_name}</td><td>{p.loans?.loan_code}</td><td>{p.method}</td><td><b>₱{Number(p.amount).toLocaleString(undefined,{minimumFractionDigits:2})}</b></td><td>₱{Number(p.interest_amount||0).toLocaleString(undefined,{minimumFractionDigits:2})}</td><td>₱{Number(p.principal_amount||0).toLocaleString(undefined,{minimumFractionDigits:2})}</td><td>{Number(p.interest_rate_snapshot||0).toFixed(2)}%</td><td>₱{Number(p.balance_after||0).toLocaleString(undefined,{minimumFractionDigits:2})}</td></tr>)}</tbody></table></div></AppShell>
}
