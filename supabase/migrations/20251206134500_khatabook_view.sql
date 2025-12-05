-- Create a view to aggregate customer balances efficiently
CREATE OR REPLACE VIEW customer_balances_view AS
SELECT 
    c.id,
    c.shop_id,
    c.name,
    c.phone,
    c.email,
    c.address,
    /* 
       Calculate totals from ledger_transactions.
       entry_type: 'DEBIT' (they bought something, they owe us) -> Increases Balance (Positive)
       entry_type: 'CREDIT' (they paid us, or we owe them) -> Decreases Balance (Negative/Reduces Debt)
       
       Logic:
       Balance = Total Debits - Total Credits
    */
    COALESCE(SUM(CASE WHEN lt.entry_type = 'DEBIT' THEN lt.amount ELSE 0 END), 0) as total_debit,
    COALESCE(SUM(CASE WHEN lt.entry_type = 'CREDIT' THEN lt.amount ELSE 0 END), 0) as total_credit,
    (
        COALESCE(SUM(CASE WHEN lt.entry_type = 'DEBIT' THEN lt.amount ELSE 0 END), 0) - 
        COALESCE(SUM(CASE WHEN lt.entry_type = 'CREDIT' THEN lt.amount ELSE 0 END), 0)
    ) as current_balance,
    MAX(lt.created_at) as last_transaction_date
FROM customers c
LEFT JOIN ledger_transactions lt ON c.id = lt.customer_id
WHERE c.deleted_at IS NULL
GROUP BY c.id, c.shop_id, c.name, c.phone, c.email, c.address;
