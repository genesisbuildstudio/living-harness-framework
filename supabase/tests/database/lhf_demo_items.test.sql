begin;

select plan(4);

select has_table('public', 'lhf_audit_events', 'audit event table exists');
select has_table('public', 'lhf_demo_items', 'demo items table exists');

select policies_are(
  'public',
  'lhf_audit_events',
  ARRAY['lhf_audit_events_read_own', 'lhf_audit_events_insert_own']
);

select policies_are(
  'public',
  'lhf_demo_items',
  ARRAY['lhf_demo_items_read_own', 'lhf_demo_items_write_own']
);

select * from finish();

rollback;
