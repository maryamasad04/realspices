export async function getProducts() {
  try {
    console.log('Calling /api/products...');
    const response = await fetch('/api/products', {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    
    const data = await response.json();
    console.log('Response data:', data);
    
    if (!response.ok) {
      console.error('Response not OK:', data);
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }
    
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error in getProducts:', error);
    throw error;
  }
}

export async function createProduct(productData: any) {
  try {
    const response = await fetch('/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(productData),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error in createProduct:', error);
    throw error;
  }
}

export async function updateProductStatus(productId: string, status: string) {
  try {
    const response = await fetch(`/api/products/${productId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error in updateProductStatus:', error);
    throw error;
  }
}

export async function updateProductStock(productId: string, stock: number) {
  try {
    const response = await fetch(`/api/products/${productId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ stock }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error in updateProductStock:', error);
    throw error;
  }
}