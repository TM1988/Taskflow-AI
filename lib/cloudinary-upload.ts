// Alternative upload service using Cloudinary (free tier available)
export async function uploadToCloudinary(file: File, userId: string): Promise<string | null> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'taskflow_uploads'); // You'll need to create this
    formData.append('folder', `profile_pictures/${userId}`);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (response.ok) {
      const data = await response.json();
      return data.secure_url;
    }
    
    return null;
  } catch (error) {
    console.error('Cloudinary upload failed:', error);
    return null;
  }
}
