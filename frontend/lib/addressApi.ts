// Address management functions for API integration

// Address interface
export interface AddressData {
  street: string;
  city: string;
  state: string;
  pincode: string;
}

export interface Address extends AddressData {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

// Save address to database
export async function saveAddress(addressData: AddressData, userId?: string): Promise<{ success: boolean; address?: Address; error?: string }> {
  try {
    const authToken = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }

    const response = await fetch('/api/address', {
      method: 'POST',
      headers,
      body: JSON.stringify(addressData)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to save address');
    }

    return { success: true, address: result.address };

  } catch (error: any) {
    console.error('Save address error:', error);
    return { success: false, error: error.message };
  }
}

// Get user's addresses
export async function getUserAddresses(): Promise<{ success: boolean; addresses?: Address[]; error?: string }> {
  try {
    const authToken = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    
    const response = await fetch('/api/address', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { 'Authorization': `Bearer ${authToken}` })
      }
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch addresses');
    }

    return { success: true, addresses: result.addresses };

  } catch (error: any) {
    console.error('Get addresses error:', error);
    return { success: false, error: error.message };
  }
}