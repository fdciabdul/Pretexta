import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Terminal, UserPlus } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function RegisterPage({ onRegister, onSwitchToLogin }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    display_name: '',
    invite_code: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(`${API}/auth/register`, {
        username: formData.username,
        password: formData.password,
        email: formData.email || undefined,
        display_name: formData.display_name || undefined,
        invite_code: formData.invite_code || undefined,
      });
      localStorage.setItem('soceng_token', response.data.token);
      localStorage.setItem('soceng_user', JSON.stringify(response.data.user));
      toast.success('Account created successfully!');
      onRegister();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 grid-bg">
      <div className="glass-panel p-8 max-w-md w-full">
        <div className="mb-8 text-center space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <Terminal className="w-12 h-12 text-primary" />
            <h1 className="text-4xl font-bold glitch text-primary">Pretexta</h1>
          </div>
          <p className="text-muted-foreground font-mono text-sm">CREATE NEW AGENT PROFILE</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="font-mono uppercase text-xs">Username *</Label>
            <Input
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              className="font-mono"
              placeholder="agent_name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="font-mono uppercase text-xs">Display Name</Label>
            <Input
              value={formData.display_name}
              onChange={(e) => setFormData({...formData, display_name: e.target.value})}
              className="font-mono"
              placeholder="Your Name"
            />
          </div>

          <div className="space-y-2">
            <Label className="font-mono uppercase text-xs">Email</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="font-mono"
              placeholder="agent@example.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="font-mono uppercase text-xs">Password *</Label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="font-mono"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="font-mono uppercase text-xs">Confirm *</Label>
              <Input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                className="font-mono"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="font-mono uppercase text-xs">Team Invite Code (optional)</Label>
            <Input
              value={formData.invite_code}
              onChange={(e) => setFormData({...formData, invite_code: e.target.value})}
              className="font-mono"
              placeholder="XXXX-XXXX"
            />
          </div>

          <Button type="submit" className="w-full uppercase tracking-wider" disabled={loading}>
            <UserPlus className="w-4 h-4 mr-2" />
            {loading ? 'CREATING...' : 'CREATE ACCOUNT'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={onSwitchToLogin}
            className="text-xs text-muted-foreground hover:text-primary font-mono transition-colors"
          >
            Already have an account? LOGIN
          </button>
        </div>
      </div>
    </div>
  );
}
