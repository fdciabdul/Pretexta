import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Flag, Play, CheckCircle2, Lock, ChevronRight, Trophy } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadCampaigns(); }, []);

  const loadCampaigns = async () => {
    try {
      const token = localStorage.getItem('soceng_token');
      const response = await axios.get(`${API}/campaigns`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCampaigns(response.data);
    } catch (error) {
      console.error('Failed to load campaigns', error);
    } finally {
      setLoading(false);
    }
  };

  const selectCampaign = async (campaign) => {
    setSelectedCampaign(campaign);
    try {
      const token = localStorage.getItem('soceng_token');
      const response = await axios.get(`${API}/campaigns/${campaign.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProgress(response.data.progress);
    } catch (error) {
      console.error('Failed to load campaign details', error);
    }
  };

  const startCampaign = async () => {
    if (!selectedCampaign) return;
    try {
      const token = localStorage.getItem('soceng_token');
      await axios.post(`${API}/campaigns/${selectedCampaign.id}/start`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Campaign started!');
      selectCampaign(selectedCampaign);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to start campaign');
    }
  };

  const getDifficultyColor = (diff) => {
    const colors = { easy: 'text-green-400 border-green-400/30', medium: 'text-yellow-400 border-yellow-400/30', hard: 'text-red-400 border-red-400/30' };
    return colors[diff] || colors.medium;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="border-b border-primary/20 pb-6">
        <h1 className="text-3xl font-bold font-mono uppercase tracking-widest text-primary flex items-center gap-3">
          <Flag className="w-8 h-8" /> CAMPAIGNS
        </h1>
        <p className="text-muted-foreground font-mono text-sm mt-1">&gt; Multi-stage attack simulations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Campaign List */}
        <div className="lg:col-span-2 space-y-4">
          {campaigns.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-primary/30">
              <Flag className="w-12 h-12 text-primary/30 mx-auto mb-3" />
              <p className="text-muted-foreground font-mono">No campaigns available yet</p>
            </div>
          ) : (
            campaigns.map((campaign) => (
              <Card
                key={campaign.id}
                className={`glass-panel p-5 cursor-pointer transition-all border-l-[3px] ${
                  selectedCampaign?.id === campaign.id
                    ? 'border-l-primary bg-primary/5'
                    : 'border-l-transparent hover:border-l-primary/50 hover:bg-white/5'
                }`}
                onClick={() => selectCampaign(campaign)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-mono font-bold text-lg">{campaign.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{campaign.description}</p>
                    <div className="flex gap-2 mt-3">
                      <Badge variant="outline" className={`text-[10px] ${getDifficultyColor(campaign.difficulty)}`}>
                        {campaign.difficulty?.toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {campaign.stages?.length || 0} STAGES
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        ~{campaign.estimated_time}min
                      </Badge>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Campaign Detail */}
        <div>
          {selectedCampaign ? (
            <div className="glass-panel border border-primary/30 sticky top-6">
              <div className="p-6 border-b border-primary/20">
                <h2 className="text-xl font-bold font-mono text-primary">{selectedCampaign.title}</h2>
                <p className="text-sm text-muted-foreground mt-2">{selectedCampaign.description}</p>

                {!progress ? (
                  <Button onClick={startCampaign} className="w-full mt-4">
                    <Play className="w-4 h-4 mr-2" /> START CAMPAIGN
                  </Button>
                ) : progress.status === 'completed' ? (
                  <div className="mt-4 p-3 border border-primary/30 bg-primary/5 text-center">
                    <Trophy className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                    <p className="font-mono text-primary font-bold">COMPLETED</p>
                    <p className="text-sm text-muted-foreground">Score: {progress.overall_score}%</p>
                  </div>
                ) : (
                  <div className="mt-4 p-3 border border-yellow-500/30 bg-yellow-500/5 text-center">
                    <p className="font-mono text-yellow-400 text-sm">IN PROGRESS - Stage {(progress.current_stage || 0) + 1}</p>
                  </div>
                )}
              </div>

              {/* Stages */}
              <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
                <h3 className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-3">ATTACK CHAIN</h3>
                {(selectedCampaign.stages || []).map((stage, idx) => {
                  const isCompleted = progress && idx < (progress.current_stage || 0);
                  const isCurrent = progress && idx === (progress.current_stage || 0) && progress.status === 'in_progress';
                  const isLocked = !progress || idx > (progress.current_stage || 0);

                  return (
                    <div key={stage.stage_id || idx} className={`p-3 border-l-2 ${isCompleted ? 'border-l-green-500 bg-green-500/5' : isCurrent ? 'border-l-yellow-500 bg-yellow-500/5' : 'border-l-muted bg-muted/5'}`}>
                      <div className="flex items-center gap-2">
                        {isCompleted ? <CheckCircle2 className="w-4 h-4 text-green-500" /> :
                         isCurrent ? <Play className="w-4 h-4 text-yellow-500" /> :
                         <Lock className="w-4 h-4 text-muted-foreground" />}
                        <span className={`font-mono text-sm ${isCompleted ? 'text-green-400' : isCurrent ? 'text-yellow-400' : 'text-muted-foreground'}`}>
                          Stage {idx + 1}: {stage.title || stage.channel}
                        </span>
                      </div>
                      {stage.description && (
                        <p className="text-xs text-muted-foreground mt-1 ml-6">{stage.description}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-primary/30 border border-dashed border-primary/30 bg-primary/5">
              <div className="text-center">
                <Flag className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="font-mono text-xs uppercase">SELECT A CAMPAIGN</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
