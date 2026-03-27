import { useState, useRef } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { X, Camera, Users, ChevronDown } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import type { Id } from '../../../convex/_generated/dataModel';
import { useAuth } from '../../hooks/useAuth';
import { UserCredentialsDialog } from './UserCredentialsDialog';
import { toast } from 'sonner';
import { uploadToCloudinary } from '../../lib/cloudinary';

interface AddUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partnerIdOverride?: Id<'partners'>;
}

type Role =
  | 'partner_admin'
  | 'accountant'
  | 'campaign_manager'
  | 'viewer'
  | 'super_agent'
  | 'master_agent'
  | 'merchant_admin';

// ── Kenya Flag SVG ─────────────────────────────────────────────────────────────
const KenyaFlag = () => (
  <svg width="22" height="15" viewBox="0 0 22 15" className="rounded-[2px] shrink-0">
    <rect width="22" height="5" fill="#006600"/>
    <rect y="5" width="22" height="5" fill="#cc0000"/>
    <rect y="10" width="22" height="5" fill="#006600"/>
    <rect y="4" width="22" height="7" fill="#000"/>
    <rect y="5" width="22" height="5" fill="#cc0000"/>
    <rect y="4" width="22" height="1" fill="#fff"/>
    <rect y="10" width="22" height="1" fill="#fff"/>
  </svg>
);

export default function AddUserDialog({ open, onOpenChange, partnerIdOverride }: AddUserDialogProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<Role>('viewer');

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showCredDialog, setShowCredDialog] = useState(false);
  const [newUserCreds, setNewUserCreds] = useState<{
    email: string; password: string; name: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);

  const { partner } = useAuth();
  const partnerId = partnerIdOverride || partner?._id;

  const roles = useQuery(api.role.getRoles, { is_active: true });
  const createUser = useMutation(api.user.createUser);

  const matchedRole = roles?.find(r => r.name === role);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const resetForm = () => {
    setName(''); setEmail(''); setPhone('');
    setRole('viewer');
    setImageFile(null); setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    if (!name || !email) { toast.error('Name and email are required'); return; }
    if (!partnerId) { toast.error('Partner ID missing'); return; }

    setSaving(true);
    try {
      let avatar_url: string | undefined;
      if (imageFile) {
        setUploading(true);
        try {
          avatar_url = await uploadToCloudinary(imageFile);
        } catch {
          toast.error('Image upload failed — user will be created without a photo');
        } finally {
          setUploading(false);
        }
      }

      const res = await createUser({
        partner_id: partnerId,
        email,
        name,
        phone: phone ? (phone.startsWith('+') ? phone : `+254${phone}`) : undefined,
        avatar_url,
        role,
        permission_ids: matchedRole?.permission_ids ?? [],
      });

      setNewUserCreds({ email, password: res.generatedPassword, name });
      setShowCredDialog(true);
      toast.success('User created successfully!');
      resetForm();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed top-14 sm:top-16 lg:left-[110px] left-0 right-0 bottom-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/40"
        onClick={handleClose}
      >
        <div
          className="bg-card rounded-2xl w-full max-w-[540px] mx-3 shadow-2xl overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Gradient header */}
          <div className="relative bg-gradient-to-br from-primary to-primary/80 px-6 pt-5 pb-5">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-primary-foreground/20 flex items-center justify-center shrink-0">
                <Users className="h-4.5 w-4.5 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-base font-bold text-primary-foreground leading-none">Add User</h2>
                <p className="text-xs text-primary-foreground/70 mt-0.5">Assign role and permissions</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-1.5 rounded-md opacity-70 hover:opacity-100 transition-opacity text-primary-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5">
            <div className="flex gap-5">
              {/* ── Left: Circular avatar upload ── */}
              <div className="shrink-0 flex flex-col items-center gap-2">
                <div
                  className="h-24 w-24 rounded-full overflow-hidden border-2 border-dashed border-border relative cursor-pointer group bg-muted"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {imagePreview ? (
                    <img src={imagePreview} className="w-full h-full object-cover" alt="preview" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Users className="h-8 w-8 text-muted-foreground/40" />
                    </div>
                  )}
                  {/* Camera overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                    <Camera className="h-5 w-5 text-white" />
                  </div>
                </div>
                {imagePreview ? (
                  <button
                    onClick={handleRemoveImage}
                    className="text-[11px] font-semibold text-destructive hover:underline"
                  >
                    Remove
                  </button>
                ) : (
                  <p className="text-[10px] text-muted-foreground text-center">Click to upload</p>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              {/* ── Right: Form fields ── */}
              <div className="flex-1 min-w-0 space-y-3.5">
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1.5">Full Name</label>
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full border border-border rounded-lg px-3.5 py-2.5 text-sm bg-background outline-none text-foreground placeholder:text-muted-foreground focus:border-primary/50 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground block mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="w-full border border-border rounded-lg px-3.5 py-2.5 text-sm bg-background outline-none text-foreground placeholder:text-muted-foreground focus:border-primary/50 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground block mb-1.5">
                    Phone <span className="text-muted-foreground font-normal">(optional)</span>
                  </label>
                  <div className="flex items-center border border-border rounded-lg bg-background overflow-hidden px-3 focus-within:border-primary/50 transition-colors">
                    <div className="flex items-center gap-1.5 pr-3 border-r border-border mr-3 cursor-pointer py-2.5">
                      <KenyaFlag />
                      <ChevronDown className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <span className="text-sm text-muted-foreground mr-1.5">+254</span>
                    <input
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="7XX XXX XXX"
                      className="flex-1 border-none bg-transparent outline-none text-sm py-2.5 text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground block mb-1.5">Role</label>
                  <Select value={role} onValueChange={val => setRole(val as Role)}>
                    <SelectTrigger className="text-sm h-10 bg-background border-border">
                      <SelectValue placeholder="Select role..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">Viewer</SelectItem>
                      <SelectItem value="campaign_manager">Campaign Manager</SelectItem>
                      <SelectItem value="accountant">Accountant</SelectItem>
                      <SelectItem value="merchant_admin">Merchant Admin</SelectItem>
                      <SelectItem value="super_agent">Super Agent</SelectItem>
                      <SelectItem value="master_agent">Master Agent</SelectItem>
                      <SelectItem value="partner_admin">Partner Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/20">
            <p className="text-xs text-muted-foreground">Password auto-generated after creation</p>
            <div className="flex items-center gap-2">
              <button
                onClick={handleClose}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving || uploading}
                className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                {uploading ? 'Uploading...' : saving ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {newUserCreds && (
        <UserCredentialsDialog
          open={showCredDialog}
          onOpenChange={setShowCredDialog}
          email={newUserCreds.email}
          password={newUserCreds.password}
          userName={newUserCreds.name}
          partnerName={partner?.name || 'Your Organization'}
        />
      )}
    </>
  );
}
