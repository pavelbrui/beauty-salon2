-- Add Dominika and Anastazja to stylists table
DO $$
DECLARE
    dominika_id uuid;
    anastazja_id uuid;
BEGIN
    -- 1. Insert Dominika
    INSERT INTO public.stylists (name, role, image_url, specialties, description)
    VALUES (
        'Dominika', 
        'Beauty Specialist', 
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80', 
        ARRAY['Beauty Treatments'], 
        'Specjalistka w zabiegach kosmetycznych.'
    )
    RETURNING id INTO dominika_id;

    -- 2. Insert Anastazja
    INSERT INTO public.stylists (name, role, image_url, specialties, description)
    VALUES (
        'Anastazja', 
        'Beauty Specialist', 
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80', 
        ARRAY['Beauty Treatments'], 
        'Specjalistka w zabiegach kosmetycznych.'
    )
    RETURNING id INTO anastazja_id;

    -- 3. Create Booksy mappings
    INSERT INTO public.booksy_stylist_mapping (booksy_name, stylist_id, booksy_resource_id)
    VALUES 
    ('Dominika', dominika_id, 819977),
    ('Anastazja', anastazja_id, 821704);

    -- 4. Assign them to some common services (optional but helpful)
    -- This assumes service names match what's in the DB
    -- You might want to manually assign them in the admin panel for specific services
END $$;
