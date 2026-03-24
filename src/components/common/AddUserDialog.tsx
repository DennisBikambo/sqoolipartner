import { useState, useRef } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { X, Upload, ChevronDown } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
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

const CATEGORY_LABELS: Record<string, string> = {
  users: 'Users', campaigns: 'Campaigns', wallet: 'Wallet',
  dashboard: 'Dashboard', settings: 'Settings', programs: 'Programs', all_access: 'All Access',
};

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

  // Image
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // After creation
  const [showCredDialog, setShowCredDialog] = useState(false);
  const [newUserCreds, setNewUserCreds] = useState<{
    email: string; password: string; name: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);

  const { partner } = useAuth();
  const partnerId = partnerIdOverride || partner?._id;

  const roles = useQuery(api.role.getRoles, { is_active: true });
  const createUser = useMutation(api.user.createUser);

  // Auto-resolve role template by matching system role name
  const matchedRole = roles?.find(r => r.name === role);
  const permsByCategory = (matchedRole?.permissions ?? []).reduce((acc, p) => {
    if (!p) return acc;
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {} as Record<string, Array<{ _id: Id<'permissions'>; name: string; category: string }>>);

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
        className="fixed top-14 sm:top-16 lg:left-[110px] left-0 right-0 bottom-0 z-50 flex items-center justify-center bg-black/30"
        onClick={handleClose}
      >
        <div
          className="bg-card rounded-[14px] w-[calc(100%-24px)] p-7 shadow-2xl max-h-[calc(100%-24px)] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex justify-between items-start mb-5">
            <div>
              <h2 className="text-base font-bold text-foreground m-0">Add User</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Add user and assign role</p>
            </div>
            <button onClick={handleClose} className="p-0.5 rounded hover:bg-muted transition-colors">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          <div className="flex gap-5">
            {/* ── Left: Image upload ── */}
            <div className="w-[160px] shrink-0">
              <label className="text-xs font-medium text-foreground block mb-2">Profile Photo</label>
              <div
                className="border-2 border-dashed border-border rounded-xl bg-muted h-[160px] flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-colors hover:border-primary/50 hover:bg-muted/80"
                onClick={() => fileInputRef.current?.click()}
              >
                {imagePreview ? (
                  <>
                    <img src={imagePreview} className="w-full h-full object-cover" alt="preview" />
                  </>
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-full bg-card flex items-center justify-center mb-2 shadow-sm">
                      <Upload className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-[11px] font-medium text-primary text-center px-2">Click to upload</p>
                    <p className="text-[10px] text-muted-foreground text-center mt-0.5 px-2">PNG, JPG or GIF</p>
                  </>
                )}
              </div>
              {imagePreview && (
                <button
                  onClick={handleRemoveImage}
                  className="w-full mt-1.5 text-destructive text-[11px] font-semibold bg-transparent border-none cursor-pointer text-center"
                >
                  Remove photo
                </button>
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
            <div className="flex-1 min-w-0">
              {/* Name */}
              <div className="mb-4">
                <label className="text-xs font-medium text-foreground block mb-1.5">Full Name</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full border border-border rounded-lg px-3.5 py-2.5 text-xs bg-muted outline-none text-foreground placeholder:text-muted-foreground focus:border-primary/50 transition-colors"
                />
              </div>

              {/* Email */}
              <div className="mb-4">
                <label className="text-xs font-medium text-foreground block mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full border border-border rounded-lg px-3.5 py-2.5 text-xs bg-muted outline-none text-foreground placeholder:text-muted-foreground focus:border-primary/50 transition-colors"
                />
              </div>

              {/* Phone with Kenya flag */}
              <div className="mb-4">
                <label className="text-xs font-medium text-foreground block mb-1.5">Phone Number <span className="text-muted-foreground font-normal">(optional)</span></label>
                <div className="flex items-center border border-border rounded-lg bg-muted overflow-hidden px-3 focus-within:border-primary/50 transition-colors">
                  <div className="flex items-center gap-1.5 pr-3 border-r border-border mr-3 cursor-pointer py-2.5">
                    <KenyaFlag />
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <span className="text-xs text-muted-foreground mr-1.5">+254</span>
                  <input
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="7XX XXX XXX"
                    className="flex-1 border-none bg-transparent outline-none text-xs py-2.5 text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              </div>

              {/* Role */}
              <div className="mb-3">
                <label className="text-xs font-medium text-foreground block mb-1.5">Role</label>
                <Select value={role} onValueChange={val => setRole(val as Role)}>
                  <SelectTrigger className="text-xs h-9 bg-muted border-border">
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

              {/* Auto-resolved permission preview */}
              {matchedRole && Object.keys(permsByCategory).length > 0 ? (
                <div className="rounded-lg border border-border bg-muted/50 p-3 space-y-2">
                  <p className="text-[10px] font-semibold text-foreground uppercase tracking-wide">Permissions</p>
                  {Object.entries(permsByCategory).map(([cat, perms]) => (
                    <div key={cat}>
                      <p className="text-[10px] text-muted-foreground mb-1.5">{CATEGORY_LABELS[cat] ?? cat}</p>
                      <div className="flex flex-wrap gap-1">
                        {perms.map(p => (
                          <Badge key={p._id} variant="secondary" className="text-[10px] py-0 px-1.5">
                            {p.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : matchedRole ? (
                <p className="text-[11px] text-muted-foreground italic">No permissions configured for this role.</p>
              ) : roles && roles.length > 0 ? (
                <p className="text-[11px] text-muted-foreground italic">No role template found for "{role}" — user will be created with no permissions.</p>
              ) : null}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end mt-4">
            <button
              onClick={handleSubmit}
              disabled={saving || uploading}
              className="bg-primary text-primary-foreground border-none rounded-full px-5 py-2 text-xs font-semibold cursor-pointer hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {uploading ? 'Uploading photo...' : saving ? 'Creating...' : 'Save Changes'}
            </button>
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
