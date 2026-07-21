-- 0005_fix_asm_name — ASM's full form is "Active Sales Manager", not
-- "Area Sales Manager" as originally seeded in 0002.
UPDATE roles SET name = 'Active Sales Manager' WHERE code = 'asm';
