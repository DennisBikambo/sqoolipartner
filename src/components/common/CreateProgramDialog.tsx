/**
 * Create Program Dialog
 * For Super Admins to create new educational programs
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { BookOpen, Calendar, DollarSign, Plus, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import type { Id } from '../../../convex/_generated/dataModel';

interface CreateProgramDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface TimetableSlot {
  subject: string;
  time: string;
}

interface FormData {
  name: string;
  curriculum_id: string;
  start_date: string;
  end_date: string;
  pricing: string;
  subjects: string[];
  timetable: Record<string, TimetableSlot[]>;
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function CreateProgramDialog({ open, onOpenChange }: CreateProgramDialogProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    curriculum_id: '',
    start_date: '',
    end_date: '',
    pricing: '',
    subjects: [],
    timetable: {},
  });

  const [newSubject, setNewSubject] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);
  const subjectInputRef = useRef<HTMLDivElement>(null);

  const curricula = useQuery(api.curricula.listCurricula);
  const existingSubjects = useQuery(api.subjects.listSubjects);
  const createProgram = useMutation(api.program.createProgram);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (subjectInputRef.current && !subjectInputRef.current.contains(event.target as Node)) {
        setShowSubjectDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleAddSubject = (subjectName?: string) => {
    const subject = subjectName || newSubject.trim();
    if (!subject) return;
    if (formData.subjects.includes(subject)) {
      toast.error('Subject already added');
      return;
    }
    setFormData({
      ...formData,
      subjects: [...formData.subjects, subject],
    });
    setNewSubject('');
    setShowSubjectDropdown(false);
  };

  // Filter existing subjects to show only those not already added
  const availableSubjects = (existingSubjects || []).filter(
    (subject) => !formData.subjects.includes(subject.name)
  );

  const handleRemoveSubject = (subject: string) => {
    setFormData({
      ...formData,
      subjects: formData.subjects.filter((s) => s !== subject),
    });
  };

  const handleAddTimetableSlot = (day: string) => {
    const currentSlots = formData.timetable[day] || [];
    setFormData({
      ...formData,
      timetable: {
        ...formData.timetable,
        [day]: [...currentSlots, { subject: '', time: '' }],
      },
    });
  };

  const handleRemoveTimetableSlot = (day: string, index: number) => {
    const currentSlots = formData.timetable[day] || [];
    setFormData({
      ...formData,
      timetable: {
        ...formData.timetable,
        [day]: currentSlots.filter((_, i) => i !== index),
      },
    });
  };

  const handleUpdateTimetableSlot = (
    day: string,
    index: number,
    field: 'subject' | 'time',
    value: string
  ) => {
    const currentSlots = formData.timetable[day] || [];
    const updatedSlots = currentSlots.map((slot, i) =>
      i === index ? { ...slot, [field]: value } : slot
    );
    setFormData({
      ...formData,
      timetable: {
        ...formData.timetable,
        [day]: updatedSlots,
      },
    });
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.name || !formData.curriculum_id || !formData.start_date || !formData.end_date) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!formData.pricing || parseFloat(formData.pricing) <= 0) {
      toast.error('Please enter a valid pricing amount');
      return;
    }

    if (formData.subjects.length === 0) {
      toast.error('Please add at least one subject');
      return;
    }

    // Validate dates
    const startDate = new Date(formData.start_date);
    const endDate = new Date(formData.end_date);
    if (endDate <= startDate) {
      toast.error('End date must be after start date');
      return;
    }

    setLoading(true);
    try {
      await createProgram({
        name: formData.name,
        curriculum_id: formData.curriculum_id as Id<'curricula'>,
        start_date: formData.start_date,
        end_date: formData.end_date,
        pricing: parseFloat(formData.pricing),
        subjects: formData.subjects,
        timetable: formData.timetable,
      });

      toast.success('Program created successfully!');

      // Reset form
      setFormData({
        name: '',
        curriculum_id: '',
        start_date: '',
        end_date: '',
        pricing: '',
        subjects: [],
        timetable: {},
      });
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Failed to create program');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Program</DialogTitle>
          <DialogDescription>
            Create a new educational program with curriculum, subjects, and timetable.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground border-b pb-2">
              <BookOpen className="h-4 w-4" />
              Program Details
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Program Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Mathematics Grade 8 - Term 1"
                />
              </div>

              <div className="col-span-2">
                <Label>Curriculum *</Label>
                <Select
                  value={formData.curriculum_id}
                  onValueChange={(val) => setFormData({ ...formData, curriculum_id: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select curriculum" />
                  </SelectTrigger>
                  <SelectContent>
                    {curricula?.map((curr) => (
                      <SelectItem key={curr._id} value={curr._id}>
                        {curr.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Start Date *</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label>End Date *</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="col-span-2">
                <Label>Pricing (per lesson) *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.pricing}
                    onChange={(e) => setFormData({ ...formData, pricing: e.target.value })}
                    placeholder="200.00"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Subjects */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground border-b pb-2">
              <BookOpen className="h-4 w-4" />
              Subjects
            </div>

            <div className="space-y-2">
              {/* Add Subject Input */}
              <div className="flex gap-2 relative">
                <div className="flex-1 relative" ref={subjectInputRef}>
                  <Input
                    value={newSubject}
                    onChange={(e) => {
                      setNewSubject(e.target.value);
                      setShowSubjectDropdown(true);
                    }}
                    onFocus={() => setShowSubjectDropdown(true)}
                    placeholder="Type to add or select from existing subjects"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSubject();
                      }
                      if (e.key === 'Escape') {
                        setShowSubjectDropdown(false);
                      }
                    }}
                  />

                  {/* Dropdown for existing subjects */}
                  {showSubjectDropdown && availableSubjects.length > 0 && newSubject.length === 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                      <div className="p-2">
                        <p className="text-xs text-muted-foreground mb-2">Select from existing subjects:</p>
                        {availableSubjects.map((subject) => (
                          <button
                            key={subject._id}
                            type="button"
                            onClick={() => handleAddSubject(subject.name)}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-md transition-colors flex items-center gap-2"
                          >
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                            {subject.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Filtered dropdown when typing */}
                  {showSubjectDropdown && newSubject.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                      <div className="p-2">
                        {availableSubjects.filter((s) =>
                          s.name.toLowerCase().includes(newSubject.toLowerCase())
                        ).length > 0 ? (
                          <>
                            <p className="text-xs text-muted-foreground mb-2">Matching subjects:</p>
                            {availableSubjects
                              .filter((s) => s.name.toLowerCase().includes(newSubject.toLowerCase()))
                              .map((subject) => (
                                <button
                                  key={subject._id}
                                  type="button"
                                  onClick={() => handleAddSubject(subject.name)}
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-md transition-colors flex items-center gap-2"
                                >
                                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                                  {subject.name}
                                </button>
                              ))}
                          </>
                        ) : (
                          <div className="px-3 py-2 text-sm text-muted-foreground">
                            No matching subjects. Press Enter to add "{newSubject}"
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <Button type="button" onClick={() => handleAddSubject()}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Quick add buttons for common subjects */}
              {availableSubjects.length > 0 && formData.subjects.length === 0 && (
                <div className="flex flex-wrap gap-2">
                  <p className="text-xs text-muted-foreground w-full">Quick add:</p>
                  {availableSubjects.slice(0, 6).map((subject) => (
                    <Button
                      key={subject._id}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddSubject(subject.name)}
                      className="text-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {subject.name}
                    </Button>
                  ))}
                </div>
              )}
            </div>

            {/* Added Subjects */}
            <div className="flex flex-wrap gap-2">
              {formData.subjects.map((subject) => (
                <div
                  key={subject}
                  className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full"
                >
                  <span className="text-sm">{subject}</span>
                  <button
                    onClick={() => handleRemoveSubject(subject)}
                    className="hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Timetable */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground border-b pb-2">
              <Calendar className="h-4 w-4" />
              Weekly Timetable (Optional)
            </div>

            <div className="space-y-3">
              {DAYS_OF_WEEK.map((day) => {
                const slots = formData.timetable[day] || [];
                return (
                  <div key={day} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium">{day}</h4>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleAddTimetableSlot(day)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Slot
                      </Button>
                    </div>

                    {slots.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No classes scheduled</p>
                    ) : (
                      <div className="space-y-2">
                        {slots.map((slot, index) => (
                          <div key={index} className="flex gap-2 items-center">
                            <Select
                              value={slot.subject}
                              onValueChange={(val) =>
                                handleUpdateTimetableSlot(day, index, 'subject', val)
                              }
                            >
                              <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Subject" />
                              </SelectTrigger>
                              <SelectContent>
                                {formData.subjects.map((subj) => (
                                  <SelectItem key={subj} value={subj}>
                                    {subj}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            <Input
                              type="time"
                              value={slot.time}
                              onChange={(e) =>
                                handleUpdateTimetableSlot(day, index, 'time', e.target.value)
                              }
                              className="w-32"
                            />

                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              onClick={() => handleRemoveTimetableSlot(day, index)}
                              className="text-destructive hover:text-destructive"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <Button className="w-full" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Creating...' : 'Create Program'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
