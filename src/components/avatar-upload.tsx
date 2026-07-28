import { useState } from 'react';
import { supabase } from '@/lib/supabase'; // Adjust this import to match your supabase client path
import { Camera, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface AvatarUploadProps {
  uid: string;
  url: string | null;
  onUpload: (url: string) => void;
}

export function AvatarUpload({ uid, url, onUpload }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false);

  async function uploadAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      // Create a unique file name based on the user's ID and current timestamp
      const filePath = `${uid}-${Math.random()}.${fileExt}`;

      // 1. Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      // 2. Get the Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // 3. Pass the URL back up to your profile form to save to the database
      onUpload(publicUrl);
      toast.success('Avatar updated successfully.');

    } catch (error: any) {
      toast.error(error.message || 'Error uploading avatar');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="relative group inline-block">
      <div className="h-24 w-24 rounded-full overflow-hidden border-2 border-white/10 bg-slate-900 flex items-center justify-center">
        {url ? (
          <img 
            src={url} 
            alt="Avatar" 
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-3xl text-slate-500 uppercase">
             {/* Fallback initials could go here */}
             ?
          </span>
        )}
      </div>

      {/* Hover Overlay */}
      <label 
        className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-sm"
        htmlFor="single"
      >
        {uploading ? (
          <Loader2 className="h-6 w-6 text-white animate-spin" />
        ) : (
          <Camera className="h-6 w-6 text-white" />
        )}
      </label>
      
      <input
        style={{
          visibility: 'hidden',
          position: 'absolute',
        }}
        type="file"
        id="single"
        accept="image/*"
        onChange={uploadAvatar}
        disabled={uploading}
      />
    </div>
  );
}
  
