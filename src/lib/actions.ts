'use server';

// AI description generation has been disabled/removed from the app.
// Keep a no-op server action to avoid import errors in older code paths.
export async function generateDescriptionAction(
  keywords: string
): Promise<{ description?: string; error?: string }> {
  if (!keywords) {
    return { error: 'Keywords are required.' };
  }
  return { error: 'AI description generation is disabled in this build.' };
}
