interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

/**
 * Initialize the contacts table
 * This should be called once during application setup
 */
export async function initializeContactsTable() {
  try {
    // Table initialization is handled by backend
    return true;
  } catch (error) {
    console.error('Error initializing contacts table:', error);
    return false;
  }
}

/**
 * Submit a contact form entry
 * @param {Object} contactData - The contact form data
 * @returns {Promise} Result of the submission
 */
export async function submitContactForm(contactData: ContactFormData) {
  const { name, email, phone, subject, message } = contactData;

  // Validate required fields
  if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
    throw new Error('Missing required fields. Name, email, subject, and message are required.');
  }

  // Validate email format
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
      throw new Error(data.error || 'Database error occurred.');
    }

    return {
      success: true,
      data: data.data || data,
      message: 'Contact form submitted successfully'
    };

  } catch (error) {
    console.error('Error in submitContactForm:', error);
    throw error;
  }
}

/**
 * Get all contact form submissions (for admin use)
 * @param {string} status - Optional status filter
 * @returns {Promise} List of contact submissions
 */
export async function getContactSubmissions(status = null) {
  try {
    const params = status ? `?status=${status}` : '';
    const response = await fetch(`/api/contact${params}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch submissions');
    }

    return data.data || [];
  } catch (error) {
    console.error('Error in getContactSubmissions:', error);
    throw error;
  }
}

/**
 * Update contact submission status (for admin use)
 * @param {string} id - Contact submission ID
 * @param {string} status - New status
 * @returns {Promise} Update result
 */
export async function updateContactStatus(id: string, status: string) {
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
      throw new Error(data.error || 'Failed to update status');
    }

    return data.data || data;
  } catch (error) {
    console.error('Error in updateContactStatus:', error);
    throw error;
  }
}