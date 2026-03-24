/**
 * Create Program Dialog
 * For Super Admins to create new educational programs
 * Redesigned as a 3-step wizard
 */

import { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import {
  Dialog,
  DialogContent,
  DialogClose,
} from '../ui/dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { BookOpen, Calendar, DollarSign, GraduationCap, Plus, X, Check, ChevronRight, XIcon } from 'lucide-react';
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

const STEP_LABELS = ['Basics', 'Subjects', 'Schedule'];

export default function CreateProgramDialog({ open, onOpenChange }: CreateProgramDialogProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());

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

  // Reset to step 1 when dialog closes
  useEffect(() => {
    if (!open) {
      setStep(1);
      setExpandedDays(new Set());
    }
  }, [open]);

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
    setFormData({ ...formData, subjects: [...formData.subjects, subject] });
    setNewSubject('');
    setShowSubjectDropdown(false);
  };

  const availableSubjects = (existingSubjects || []).filter(
    (subject) => !formData.subjects.includes(subject.name)
  );

  const handleRemoveSubject = (subject: string) => {
    setFormData({ ...formData, subjects: formData.subjects.filter((s) => s !== subject) });
  };

  const handleAddTimetableSlot = (day: string) => {
    const currentSlots = formData.timetable[day] || [];
    setFormData({
      ...formData,
      timetable: { ...formData.timetable, [day]: [...currentSlots, { subject: '', time: '' }] },
    });
  };

  const handleRemoveTimetableSlot = (day: string, index: number) => {
    const currentSlots = formData.timetable[day] || [];
    setFormData({
      ...formData,
      timetable: { ...formData.timetable, [day]: currentSlots.filter((_, i) => i !== index) },
    });
  };

  const handleUpdateTimetableSlot = (
    day: string,
    index: number,
    field: 'subject' | 'time',
    value: string
  ) => {
    const currentSlots = formData.timetable[day] || [];
    const updatedSlots = currentSlots.map((slot, i) => (i === index ? { ...slot, [field]: value } : slot));
    setFormData({ ...formData, timetable: { ...formData.timetable, [day]: updatedSlots } });
  };

  const toggleDay = (day: string) => {
    setExpandedDays(prev => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  };

  const handleNext = () => {
    if (step === 1) {
      if (!formData.name || !formData.curriculum_id || !formData.start_date || !formData.end_date) {
        toast.error('Please fill in all required fields');
        return;
      }
      if (!formData.pricing || parseFloat(formData.pricing) <= 0) {
        toast.error('Please enter a valid pricing amount');
        return;
      }
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);
      if (endDate <= startDate) {
        toast.error('End date must be after start date');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (formData.subjects.length === 0) {
        toast.error('Please add at least one subject');
        return;
      }
      setStep(3);
    }
  };

  const handleSubmit = async () => {
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
      <DialogContent className="max-w-xl p-0 overflow-hidden gap-0" showCloseButton={false}>
        {/* Gradient header */}
        <div className="relative bg-gradient-to-br from-primary to-primary/80 px-6 pt-5 pb-5">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary-foreground/20 flex items-center justify-center shrink-0">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-base font-bold text-primary-foreground leading-none">Create Program</h2>
              <p className="text-xs text-primary-foreground/70 mt-0.5">Step {step} of 3 — {STEP_LABELS[step - 1]}</p>
            </div>
          </div>
          <DialogClose className="absolute top-4 right-4 p-1.5 rounded-md opacity-70 hover:opacity-100 transition-opacity text-primary-foreground [&_svg]:size-4">
            <XIcon />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>

        {/* Step progress bar */}
        <div className="flex items-center px-6 py-4 bg-muted/20 border-b border-border">
          {STEP_LABELS.map((label, i) => {
            const num = i + 1;
            const isDone = num < step;
            const isActive = num === step;
            return (
              <div key={label} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={[
                      'h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                      isDone
                        ? 'bg-primary text-primary-foreground'
                        : isActive
                        ? 'bg-background border-2 border-primary text-primary ring-4 ring-primary/20'
                        : 'bg-muted text-muted-foreground',
                    ].join(' ')}
                  >
                    {isDone ? <Check className="h-3.5 w-3.5" /> : num}
                  </div>
                  <span className={`text-[10px] font-medium ${isActive ? 'text-primary' : isDone ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {label}
                  </span>
                </div>
                {i < STEP_LABELS.length - 1 && (
                  <div className={`flex-1 h-px mx-2 mb-4 ${num < step ? 'bg-primary' : 'bg-border'}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Step content */}
        <div className="px-6 py-5">

          {/* Step 1: Basics */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label className="text-xs font-medium text-foreground mb-1.5 block">Program Name <span className="text-destructive">*</span></Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Mathematics Grade 8 - Term 1"
                />
              </div>

              <div>
                <Label className="text-xs font-medium text-foreground mb-1.5 block">Curriculum <span className="text-destructive">*</span></Label>
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-medium text-foreground mb-1.5 block">Start Date <span className="text-destructive">*</span></Label>
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
                  <Label className="text-xs font-medium text-foreground mb-1.5 block">End Date <span className="text-destructive">*</span></Label>
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
              </div>

              <div>
                <Label className="text-xs font-medium text-foreground mb-1.5 block">Pricing (per lesson) <span className="text-destructive">*</span></Label>
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
          )}

          {/* Step 2: Subjects */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex gap-2">
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
                      if (e.key === 'Enter') { e.preventDefault(); handleAddSubject(); }
                      if (e.key === 'Escape') setShowSubjectDropdown(false);
                    }}
                  />

                  {showSubjectDropdown && availableSubjects.length > 0 && newSubject.length === 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-48 overflow-auto">
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

                  {showSubjectDropdown && newSubject.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-48 overflow-auto">
                      <div className="p-2">
                        {availableSubjects.filter((s) => s.name.toLowerCase().includes(newSubject.toLowerCase())).length > 0 ? (
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

              {formData.subjects.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.subjects.map((subject) => (
                    <div
                      key={subject}
                      className="flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm"
                    >
                      <span>{subject}</span>
                      <button
                        onClick={() => handleRemoveSubject(subject)}
                        className="hover:text-destructive transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {formData.subjects.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">No subjects added yet. Use the input above to add subjects.</p>
              )}
            </div>
          )}

          {/* Step 3: Schedule */}
          {step === 3 && (
            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
              {DAYS_OF_WEEK.map((day) => {
                const slots = formData.timetable[day] || [];
                const isExpanded = expandedDays.has(day);
                return (
                  <div key={day} className="bg-muted/30 rounded-xl overflow-hidden">
                    <button
                      type="button"
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
                      onClick={() => toggleDay(day)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">{day}</span>
                        {slots.length > 0 && (
                          <span className="text-[10px] font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                            {slots.length} slot{slots.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-3 space-y-2 border-t border-border/50">
                        {slots.length === 0 ? (
                          <p className="text-xs text-muted-foreground py-2">No classes scheduled</p>
                        ) : (
                          slots.map((slot, index) => (
                            <div key={index} className="flex gap-2 items-center pt-2">
                              <Select
                                value={slot.subject}
                                onValueChange={(val) => handleUpdateTimetableSlot(day, index, 'subject', val)}
                              >
                                <SelectTrigger className="flex-1">
                                  <SelectValue placeholder="Subject" />
                                </SelectTrigger>
                                <SelectContent>
                                  {formData.subjects.map((subj) => (
                                    <SelectItem key={subj} value={subj}>{subj}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Input
                                type="time"
                                value={slot.time}
                                onChange={(e) => handleUpdateTimetableSlot(day, index, 'time', e.target.value)}
                                className="w-32"
                              />
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                onClick={() => handleRemoveTimetableSlot(day, index)}
                                className="text-destructive hover:text-destructive shrink-0"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))
                        )}
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleAddTimetableSlot(day)}
                          className="mt-2 text-xs"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Slot
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/20">
          <div>
            {step > 1 && (
              <Button variant="ghost" size="sm" onClick={() => setStep((prev) => (prev - 1) as 1 | 2 | 3)}>
                Back
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            {step < 3 ? (
              <Button size="sm" onClick={handleNext}>
                Next
                <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            ) : (
              <Button size="sm" onClick={handleSubmit} disabled={loading}>
                <GraduationCap className="h-3.5 w-3.5 mr-1.5" />
                {loading ? 'Creating...' : 'Create Program'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
