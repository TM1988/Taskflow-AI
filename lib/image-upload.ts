// Simple image upload using base64 encoding for now
// This will store images in Firestore as base64 strings

export async function uploadProfilePicture(file: File, userId: string): Promise<string | null> {
  try {
    console.log('=== BASE64 UPLOAD ===');
    console.log('File:', { name: file.name, size: file.size, type: file.type });
    console.log('User ID:', userId);

    // Convert file to base64
    const base64 = await fileToBase64(file);
    
    // Save to Firestore
    const response = await fetch('/api/profile/upload-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        imageData: base64,
        contentType: file.type
      })
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const { imageUrl } = await response.json();
    console.log('Upload successful! Image URL:', imageUrl);
    return imageUrl;
    
  } catch (error) {
    console.error('Error in uploadProfilePicture:', error);
    return null;
  }
}

export async function deleteProfilePicture(userId: string): Promise<boolean> {
  try {
    const response = await fetch('/api/profile/delete-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });

    return response.ok;
  } catch (error) {
    console.error('Error in deleteProfilePicture:', error);
    return false;
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}
