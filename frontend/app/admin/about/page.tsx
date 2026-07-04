'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTheme } from '@/hooks/use-theme';
import {
  JourneyMilestone,
  TeamMember,
  getJourneyMilestones,
  createJourneyMilestone,
  updateJourneyMilestone,
  deleteJourneyMilestone,
  reorderJourneyMilestones,
  getTeamMembers,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
} from '@/lib/aboutApi';
import {
  Home,
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  Upload,
  Loader,
  Clock,
  Users,
  X,
} from 'lucide-react';

const emptyMilestone = { year: '', title: '', description: '', display_order: '' };
type MemberForm = {
  name: string;
  designation: string;
  description: string;
  image: string;
  display_order: string;
  status: 'active' | 'inactive';
};

const emptyMember: MemberForm = {
  name: '',
  designation: '',
  description: '',
  image: '',
  display_order: '',
  status: 'active',
};

function useAboutAdminTheme(darkMode: boolean) {
  return {
    page: darkMode ? 'bg-gray-900' : 'bg-gray-50',
    header: darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
    heading: darkMode ? 'text-white' : 'text-gray-900',
    subtext: darkMode ? 'text-gray-300' : 'text-gray-600',
    muted: darkMode ? 'text-gray-400' : 'text-gray-500',
    link: darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-gray-700',
    card: darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
    cardTitle: darkMode ? 'text-white' : 'text-gray-900',
    listItem: darkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200',
    dialog: darkMode
      ? 'bg-gray-800 border-gray-600 text-white [&>button]:text-gray-300 [&>button]:hover:text-white'
      : 'bg-white border-gray-200 text-gray-900 [&>button]:text-gray-500 [&>button]:hover:text-gray-900',
    dialogTitle: darkMode ? 'text-white' : 'text-gray-900',
    label: darkMode ? 'text-gray-200' : 'text-gray-700',
    input: darkMode
      ? 'bg-gray-900 border-gray-600 text-white placeholder:text-gray-400 focus-visible:ring-amber-500'
      : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus-visible:ring-red-500',
    textarea: darkMode
      ? 'bg-gray-900 border-gray-600 text-white placeholder:text-gray-400 focus-visible:ring-amber-500'
      : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus-visible:ring-red-500',
    selectTrigger: darkMode
      ? 'bg-gray-900 border-gray-600 text-white'
      : 'bg-white border-gray-300 text-gray-900',
    selectContent: darkMode
      ? 'bg-gray-800 border-gray-600 text-white'
      : 'bg-white border-gray-200 text-gray-900',
    outlineBtn: darkMode
      ? 'border-gray-600 bg-gray-700 text-gray-100 hover:bg-gray-600 hover:text-white'
      : 'border-gray-300 bg-white text-gray-900 hover:bg-gray-50',
    tabsList: darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-gray-100 border border-gray-200',
    tabsTrigger: darkMode
      ? 'text-gray-400 data-[state=active]:bg-gray-700 data-[state=active]:text-white'
      : 'text-gray-600 data-[state=active]:bg-white data-[state=active]:text-gray-900',
    badge: darkMode ? 'border-gray-500 text-gray-200 bg-gray-700' : '',
    avatarPlaceholder: darkMode ? 'bg-gray-600' : 'bg-gray-200',
  };
}

