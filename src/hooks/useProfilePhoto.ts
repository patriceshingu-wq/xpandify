import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';

const BUCKET_NAME = 'profile-photos';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export interface UploadProfilePhotoParams {
  personId: string;
  file: File;
}

export function useProfilePhoto() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { session } = useAuth();

  const uploadMutation = useMutation({
    mutationFn: async ({ personId, file }: UploadProfilePhotoParams) => {
      if (!session?.user?.id) {
        throw new Error('Not authenticated');
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        throw new Error(t('profilePhoto.fileTooLarge'));
      }

      // Validate file type
      if (!ALLOWED_TYPES.includes(file.type)) {
        throw new Error(t('profilePhoto.invalidFileType'));
      }

      // Generate unique filename with user folder structure
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${session.user.id}/${personId}.${fileExt}`;

      // Delete existing photo if any
      const { data: existingFiles } = await supabase.storage
        .from(BUCKET_NAME)
        .list(session.user.id, {
          search: personId,
        });

      if (existingFiles && existingFiles.length > 0) {
        const filesToDelete = existingFiles
          .filter((f) => f.name.startsWith(personId))
          .map((f) => `${session.user.id}/${f.name}`);

        if (filesToDelete.length > 0) {
          await supabase.storage.from(BUCKET_NAME).remove(filesToDelete);
        }
      }

      // Upload new photo
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(fileName);

      const photoUrl = urlData.publicUrl;

      // Update person record with new photo URL
      const { error: updateError } = await supabase
        .from('people')
        .update({ photo_url: photoUrl })
        .eq('id', personId);

      if (updateError) throw updateError;

      return photoUrl;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['person', variables.personId] });
      queryClient.invalidateQueries({ queryKey: ['people'] });
      toast({
        title: t('common.success'),
        description: t('profilePhoto.uploadSuccess'),
      });
    },
    onError: (error: Error) => {
      console.error('[useProfilePhoto] Upload error:', error);
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (personId: string) => {
      if (!session?.user?.id) {
        throw new Error('Not authenticated');
      }

      // Find and delete existing photo
      const { data: existingFiles } = await supabase.storage
        .from(BUCKET_NAME)
        .list(session.user.id, {
          search: personId,
        });

      if (existingFiles && existingFiles.length > 0) {
        const filesToDelete = existingFiles
          .filter((f) => f.name.startsWith(personId))
          .map((f) => `${session.user.id}/${f.name}`);

        if (filesToDelete.length > 0) {
          const { error: deleteError } = await supabase.storage
            .from(BUCKET_NAME)
            .remove(filesToDelete);

          if (deleteError) throw deleteError;
        }
      }

      // Clear photo URL from person record
      const { error: updateError } = await supabase
        .from('people')
        .update({ photo_url: null })
        .eq('id', personId);

      if (updateError) throw updateError;
    },
    onSuccess: (_, personId) => {
      queryClient.invalidateQueries({ queryKey: ['person', personId] });
      queryClient.invalidateQueries({ queryKey: ['people'] });
      toast({
        title: t('common.success'),
        description: t('profilePhoto.deleteSuccess'),
      });
    },
    onError: (error: Error) => {
      console.error('[useProfilePhoto] Delete error:', error);
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    uploadPhoto: uploadMutation.mutate,
    deletePhoto: deleteMutation.mutate,
    isUploading: uploadMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
