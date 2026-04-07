-- =============================================
-- Protokoll-Pro: Supabase Database Schema
-- =============================================

-- Helper: Check if current user is admin
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.users where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer;

-- =============================================
-- TABLES
-- =============================================

-- Users (extends auth.users)
create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  name text,
  company text,
  role text default 'user' check (role in ('user', 'admin')),
  created_at timestamptz default now()
);

-- Properties
create table public.properties (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references public.users(id) on delete cascade not null,
  address text,
  street text,
  house_number text,
  zip_code text,
  city text,
  created_at timestamptz default now()
);

-- Protocols
create table public.protocols (
  id uuid default gen_random_uuid() primary key,
  property_id uuid references public.properties(id) on delete set null,
  owner_id uuid references public.users(id) on delete cascade not null,
  tenant_salutation text,
  tenant_first_name text,
  tenant_last_name text,
  tenant_email text,
  tenant_phone text,
  date timestamptz,
  type text check (type in ('Einzug', 'Auszug')),
  status text default 'draft' check (status in ('draft', 'final')),
  linked_protocol_id uuid references public.protocols(id) on delete set null,
  rooms jsonb default '[]'::jsonb,
  meters jsonb default '[]'::jsonb,
  keys jsonb default '[]'::jsonb,
  general_condition text,
  tenant_new_address text,
  witnesses text,
  landlord_signature text,
  tenant_signature text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Feedback
create table public.feedback (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  type text check (type in ('bug', 'feature', 'error')),
  message text,
  error_details text,
  url text,
  image_url text,
  status text default 'new' check (status in ('new', 'resolved')),
  created_at timestamptz default now()
);

-- =============================================
-- INDEXES
-- =============================================

create index idx_properties_owner on public.properties(owner_id);
create index idx_protocols_owner on public.protocols(owner_id);
create index idx_protocols_property on public.protocols(property_id);
create index idx_protocols_created on public.protocols(owner_id, created_at desc);
create index idx_feedback_user on public.feedback(user_id);
create index idx_feedback_status on public.feedback(status);

-- =============================================
-- AUTO-UPDATE updated_at
-- =============================================

create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger protocols_updated_at
  before update on public.protocols
  for each row execute function public.update_updated_at();

-- =============================================
-- AUTO-CREATE USER PROFILE ON SIGNUP
-- =============================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', 'Unnamed User'),
    case when new.email = 'info@weserbergland-dienstleistungen.de' then 'admin' else 'user' end
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

alter table public.users enable row level security;
alter table public.properties enable row level security;
alter table public.protocols enable row level security;
alter table public.feedback enable row level security;

-- Users: read/update own profile
create policy "Users can view own profile" on public.users
  for select using (auth.uid() = id);
create policy "Users can update own profile" on public.users
  for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.users
  for insert with check (auth.uid() = id);

-- Properties: owner CRUD
create policy "Owner can view properties" on public.properties
  for select using (auth.uid() = owner_id);
create policy "Owner can create properties" on public.properties
  for insert with check (auth.uid() = owner_id);
create policy "Owner can update properties" on public.properties
  for update using (auth.uid() = owner_id);
create policy "Owner can delete properties" on public.properties
  for delete using (auth.uid() = owner_id);

-- Protocols: owner CRUD
create policy "Owner can view protocols" on public.protocols
  for select using (auth.uid() = owner_id);
create policy "Owner can create protocols" on public.protocols
  for insert with check (auth.uid() = owner_id);
create policy "Owner can update protocols" on public.protocols
  for update using (auth.uid() = owner_id);
create policy "Owner can delete protocols" on public.protocols
  for delete using (auth.uid() = owner_id);

-- Feedback: users create own, view own; admins view/update all
create policy "Users can create own feedback" on public.feedback
  for insert with check (auth.uid() = user_id);
create policy "Users can view own feedback" on public.feedback
  for select using (auth.uid() = user_id or public.is_admin());
create policy "Admins can update feedback" on public.feedback
  for update using (public.is_admin());

-- =============================================
-- STORAGE BUCKET for feedback images
-- =============================================

insert into storage.buckets (id, name, public)
values ('feedback', 'feedback', true)
on conflict (id) do nothing;

create policy "Users can upload feedback images"
  on storage.objects for insert
  with check (bucket_id = 'feedback' and auth.role() = 'authenticated');

create policy "Anyone can view feedback images"
  on storage.objects for select
  using (bucket_id = 'feedback');
