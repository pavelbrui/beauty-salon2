// Sample luxury salon service images
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

export const serviceImages = {
  browCare: `${supabaseUrl}/storage/v1/object/public/service-images/gallery/0.9011688853440076.PNG?auto=format&fit=crop&w=1920&q=80`,
  permanentMakeup: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=800&q=80',
  lashes: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=800&q=80',
  tattooRemoval: 'https://images.unsplash.com/photo-1545033131-485ea67fd7c3?auto=format&fit=crop&w=800&q=80'
};

export const heroImage = `${supabaseUrl}/storage/v1/object/public/service-images/gallery/0.9011688853440076.PNG?auto=format&fit=crop&w=1920&q=80`;