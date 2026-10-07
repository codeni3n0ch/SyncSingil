export type Role = "admin" | "collector" | "staff";

export type Borrower = {
  id: string;
  borrower_code: string;
  full_name: string;
  contact_number: string | null;
  address: string | null;
  area: string | null;
  status: "active" | "inactive";
  created_at: string;
};

export type LoanProduct = "Gadgets" | "Cash" | "Livestock" | "Other";

export type Loan = {
  id: string;
  borrower_id: string;
  loan_code: string;
  product: LoanProduct;
  original_amount: number;
  interest_rate: number;
  interest_amount: number;
  total_payable: number;
  principal_balance: number;
  interest_balance: number;
  balance: number;
  frequency: "daily" | "weekly" | "monthly";
  status: "active" | "paid" | "overdue" | "cancelled";
  due_amount: number;
  next_due_date: string | null;
  created_at: string;
};

export type Payment = {
  id: string;
  loan_id: string;
  borrower_id: string;
  amount: number;
  principal_amount: number;
  interest_amount: number;
  interest_rate_snapshot: number;
  balance_after: number;
  payment_date: string;
  method: string;
  recorded_by: string | null;
  created_at: string;
};
