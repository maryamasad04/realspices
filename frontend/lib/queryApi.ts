interface QueryFormData {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

export async function initializeQueryTable() {
  try {
    // Just return true - table initialization is handled by backend
    return true;
  } catch (error) {
    console.error('Error initializing query table:', error);
    return false;
  }
}

export async function submitQueryForm(queryData: QueryFormData) {
  const { name, email, phone, subject, message } = queryData;

  if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
    throw new Error('Missing required fields. Name, email, subject, and message are required.');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    throw new Error('Invalid email format.');
  }

  try {
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        subject: subject.trim(),
        message: message.trim(),
        status: 'new'
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to submit query');
    }

    return {
      success: true,
      data: data.data || data,
      message: 'Query form submitted successfully'
    };

  } catch (error) {
    console.error('Error in submitQueryForm:', error);
    throw error;
  }
}

export async function getQuerySubmissions(status = null) {
  try {
    const params = status ? `?status=${status}` : '';
    const response = await fetch(`/api/contact${params}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch queries');
    }

    return {
      success: true,
      data: data.data || [],
      message: 'Queries fetched successfully'
    };
  } catch (error) {
    console.error('Error in getQuerySubmissions:', error);
    throw error;
  }
}

export async function updateQueryStatus(id: string, status: string) {
  const validStatuses = ['new', 'in_progress', 'resolved', 'closed'];
  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
  }

  try {
    const response = await fetch(`/api/contact/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, updated_at: new Date().toISOString() })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to update query status');
    }

    return data.data || data;
  } catch (error) {
    console.error('Error in updateQueryStatus:', error);
    throw error;
  }
}