export default function AboutUsAdminPage() {
  const { dark: darkMode } = useTheme();
  const router = useRouter();
  const theme = useAboutAdminTheme(darkMode);

  const [activeTab, setActiveTab] = useState('journey');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [milestones, setMilestones] = useState<JourneyMilestone[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  const [milestoneDialogOpen, setMilestoneDialogOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<JourneyMilestone | null>(null);
  const [milestoneForm, setMilestoneForm] = useState(emptyMilestone);
  const [savingMilestone, setSavingMilestone] = useState(false);

  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [memberForm, setMemberForm] = useState<MemberForm>(emptyMember);
  const [savingMember, setSavingMember] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('isAdmin')) {
      router.push('/login');
      return;
    }
    fetchData();
  }, [router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [journeyData, teamData] = await Promise.all([
        getJourneyMilestones(),
        getTeamMembers(),
      ]);
      setMilestones(journeyData);
      setTeamMembers(teamData);
    } catch (err: any) {
      setError(err.message || 'Failed to load About Us content');
    } finally {
      setLoading(false);
    }
  };

  const openMilestoneDialog = (milestone?: JourneyMilestone) => {
    if (milestone) {
      setEditingMilestone(milestone);
      setMilestoneForm({
        year: milestone.year,
        title: milestone.title,
        description: milestone.description,
        display_order: String(milestone.display_order),
      });
    } else {
      setEditingMilestone(null);
      setMilestoneForm(emptyMilestone);
    }
    setMilestoneDialogOpen(true);
  };

  const saveMilestone = async () => {
    if (!milestoneForm.year.trim() || !milestoneForm.title.trim() || !milestoneForm.description.trim()) {
      alert('Year, title, and description are required');
      return;
    }

    try {
      setSavingMilestone(true);
      const payload = {
        year: milestoneForm.year.trim(),
        title: milestoneForm.title.trim(),
        description: milestoneForm.description.trim(),
        display_order: milestoneForm.display_order ? Number(milestoneForm.display_order) : undefined,
      };

      if (editingMilestone) {
        await updateJourneyMilestone(editingMilestone.id, payload);
      } else {
        await createJourneyMilestone(payload as Omit<JourneyMilestone, 'id' | 'created_at' | 'updated_at'>);
      }

      setMilestoneDialogOpen(false);
      await fetchData();
    } catch (err: any) {
      alert('Failed to save milestone: ' + err.message);
    } finally {
      setSavingMilestone(false);
    }
  };

  const handleDeleteMilestone = async (id: number) => {
    if (!confirm('Delete this milestone?')) return;
    try {
      await deleteJourneyMilestone(id);
      await fetchData();
    } catch (err: any) {
      alert('Failed to delete milestone: ' + err.message);
    }
  };

  const moveMilestone = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= milestones.length) return;

    const reordered = [...milestones];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
    const items = reordered.map((m, i) => ({ id: m.id, display_order: i + 1 }));

    try {
      const result = await reorderJourneyMilestones(items);
      setMilestones(result.data || reordered);
    } catch (err: any) {
      alert('Failed to reorder milestones: ' + err.message);
    }
  };

  const openMemberDialog = (member?: TeamMember) => {
    if (member) {
      setEditingMember(member);
      setMemberForm({
        name: member.name,
        designation: member.designation,
        description: member.description,
        image: member.image || '',
        display_order: String(member.display_order),
        status: member.status,
      });
    } else {
      setEditingMember(null);
      setMemberForm(emptyMember);
    }
    setMemberDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/upload-image', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();

      if (response.ok && data.url) {
        setMemberForm((prev) => ({ ...prev, image: data.url }));
      } else {
        alert(data.error || 'Failed to upload image');
      }
    } catch {
      alert('Image upload failed');
    } finally {
      setUploadingImage(false);
      if (e.target) e.target.value = '';
    }
  };

  const saveMember = async () => {
    if (!memberForm.name.trim() || !memberForm.designation.trim() || !memberForm.description.trim()) {
      alert('Name, designation, and description are required');
      return;
    }

    try {
      setSavingMember(true);
      const payload = {
        name: memberForm.name.trim(),
        designation: memberForm.designation.trim(),
        description: memberForm.description.trim(),
        image: memberForm.image.trim() || null,
        display_order: memberForm.display_order ? Number(memberForm.display_order) : undefined,
        status: memberForm.status,
      };

      if (editingMember) {
        await updateTeamMember(editingMember.id, payload);
      } else {
        await createTeamMember(payload as Omit<TeamMember, 'id' | 'created_at' | 'updated_at'>);
      }

      setMemberDialogOpen(false);
      await fetchData();
    } catch (err: any) {
      alert('Failed to save team member: ' + err.message);
    } finally {
      setSavingMember(false);
    }
  };

  const handleDeleteMember = async (id: number) => {
    if (!confirm('Delete this team member?')) return;
    try {
      await deleteTeamMember(id);
      await fetchData();
    } catch (err: any) {
      alert('Failed to delete team member: ' + err.message);
    }
  };

  const toggleMemberStatus = async (member: TeamMember) => {
    const newStatus = member.status === 'active' ? 'inactive' : 'active';
    try {
      await updateTeamMember(member.id, { status: newStatus });
      setTeamMembers((prev) =>
        prev.map((m) => (m.id === member.id ? { ...m, status: newStatus } : m))
      );
    } catch (err: any) {
      alert('Failed to update status: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme.page}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme.page}`}>
      <div className={`border-b ${theme.header}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard" className="flex items-center gap-2 text-red-600 hover:text-red-700">
              <ArrowLeft className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>
            <div className={`h-6 w-px ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`} />
            <h1 className={`text-2xl font-bold ${theme.heading}`}>
              About Us Management
            </h1>
          </div>
          <Link href="/" className={`flex items-center gap-2 ${theme.link}`}>
            <Home className="w-4 h-4" />
            <span>View Site</span>
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Card className={`mb-6 border-red-300 ${darkMode ? 'bg-red-900/20' : 'bg-red-50'}`}>
            <CardContent className="p-4">
              <p className={darkMode ? 'text-red-400' : 'text-red-700'}>{error}</p>
              <p className={`text-sm mt-2 ${theme.subtext}`}>
                Run <code className={darkMode ? 'text-gray-300' : 'text-gray-800'}>frontend/database/about_schema.sql</code> in PostgreSQL if tables are missing.
              </p>
              <Button onClick={fetchData} variant="outline" size="sm" className={`mt-3 ${theme.outlineBtn}`}>
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className={theme.tabsList}>
            <TabsTrigger value="journey" className={`flex items-center gap-2 ${theme.tabsTrigger}`}>
              <Clock className="w-4 h-4" />
              Journey Timeline
            </TabsTrigger>
            <TabsTrigger value="team" className={`flex items-center gap-2 ${theme.tabsTrigger}`}>
              <Users className="w-4 h-4" />
              Team Members
            </TabsTrigger>
          </TabsList>

          <TabsContent value="journey">
            <Card className={theme.card}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className={theme.cardTitle}>Journey Timeline</CardTitle>
                <Button onClick={() => openMilestoneDialog()} className="bg-red-600 hover:bg-red-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Milestone
                </Button>
              </CardHeader>
              <CardContent>
                {milestones.length === 0 ? (
                  <p className={`text-center py-8 ${theme.muted}`}>
                    No milestones yet. Add your first milestone.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {milestones.map((milestone, index) => (
                      <div
                        key={milestone.id}
                        className={`flex items-start gap-4 p-4 rounded-lg border ${theme.listItem}`}
                      >
                        <div className="flex flex-col gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={index === 0}
                            onClick={() => moveMilestone(index, 'up')}
                            className={`h-8 w-8 p-0 ${theme.outlineBtn}`}
                          >
                            <ChevronUp className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={index === milestones.length - 1}
                            onClick={() => moveMilestone(index, 'down')}
                            className={`h-8 w-8 p-0 ${theme.outlineBtn}`}
                          >
                            <ChevronDown className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-amber-500">{milestone.year}</span>
                            <Badge variant="outline" className={theme.badge}>Order: {milestone.display_order}</Badge>
                          </div>
                          <h3 className={`font-semibold ${theme.heading}`}>
                            {milestone.title}
                          </h3>
                          <p className={`text-sm mt-1 ${theme.subtext}`}>
                            {milestone.description}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => openMilestoneDialog(milestone)} className={theme.outlineBtn}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteMilestone(milestone.id)}
                            className={`${theme.outlineBtn} text-red-500 hover:text-red-400 hover:border-red-500/50`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="team">
            <Card className={theme.card}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className={theme.cardTitle}>Team Members</CardTitle>
                <Button onClick={() => openMemberDialog()} className="bg-red-600 hover:bg-red-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Member
                </Button>
              </CardHeader>
              <CardContent>
                {teamMembers.length === 0 ? (
                  <p className={`text-center py-8 ${theme.muted}`}>
                    No team members yet. Add your first member.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {teamMembers.map((member) => (
                      <div
                        key={member.id}
                        className={`flex gap-4 p-4 rounded-lg border ${theme.listItem}`}
                      >
                        {member.image ? (
                          <Image
                            src={member.image}
                            alt={member.name}
                            width={64}
                            height={64}
                            className="w-16 h-16 rounded-full object-cover shrink-0"
                            unoptimized
                          />
                        ) : (
                          <div className={`w-16 h-16 rounded-full ${theme.avatarPlaceholder} shrink-0 flex items-center justify-center`}>
                            <Users className={`w-6 h-6 ${theme.muted}`} />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className={`font-semibold ${theme.heading}`}>
                              {member.name}
                            </h3>
                            <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
                              {member.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-amber-500 font-medium">{member.designation}</p>
                          <p className={`text-sm mt-1 line-clamp-2 ${theme.subtext}`}>
                            {member.description}
                          </p>
                          <p className={`text-xs mt-1 ${theme.muted}`}>
                            Order: {member.display_order}
                          </p>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button variant="outline" size="sm" onClick={() => openMemberDialog(member)} className={theme.outlineBtn}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => toggleMemberStatus(member)} className={theme.outlineBtn}>
                            {member.status === 'active' ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteMember(member.id)}
                            className={`${theme.outlineBtn} text-red-500 hover:text-red-400 hover:border-red-500/50`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Milestone Dialog */}
      <Dialog open={milestoneDialogOpen} onOpenChange={setMilestoneDialogOpen}>
        <DialogContent className={theme.dialog}>
          <DialogHeader>
            <DialogTitle className={theme.dialogTitle}>
              {editingMilestone ? 'Edit Milestone' : 'Add Milestone'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${theme.label}`}>Year</label>
              <Input
                value={milestoneForm.year}
                onChange={(e) => setMilestoneForm({ ...milestoneForm, year: e.target.value })}
                placeholder="e.g. 2024"
                className={theme.input}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${theme.label}`}>Title</label>
              <Input
                value={milestoneForm.title}
                onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })}
                placeholder="Milestone title"
                className={theme.input}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${theme.label}`}>Description</label>
              <Textarea
                value={milestoneForm.description}
                onChange={(e) => setMilestoneForm({ ...milestoneForm, description: e.target.value })}
                placeholder="Milestone description"
                rows={3}
                className={theme.textarea}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${theme.label}`}>Display Order</label>
              <Input
                type="number"
                value={milestoneForm.display_order}
                onChange={(e) => setMilestoneForm({ ...milestoneForm, display_order: e.target.value })}
                placeholder="Auto-assigned if empty"
                className={theme.input}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setMilestoneDialogOpen(false)} className={theme.outlineBtn}>
                Cancel
              </Button>
              <Button onClick={saveMilestone} disabled={savingMilestone} className="bg-red-600 hover:bg-red-700 text-white">
                {savingMilestone ? <Loader className="w-4 h-4 animate-spin" /> : 'Save'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Team Member Dialog */}
      <Dialog open={memberDialogOpen} onOpenChange={setMemberDialogOpen}>
        <DialogContent className={`max-w-lg ${theme.dialog}`}>
          <DialogHeader>
            <DialogTitle className={theme.dialogTitle}>
              {editingMember ? 'Edit Team Member' : 'Add Team Member'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${theme.label}`}>Name</label>
              <Input
                value={memberForm.name}
                onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                className={theme.input}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${theme.label}`}>Designation</label>
              <Input
                value={memberForm.designation}
                onChange={(e) => setMemberForm({ ...memberForm, designation: e.target.value })}
                className={theme.input}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${theme.label}`}>Description</label>
              <Textarea
                value={memberForm.description}
                onChange={(e) => setMemberForm({ ...memberForm, description: e.target.value })}
                rows={3}
                className={theme.textarea}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${theme.label}`}>Profile Image</label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={memberForm.image}
                  onChange={(e) => setMemberForm({ ...memberForm, image: e.target.value })}
                  placeholder="Image URL or upload"
                  className={theme.input}
                />
                <label className="cursor-pointer shrink-0">
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  <Button type="button" variant="outline" disabled={uploadingImage} className={theme.outlineBtn} asChild>
                    <span>
                      {uploadingImage ? <Loader className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    </span>
                  </Button>
                </label>
              </div>
              {memberForm.image && (
                <div className="relative mt-2 inline-block">
                  <Image
                    src={memberForm.image}
                    alt="Preview"
                    width={80}
                    height={80}
                    className="w-20 h-20 rounded-full object-cover"
                    unoptimized
                  />
                  <button
                    type="button"
                    onClick={() => setMemberForm({ ...memberForm, image: '' })}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${theme.label}`}>Display Order</label>
                <Input
                  type="number"
                  value={memberForm.display_order}
                  onChange={(e) => setMemberForm({ ...memberForm, display_order: e.target.value })}
                  placeholder="Auto"
                  className={theme.input}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${theme.label}`}>Status</label>
                <Select
                  value={memberForm.status}
                  onValueChange={(v) => setMemberForm({ ...memberForm, status: v as 'active' | 'inactive' })}
                >
                  <SelectTrigger className={theme.selectTrigger}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className={theme.selectContent}>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setMemberDialogOpen(false)} className={theme.outlineBtn}>
                Cancel
              </Button>
              <Button onClick={saveMember} disabled={savingMember} className="bg-red-600 hover:bg-red-700 text-white">
                {savingMember ? <Loader className="w-4 h-4 animate-spin" /> : 'Save'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
