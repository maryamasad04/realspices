export interface JourneyMilestone {
  id: number;
  year: string;
  title: string;
  description: string;
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface TeamMember {
  id: number;
  name: string;
  designation: string;
  description: string;
  image?: string | null;
  display_order: number;
  status: 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
}

async function parseResponse<T>(response: Response): Promise<T> {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }
  return data;
}

// Journey milestones
export async function getJourneyMilestones(activeOnly = false) {
  const url = activeOnly ? '/api/about/journey?active=true' : '/api/about/journey';
  const response = await fetch(url);
  const data = await parseResponse<{ success: boolean; data: JourneyMilestone[] }>(response);
  return data.data || [];
}

export async function createJourneyMilestone(milestone: Omit<JourneyMilestone, 'id' | 'created_at' | 'updated_at'>) {
  const response = await fetch('/api/about/journey', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(milestone),
  });
  const data = await parseResponse<{ success: boolean; data: JourneyMilestone }>(response);
  return data.data;
}

export async function updateJourneyMilestone(id: number, updates: Partial<JourneyMilestone>) {
  const response = await fetch(`/api/about/journey/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  const data = await parseResponse<{ success: boolean; data: JourneyMilestone }>(response);
  return data.data;
}

export async function deleteJourneyMilestone(id: number) {
  const response = await fetch(`/api/about/journey/${id}`, { method: 'DELETE' });
  return parseResponse<{ success: boolean }>(response);
}

export async function reorderJourneyMilestones(items: { id: number; display_order: number }[]) {
  const response = await fetch('/api/about/journey/reorder', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items }),
  });
  return parseResponse<{ success: boolean; data: JourneyMilestone[] }>(response);
}

// Team members
export async function getTeamMembers(activeOnly = false) {
  const url = activeOnly ? '/api/about/team?active=true' : '/api/about/team';
  const response = await fetch(url);
  const data = await parseResponse<{ success: boolean; data: TeamMember[] }>(response);
  return data.data || [];
}

export async function createTeamMember(member: Omit<TeamMember, 'id' | 'created_at' | 'updated_at'>) {
  const response = await fetch('/api/about/team', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(member),
  });
  const data = await parseResponse<{ success: boolean; data: TeamMember }>(response);
  return data.data;
}

export async function updateTeamMember(id: number, updates: Partial<TeamMember>) {
  const response = await fetch(`/api/about/team/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  const data = await parseResponse<{ success: boolean; data: TeamMember }>(response);
  return data.data;
}

export async function deleteTeamMember(id: number) {
  const response = await fetch(`/api/about/team/${id}`, { method: 'DELETE' });
  return parseResponse<{ success: boolean }>(response);
}
