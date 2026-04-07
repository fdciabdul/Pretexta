import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Pencil, Plus, Trash2, Save, Upload, Eye, ArrowRight, MessageSquare } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CHANNELS = ['email_inbox', 'chat', 'telephone', 'sms', 'social_media', 'narrator'];
const CIALDINI = ['reciprocity', 'scarcity', 'authority', 'commitment', 'liking', 'social_proof'];
const NODE_TYPES = ['message', 'question', 'end'];

export default function ScenarioBuilderPage() {
  const [templates, setTemplates] = useState([]);
  const [current, setCurrent] = useState(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadTemplates(); }, []);

  const loadTemplates = async () => {
    try {
      const token = localStorage.getItem('soceng_token');
      const response = await axios.get(`${API}/scenario-builder/templates`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTemplates(response.data);
    } catch (error) {
      console.error('Failed to load templates', error);
    } finally {
      setLoading(false);
    }
  };

  const createNew = async () => {
    try {
      const token = localStorage.getItem('soceng_token');
      const response = await axios.post(`${API}/scenario-builder/templates`, {
        title: 'New Scenario',
        description: '',
        nodes: [
          { id: 'start', type: 'message', channel: 'email_inbox', content_en: { text: '', subject: '', from: '', body: '' } },
          { id: 'end_success', type: 'end', content_en: { text: 'You successfully defended against the attack!' } },
        ]
      }, { headers: { Authorization: `Bearer ${token}` } });

      toast.success('Template created');
      loadTemplates();
      // Select the new template
      setCurrent({
        id: response.data.id,
        title: 'New Scenario',
        description: '',
        difficulty: 'medium',
        cialdini_categories: [],
        channel: 'email_inbox',
        nodes: [
          { id: 'start', type: 'message', channel: 'email_inbox', content_en: { text: '', subject: '', from: '', body: '' } },
          { id: 'end_success', type: 'end', content_en: { text: 'You successfully defended against the attack!' } },
        ]
      });
      setEditing(true);
    } catch (error) {
      toast.error('Failed to create template');
    }
  };

  const saveTemplate = async () => {
    if (!current) return;
    try {
      const token = localStorage.getItem('soceng_token');
      await axios.put(`${API}/scenario-builder/templates/${current.id}`, current, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Saved!');
      loadTemplates();
    } catch (error) {
      toast.error('Save failed');
    }
  };

  const publishTemplate = async () => {
    if (!current) return;
    if (!window.confirm('Publish this scenario? It will become playable by all users.')) return;
    try {
      const token = localStorage.getItem('soceng_token');
      await axios.post(`${API}/scenario-builder/templates/${current.id}/publish`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Scenario published!');
      loadTemplates();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Publish failed');
    }
  };

  const addNode = () => {
    if (!current) return;
    const newNode = {
      id: `node_${Date.now()}`,
      type: 'question',
      channel: current.channel || 'email_inbox',
      content_en: { text: 'New question...', explanation: '' },
      options: [
        { text: 'Option A', next: 'end_success', score_impact: 10 },
        { text: 'Option B', next: 'end_success', score_impact: -10 },
      ]
    };
    setCurrent({ ...current, nodes: [...current.nodes, newNode] });
  };

  const updateNode = (index, updates) => {
    const nodes = [...current.nodes];
    nodes[index] = { ...nodes[index], ...updates };
    setCurrent({ ...current, nodes });
  };

  const removeNode = (index) => {
    const nodes = current.nodes.filter((_, i) => i !== index);
    setCurrent({ ...current, nodes });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-primary/20 pb-6">
        <div>
          <h1 className="text-3xl font-bold font-mono uppercase tracking-widest text-primary flex items-center gap-3">
            <Pencil className="w-8 h-8" /> SCENARIO BUILDER
          </h1>
          <p className="text-muted-foreground font-mono text-sm mt-1">&gt; Create custom social engineering scenarios</p>
        </div>
        <Button onClick={createNew}>
          <Plus className="w-4 h-4 mr-2" /> NEW SCENARIO
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Templates List */}
        <div className="space-y-3">
          <h3 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">MY SCENARIOS</h3>
          {templates.map((t) => (
            <Card
              key={t.id}
              className={`glass-panel p-3 cursor-pointer transition-all ${current?.id === t.id ? 'border-primary/50 bg-primary/5' : 'hover:bg-white/5'}`}
              onClick={() => { setCurrent(t); setEditing(true); }}
            >
              <h4 className="font-mono font-bold text-sm">{t.title}</h4>
              <div className="flex gap-2 mt-1">
                <span className="text-[10px] text-muted-foreground">{t.nodes?.length || 0} nodes</span>
                <span className={`text-[10px] ${t.is_published ? 'text-green-400' : 'text-yellow-400'}`}>
                  {t.is_published ? 'PUBLISHED' : 'DRAFT'}
                </span>
              </div>
            </Card>
          ))}
          {templates.length === 0 && !loading && (
            <div className="text-center py-8 text-muted-foreground font-mono text-sm">
              No scenarios yet. Create one!
            </div>
          )}
        </div>

        {/* Editor */}
        <div className="lg:col-span-2">
          {current && editing ? (
            <div className="glass-panel p-6 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-mono text-primary font-bold uppercase">EDITING: {current.title}</h3>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={saveTemplate}>
                    <Save className="w-3 h-3 mr-1" /> SAVE
                  </Button>
                  <Button size="sm" onClick={publishTemplate}>
                    <Upload className="w-3 h-3 mr-1" /> PUBLISH
                  </Button>
                </div>
              </div>

              {/* Meta */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-mono text-xs">Title</Label>
                  <Input value={current.title} onChange={(e) => setCurrent({...current, title: e.target.value})} className="font-mono" />
                </div>
                <div className="space-y-2">
                  <Label className="font-mono text-xs">Difficulty</Label>
                  <Select value={current.difficulty} onValueChange={(v) => setCurrent({...current, difficulty: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="font-mono text-xs">Description</Label>
                <textarea
                  value={current.description}
                  onChange={(e) => setCurrent({...current, description: e.target.value})}
                  className="w-full bg-black/40 border border-primary/30 p-3 text-sm font-mono text-foreground min-h-[60px] outline-none focus:border-primary"
                />
              </div>

              {/* Cialdini Categories */}
              <div className="space-y-2">
                <Label className="font-mono text-xs">Cialdini Categories</Label>
                <div className="flex flex-wrap gap-2">
                  {CIALDINI.map(cat => (
                    <button
                      key={cat}
                      onClick={() => {
                        const cats = current.cialdini_categories || [];
                        setCurrent({
                          ...current,
                          cialdini_categories: cats.includes(cat) ? cats.filter(c => c !== cat) : [...cats, cat]
                        });
                      }}
                      className={`px-3 py-1 text-xs font-mono border transition-all ${
                        (current.cialdini_categories || []).includes(cat)
                          ? 'border-primary bg-primary/20 text-primary'
                          : 'border-muted text-muted-foreground hover:border-primary/50'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nodes */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="font-mono text-xs">SCENARIO NODES</Label>
                  <Button size="sm" variant="outline" onClick={addNode}>
                    <Plus className="w-3 h-3 mr-1" /> ADD NODE
                  </Button>
                </div>

                {current.nodes?.map((node, idx) => (
                  <Card key={node.id || idx} className="p-4 bg-black/30 border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-primary" />
                        <span className="font-mono text-xs text-primary">{node.id}</span>
                        <span className="text-[10px] text-muted-foreground border border-muted px-1">{node.type}</span>
                      </div>
                      {idx >= 2 && (
                        <button onClick={() => removeNode(idx)} className="text-destructive hover:text-destructive/80">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Select value={node.type} onValueChange={(v) => updateNode(idx, { type: v })}>
                        <SelectTrigger className="text-xs"><SelectValue placeholder="Type" /></SelectTrigger>
                        <SelectContent>
                          {NODE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Select value={node.channel || 'email_inbox'} onValueChange={(v) => updateNode(idx, { channel: v })}>
                        <SelectTrigger className="text-xs"><SelectValue placeholder="Channel" /></SelectTrigger>
                        <SelectContent>
                          {CHANNELS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    <textarea
                      value={node.content_en?.text || node.content_en?.body || ''}
                      onChange={(e) => updateNode(idx, { content_en: { ...node.content_en, text: e.target.value } })}
                      placeholder="Node content..."
                      className="w-full bg-black/40 border border-white/10 p-2 text-xs font-mono text-foreground min-h-[40px] outline-none focus:border-primary"
                    />
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-primary/30 border border-dashed border-primary/30 bg-primary/5">
              <div className="text-center">
                <Pencil className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="font-mono text-xs uppercase">SELECT OR CREATE A SCENARIO</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
