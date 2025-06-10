-- Replace YYYYMMDDHHMMSS with the current timestamp, e.g., 20230610103000

BEGIN;

-- Add columns to tbltransaction for better currency tracking if they don't exist

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' -- Or your specific schema
                   AND table_name='tbltransaction' 
                   AND column_name='original_amount') THEN
        ALTER TABLE public.tbltransaction ADD COLUMN original_amount NUMERIC(15, 2);
        RAISE NOTICE 'Column original_amount added to tbltransaction.';
    ELSE
        RAISE NOTICE 'Column original_amount already exists in tbltransaction.';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' -- Or your specific schema
                   AND table_name='tbltransaction' 
                   AND column_name='original_currency') THEN
        ALTER TABLE public.tbltransaction ADD COLUMN original_currency VARCHAR(3);
        RAISE NOTICE 'Column original_currency added to tbltransaction.';
    ELSE
        RAISE NOTICE 'Column original_currency already exists in tbltransaction.';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' -- Or your specific schema
                   AND table_name='tbltransaction' 
                   AND column_name='transaction_currency') THEN
        ALTER TABLE public.tbltransaction ADD COLUMN transaction_currency VARCHAR(3);
        RAISE NOTICE 'Column transaction_currency added to tbltransaction.';
    ELSE
        RAISE NOTICE 'Column transaction_currency already exists in tbltransaction.';
    END IF;
END $$;

-- Also ensure category_id exists, as it was part of previous fixes
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' -- Or your specific schema
                   AND table_name='tbltransaction' 
                   AND column_name='category_id') THEN
        ALTER TABLE public.tbltransaction ADD COLUMN category_id UUID;
        RAISE NOTICE 'Column category_id added to tbltransaction.';
        -- Add a foreign key constraint if your tblcategory is in the same database
        -- ALTER TABLE public.tbltransaction 
        -- ADD CONSTRAINT fk_transaction_category 
        -- FOREIGN KEY (category_id) 
        -- REFERENCES public.tblcategory(id) ON DELETE SET NULL;
        -- RAISE NOTICE 'Foreign key fk_transaction_category added to tbltransaction.';
    ELSE
        RAISE NOTICE 'Column category_id already exists in tbltransaction.';
    END IF;
END $$;


COMMIT;
