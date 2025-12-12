-- FIX: Add missing trigger for main 'customers' table

create trigger on_new_customer
    after insert on customers
    for each row
    execute function handle_new_customer();
