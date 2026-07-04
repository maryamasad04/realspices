export interface UserData {
  id: string;
  name?: string;
  email: string;
  phone?: string;
}

export async function getUserInfo(): Promise<{ success: boolean; user?: UserData; error?: string }> {
  try {
    const authToken = localStorage.getItem('authToken');
    
    if (!authToken) {
      return { success: false, error: 'No authentication token found' };
    }

    const response = await fetch('/api/user', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    });

    // Check if response is actually JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('Server returned non-JSON response:', await response.text());
      return { success: false, error: 'Server error - please restart the development server' };
    }

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.error || 'Failed to fetch user info' };
    }

    return { success: true, user: result.user };
  } catch (error: any) {
    console.error('Error fetching user info:', error);
    return { success: false, error: error.message || 'Unknown error occurred' };
  }
}

export async function updateUserInfo(data: { name?: string; phone?: string }): Promise<{ success: boolean; user?: UserData; error?: string }> {
  try {
    const authToken = localStorage.getItem('authToken');
    
    if (!authToken) {
      return { success: false, error: 'No authentication token found' };
    }

    const response = await fetch('/api/user', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.error || 'Failed to update user info' };
    }

    return { success: true, user: result.user };
  } catch (error: any) {
    console.error('Error updating user info:', error);
    return { success: false, error: error.message || 'Unknown error occurred' };
  }
}
