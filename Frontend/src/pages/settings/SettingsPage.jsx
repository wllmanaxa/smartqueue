import { useState } from 'react';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { usersApi } from '../../api/services';
import { getApiBaseUrl } from '../../api/config';
import { getApiError } from '../../api/helpers';

export default function SettingsPage() {
  const { user } = useAuth();
  const { dark, toggle } = useTheme();
  const { toast } = useToast();
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
  const [saving, setSaving] = useState(false);

  const changePassword = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      await usersApi.changePassword(user.id, passwords);
      toast('Password updated', 'success');
      setPasswords({ currentPassword: '', newPassword: '' });
    } catch (e) {
      toast(getApiError(e), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Profile, security, and appearance</p>
      </div>

      <Card>
        <h3 className="mb-4 font-semibold">Profile</h3>
        <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
          <p>
            <span className="font-medium text-slate-800 dark:text-slate-200">Username:</span> {user?.userName}
          </p>
          <p>
            <span className="font-medium text-slate-800 dark:text-slate-200">Email:</span> {user?.email || '—'}
          </p>
          <p>
            <span className="font-medium text-slate-800 dark:text-slate-200">Role:</span> {user?.role}
          </p>
        </div>
      </Card>

      <Card>
        <h3 className="mb-4 font-semibold">Theme</h3>
        <Button variant="outline" onClick={toggle}>
          Switch to {dark ? 'light' : 'dark'} mode
        </Button>
      </Card>

      <Card>
        <h3 className="mb-4 font-semibold">Change password</h3>
        <div className="space-y-4">
          <Input
            label="Current password"
            type="password"
            value={passwords.currentPassword}
            onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
          />
          <Input
            label="New password"
            type="password"
            value={passwords.newPassword}
            onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
          />
          <Button loading={saving} onClick={changePassword}>
            Update password
          </Button>
        </div>
      </Card>

      <Card>
        <h3 className="mb-4 font-semibold">System</h3>
        <p className="text-sm text-slate-500">
          API: {getApiBaseUrl() || '(not configured)'}
        </p>
      </Card>
    </div>
  );
}
