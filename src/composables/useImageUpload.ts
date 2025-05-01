import { ref } from 'vue';
import { supabase } from '../../utils/supabase';

export function useImageUpload() {
  const isUploading = ref(false);
  const uploadError = ref<string | null>(null);
  const uploadProgress = ref(0);

  /**
   * Upload an image to Supabase storage
   * @param file The file to upload
   * @param bucket The bucket name (default: 'kanban-images')
   * @param path Optional path within the bucket
   * @returns URL of the uploaded image
   */
  const uploadImage = async (
    file: File, 
    bucket: string = 'kanban-images', 
    path: string = ''
  ): Promise<string> => {
    if (!file) {
      throw new Error('No file selected');
    }
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }
    
    // Limit file size to 2MB
    const MAX_FILE_SIZE = 2 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('File size exceeds 2MB limit');
    }
    
    // Verify bucket exists before attempting upload
    const bucketExists = await checkBucketExists(bucket);
    if (!bucketExists) {
      throw new Error(`Storage bucket '${bucket}' does not exist or you don't have access. Please contact the administrator.`);
    }
    
    isUploading.value = true;
    uploadError.value = null;
    uploadProgress.value = 0;
    
    try {
      // Generate a unique file name
      const fileName = `${new Date().getTime()}-${file.name}`;
      const filePath = path ? `${path}/${fileName}` : fileName;
      
      // Upload file to Supabase
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) {
        throw error;
      }
      
      // Get the public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);
      
      return urlData.publicUrl;
    } catch (error: any) {
      uploadError.value = error.message || 'Failed to upload image';
      throw error;
    } finally {
      isUploading.value = false;
      uploadProgress.value = 100;
    }
  };
  
  /**
   * Delete an image from Supabase storage
   * @param path The path of the image (including bucket name)
   * @returns Whether the deletion was successful
   */
  const deleteImage = async (path: string): Promise<boolean> => {
    try {
      // Split the path into bucket and file name
      const [bucket, fileName] = path.split('/');
      
      // Delete the file from Supabase
      const { error } = await supabase.storage
        .from(bucket)
        .remove([fileName]);
      
      // If there was an error, throw it
      if (error) {
        throw error;
      }
      
      // Return true if the deletion was successful
      return true;
    } catch (error: any) {
      console.error('Error deleting image:', error);
      return false;
    }
  };

  /**
   * Check if a storage bucket exists (does not attempt to create it)
   * Note: Buckets should be created through the Supabase dashboard
   * as regular users don't have permissions to create buckets
   */
  const checkBucketExists = async (bucketName: string = 'kanban-images'): Promise<boolean> => {
    try {
      // Attempt to get bucket info - will return error if not found
      const { data, error } = await supabase.storage.from(bucketName).list('', {
        limit: 1,
      });
      
      // If we can list files, the bucket exists and we have access
      return !error;
    } catch (error: any) {
      console.error('Error checking bucket:', error);
      return false;
    }
  };

  return {
    isUploading,
    uploadError,
    uploadProgress,
    uploadImage,
    deleteImage,
    checkBucketExists
  };
}
