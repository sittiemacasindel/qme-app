import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import "./Profile.css";

interface ProfileData {
  id: string;
  username: string;
  full_name: string;
  email: string;
  role: string;
  organization: string;
  avatar_url: string | null;
}

interface ProfilePageProps {
  onNavigateToDashboard: () => void;
}

type ActiveTab = "info" | "password" | "photo";

function ProfilePage({ onNavigateToDashboard }: ProfilePageProps) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>("info");

  // Edit profile fields
  const [editMode, setEditMode] = useState(false);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("");
  const [organization, setOrganization] = useState("");
  const [saving, setSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Photo upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoMsg, setPhotoMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  /* ── Fetch Profile ── */
  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, full_name, email, role, organization, avatar_url")
        .eq("id", user.id)
        .maybeSingle();

      if (data) {
        setProfile(data);
        setFullName(data.full_name || "");
        setUsername(data.username || "");
        setRole(data.role || "");
        setOrganization(data.organization || "");
        if (data.avatar_url) setAvatarPreview(data.avatar_url);
      } else if (error) {
        // Fallback to auth user data if profile row is incomplete
        setProfile({
          id: user.id,
          username: user.user_metadata?.username || "",
          full_name: user.user_metadata?.full_name || "",
          email: user.email || "",
          role: "Administrator",
          organization: "",
          avatar_url: null,
        });
        setFullName(user.user_metadata?.full_name || "");
        setUsername(user.user_metadata?.username || "");
        setRole("Administrator");
        setOrganization("");
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  /* ── Get avatar initials ── */
  const getInitials = () => {
    const name = profile?.full_name || profile?.username || "";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "A";
  };

  /* ── Save Profile ── */
  const handleSaveProfile = async () => {
    if (!profile) return;
    setProfileMsg(null);
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim(),
          username: username.trim(),
          role: role.trim(),
          organization: organization.trim(),
        })
        .eq("id", profile.id);

      if (error) {
        setProfileMsg({ type: "error", text: "Failed to save profile: " + error.message });
      } else {
        setProfile((prev) =>
          prev
            ? { ...prev, full_name: fullName, username, role, organization }
            : prev
        );
        setProfileMsg({ type: "success", text: "Profile updated successfully!" });
        setEditMode(false);
      }
    } catch {
      setProfileMsg({ type: "error", text: "A network error occurred. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  /* ── Change Password ── */
  const handleChangePassword = async () => {
    setPasswordMsg(null);
    if (!newPassword || !confirmNewPassword) {
      setPasswordMsg({ type: "error", text: "Please fill in all password fields." });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordMsg({ type: "error", text: "New passwords do not match." });
      return;
    }
    const rules = [
      { test: newPassword.length >= 8, rule: "at least 8 characters" },
      { test: /[A-Z]/.test(newPassword), rule: "one uppercase letter" },
      { test: /[0-9]/.test(newPassword), rule: "one number" },
      { test: /[^A-Za-z0-9]/.test(newPassword), rule: "one special character" },
    ];
    const failed = rules.filter((r) => !r.test).map((r) => r.rule);
    if (failed.length > 0) {
      setPasswordMsg({ type: "error", text: "Password must include: " + failed.join(", ") + "." });
      return;
    }

    setPasswordSaving(true);
    try {
      // Re-authenticate first with current password
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        setPasswordMsg({ type: "error", text: "Could not verify user. Please log in again." });
        return;
      }

      const { error: reAuthError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (reAuthError) {
        setPasswordMsg({ type: "error", text: "Current password is incorrect." });
        return;
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) {
        setPasswordMsg({ type: "error", text: "Failed to update password: " + error.message });
      } else {
        setPasswordMsg({ type: "success", text: "Password updated successfully!" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
      }
    } catch {
      setPasswordMsg({ type: "error", text: "A network error occurred. Please try again." });
    } finally {
      setPasswordSaving(false);
    }
  };

  /* ── Upload Photo ── */
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    // Validate file type and size
    if (!file.type.startsWith("image/")) {
      setPhotoMsg({ type: "error", text: "Please select a valid image file." });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setPhotoMsg({ type: "error", text: "Image must be smaller than 2MB." });
      return;
    }

    setPhotoMsg(null);
    setPhotoUploading(true);

    // Preview immediately
    const objectUrl = URL.createObjectURL(file);
    setAvatarPreview(objectUrl);

    try {
      const ext = file.name.split(".").pop();
      // Path format: {user-id}/avatar.{ext}
      // The RLS policy checks storage.foldername(name)[1] === auth.uid()
      // so the file MUST be inside a folder named after the user's ID
      const filePath = `${profile.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        setPhotoMsg({ type: "error", text: "Upload failed: " + uploadError.message });
        setAvatarPreview(profile.avatar_url);
        return;
      }

      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const publicUrl = urlData.publicUrl + `?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", profile.id);

      if (updateError) {
        setPhotoMsg({ type: "error", text: "Photo uploaded but profile update failed." });
      } else {
        setProfile((prev) => prev ? { ...prev, avatar_url: publicUrl } : prev);
        setAvatarPreview(publicUrl);
        setPhotoMsg({ type: "success", text: "Profile photo updated successfully!" });
      }
    } catch {
      setPhotoMsg({ type: "error", text: "A network error occurred during upload." });
    } finally {
      setPhotoUploading(false);
    }
  };

  /* ── Remove Photo ── */
  const handleRemovePhoto = async () => {
    if (!profile) return;
    setPhotoUploading(true);
    setPhotoMsg(null);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: null })
        .eq("id", profile.id);

      if (error) {
        setPhotoMsg({ type: "error", text: "Failed to remove photo." });
      } else {
        setProfile((prev) => prev ? { ...prev, avatar_url: null } : prev);
        setAvatarPreview(null);
        setPhotoMsg({ type: "success", text: "Profile photo removed." });
      }
    } finally {
      setPhotoUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-page-loading">
        <span className="spinner-lg" />
        <p>Loading profile…</p>
      </div>
    );
  }

  return (
    <div className="profile-page">
      {/* ── Page Header ── */}
      <div className="profile-page-header">
        <div>
          <h1 className="profile-page-title">My Profile</h1>
          <p className="profile-page-subtitle">Manage your account information and password</p>
        </div>
        <button className="back-to-dash-btn" onClick={onNavigateToDashboard}>
          ← Back to Dashboard
        </button>
      </div>

      {/* ── Hero Card ── */}
      <div className="profile-hero-card">
        <div className="profile-hero-avatar">
          {avatarPreview ? (
            <img src={avatarPreview} alt="Avatar" className="hero-avatar-img" />
          ) : (
            <span className="hero-avatar-initials">{getInitials()}</span>
          )}
        </div>
        <div className="profile-hero-info">
          <h2 className="profile-hero-name">{profile?.full_name || profile?.username || "—"}</h2>
          <p className="profile-hero-email">{profile?.email || "—"}</p>
          <span className="profile-hero-badge">
            <ShieldIcon /> {profile?.role || "Administrator"}
          </span>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="profile-tabs">
        <button
          className={`profile-tab ${activeTab === "info" ? "active" : ""}`}
          onClick={() => { setActiveTab("info"); setProfileMsg(null); }}
        >
          <PersonIcon /> Account Information
        </button>
        <button
          className={`profile-tab ${activeTab === "password" ? "active" : ""}`}
          onClick={() => { setActiveTab("password"); setPasswordMsg(null); }}
        >
          <LockIcon /> Change Password
        </button>
        <button
          className={`profile-tab ${activeTab === "photo" ? "active" : ""}`}
          onClick={() => { setActiveTab("photo"); setPhotoMsg(null); }}
        >
          <CameraIcon /> Profile Photo
        </button>
      </div>

      {/* ── Tab: Account Information ── */}
      {activeTab === "info" && (
        <div className="profile-card-panel">
          <div className="panel-header">
            <h3 className="panel-title">Account Information</h3>
            {!editMode ? (
              <button className="edit-profile-btn" onClick={() => setEditMode(true)}>
                <PencilIcon /> Edit Profile
              </button>
            ) : (
              <div className="edit-actions">
                <button className="cancel-btn" onClick={() => { setEditMode(false); setProfileMsg(null); }}>
                  Cancel
                </button>
                <button className="save-btn" onClick={handleSaveProfile} disabled={saving}>
                  {saving ? <><span className="spinner-xs" /> Saving…</> : "Save Changes"}
                </button>
              </div>
            )}
          </div>

          {profileMsg && (
            <div className={`panel-message ${profileMsg.type}`} role="alert">
              {profileMsg.type === "success" ? "✓" : "⚠"} {profileMsg.text}
            </div>
          )}

          <div className="info-grid">
            <div className="info-field">
              <label className="info-label"><PersonIcon /> FULL NAME</label>
              {editMode ? (
                <input
                  className="info-input"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                />
              ) : (
                <div className="info-value">{profile?.full_name || "—"}</div>
              )}
            </div>

            <div className="info-field">
              <label className="info-label"><MailIcon /> EMAIL ADDRESS</label>
              <div className="info-value info-value--muted">{profile?.email || "—"}</div>
              {editMode && <p className="info-hint">Email cannot be changed here.</p>}
            </div>

            <div className="info-field">
              <label className="info-label"><PersonIcon /> USERNAME</label>
              {editMode ? (
                <input
                  className="info-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Your username"
                />
              ) : (
                <div className="info-value">{profile?.username || "—"}</div>
              )}
            </div>

            <div className="info-field">
              <label className="info-label"><BuildingIcon /> ORGANIZATION</label>
              {editMode ? (
                <input
                  className="info-input"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder="Your organization"
                />
              ) : (
                <div className="info-value">{profile?.organization || "—"}</div>
              )}
            </div>

            <div className="info-field info-field--full">
              <label className="info-label"><ShieldIcon /> ROLE</label>
              {editMode ? (
                <input
                  className="info-input info-input--accent"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="Your role"
                />
              ) : (
                <div className="info-value info-value--role">{profile?.role || "Administrator"}</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Change Password ── */}
      {activeTab === "password" && (
        <div className="profile-card-panel">
          <div className="panel-header">
            <h3 className="panel-title">Change Password</h3>
          </div>

          {passwordMsg && (
            <div className={`panel-message ${passwordMsg.type}`} role="alert">
              {passwordMsg.type === "success" ? "✓" : "⚠"} {passwordMsg.text}
            </div>
          )}

          <div className="password-fields">
            <div className="info-field info-field--full">
              <label className="info-label"><LockIcon /> CURRENT PASSWORD</label>
              <div className="pw-input-wrapper">
                <input
                  className="info-input"
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter your current password"
                />
                <button className="pw-toggle" type="button" onClick={() => setShowCurrent(!showCurrent)}>
                  {showCurrent ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            <div className="info-field">
              <label className="info-label"><LockIcon /> NEW PASSWORD</label>
              <div className="pw-input-wrapper">
                <input
                  className="info-input"
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 8 chars, A-Z, 0-9, !@#…"
                />
                <button className="pw-toggle" type="button" onClick={() => setShowNew(!showNew)}>
                  {showNew ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            <div className="info-field">
              <label className="info-label"><LockIcon /> CONFIRM NEW PASSWORD</label>
              <div className="pw-input-wrapper">
                <input
                  className="info-input"
                  type={showConfirm ? "text" : "password"}
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Re-enter your new password"
                />
                <button className="pw-toggle" type="button" onClick={() => setShowConfirm(!showConfirm)}>
                  {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            <div className="pw-rules">
              <p className="pw-rules-title">Password requirements:</p>
              <ul>
                <li className={newPassword.length >= 8 ? "met" : ""}>At least 8 characters</li>
                <li className={/[A-Z]/.test(newPassword) ? "met" : ""}>One uppercase letter (A–Z)</li>
                <li className={/[0-9]/.test(newPassword) ? "met" : ""}>One number (0–9)</li>
                <li className={/[^A-Za-z0-9]/.test(newPassword) ? "met" : ""}>One special character (!@#$…)</li>
              </ul>
            </div>

            <button
              className="save-btn save-btn--full"
              onClick={handleChangePassword}
              disabled={passwordSaving}
            >
              {passwordSaving ? <><span className="spinner-xs" /> Updating…</> : "Update Password"}
            </button>
          </div>
        </div>
      )}

      {/* ── Tab: Profile Photo ── */}
      {activeTab === "photo" && (
        <div className="profile-card-panel">
          <div className="panel-header">
            <h3 className="panel-title">Profile Photo</h3>
          </div>

          {photoMsg && (
            <div className={`panel-message ${photoMsg.type}`} role="alert">
              {photoMsg.type === "success" ? "✓" : "⚠"} {photoMsg.text}
            </div>
          )}

          <div className="photo-section">
            <div className="photo-preview-wrap">
              <div className="photo-preview">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Profile" className="photo-preview-img" />
                ) : (
                  <span className="photo-preview-initials">{getInitials()}</span>
                )}
                {photoUploading && (
                  <div className="photo-uploading-overlay">
                    <span className="spinner-lg" />
                  </div>
                )}
              </div>
            </div>

            <div className="photo-actions">
              <p className="photo-hint">
                Upload a clear photo. Max size: <strong>2MB</strong>. Supported: JPG, PNG, WebP.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handlePhotoChange}
                id="avatarInput"
              />

              <button
                className="save-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={photoUploading}
              >
                <CameraIcon /> {avatarPreview ? "Change Photo" : "Upload Photo"}
              </button>

              {avatarPreview && (
                <button
                  className="remove-photo-btn"
                  onClick={handleRemovePhoto}
                  disabled={photoUploading}
                >
                  Remove Photo
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Icons ── */
function PersonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
function MailIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}
function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
function ShieldIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
function BuildingIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="18" rx="2" />
      <line x1="9" y1="21" x2="9" y2="3" />
    </svg>
  );
}
function CameraIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}
function PencilIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}
function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function EyeOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

export default ProfilePage;
