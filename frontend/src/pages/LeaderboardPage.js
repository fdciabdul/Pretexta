import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Trophy, Medal, Flame, Star, ChevronUp, Users } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [myRank, setMyRank] = useState(null);
  const [badges, setBadges] = useState([]);
  const [activeTab, setActiveTab] = useState('rankings');
  const [scope, setScope] = useState('global');
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, [scope]);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('soceng_token');
      const headers = { Authorization: `Bearer ${token}` };
      const [lbRes, rankRes, badgeRes] = await Promise.all([
        axios.get(`${API}/leaderboard?scope=${scope}`, { headers }),
        axios.get(`${API}/leaderboard/me`, { headers }),
        axios.get(`${API}/leaderboard/badges`, { headers }),
      ]);
      setLeaderboard(lbRes.data);
      setMyRank(rankRes.data);
      setBadges(badgeRes.data);
    } catch (error) {
      console.error('Failed to load leaderboard', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-300" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-amber-600" />;
    return <span className="text-sm font-mono text-muted-foreground w-6 text-center">#{rank}</span>;
  };

  const xpProgress = myRank?.xp_progress || {};

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-primary/20 pb-6">
        <div>
          <h1 className="text-3xl font-bold font-mono uppercase tracking-widest text-primary flex items-center gap-3">
            <Trophy className="w-8 h-8" /> LEADERBOARD
          </h1>
          <p className="text-muted-foreground font-mono text-sm mt-1">&gt; Agent rankings and achievements</p>
        </div>
        <div className="flex gap-2">
          <Button variant={scope === 'global' ? 'default' : 'outline'} size="sm" onClick={() => setScope('global')} className="font-mono text-xs">
            GLOBAL
          </Button>
          <Button variant={scope === 'organization' ? 'default' : 'outline'} size="sm" onClick={() => setScope('organization')} className="font-mono text-xs">
            <Users className="w-3 h-3 mr-1" /> TEAM
          </Button>
        </div>
      </div>

      {/* My Stats Card */}
      {myRank && (
        <Card className="glass-panel p-6 border-primary/30">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            <div className="text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Rank</p>
              <p className="text-3xl font-bold font-mono text-primary">#{myRank.rank}</p>
              <p className="text-[10px] text-muted-foreground">of {myRank.total_users}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Level</p>
              <p className="text-3xl font-bold font-mono text-yellow-400">{xpProgress.level || 1}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">XP</p>
              <p className="text-3xl font-bold font-mono text-blue-400">{xpProgress.current_xp || 0}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Streak</p>
              <p className="text-3xl font-bold font-mono text-orange-400 flex items-center justify-center gap-1">
                <Flame className="w-5 h-5" /> {myRank.streak_days}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Missions</p>
              <p className="text-3xl font-bold font-mono">{myRank.simulations_completed}</p>
            </div>
          </div>
          {/* XP Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-[10px] font-mono text-muted-foreground mb-1">
              <span>Level {xpProgress.level}</span>
              <span>{xpProgress.progress || 0}%</span>
              <span>Level {(xpProgress.level || 1) + 1}</span>
            </div>
            <div className="h-2 bg-black/50 border border-primary/20 overflow-hidden">
              <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${xpProgress.progress || 0}%` }} />
            </div>
          </div>
        </Card>
      )}

      <div className="flex gap-2 mb-4">
        {['rankings', 'badges'].map(tab => (
          <Button key={tab} variant={activeTab === tab ? 'default' : 'ghost'} size="sm" onClick={() => setActiveTab(tab)} className="font-mono text-xs uppercase">
            {tab}
          </Button>
        ))}
      </div>

      {activeTab === 'rankings' && (
        <div className="space-y-2">
          {leaderboard.map((entry) => (
            <div key={entry.user_id} className={`flex items-center justify-between p-4 glass-panel transition-all ${entry.is_current_user ? 'border border-primary/50 bg-primary/5' : 'hover:bg-white/5'}`}>
              <div className="flex items-center gap-4">
                {getRankIcon(entry.rank)}
                <div>
                  <p className={`font-mono font-bold text-sm ${entry.is_current_user ? 'text-primary' : ''}`}>
                    {entry.display_name || entry.username}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    Level {entry.level} | {entry.badges_count} badges | {entry.streak_days}d streak
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-mono font-bold text-lg">{entry.xp} <span className="text-xs text-muted-foreground">XP</span></p>
                <p className="text-[10px] text-muted-foreground">{entry.simulations_completed} missions</p>
              </div>
            </div>
          ))}
          {leaderboard.length === 0 && (
            <div className="text-center py-12 text-muted-foreground font-mono">NO_AGENTS_RANKED</div>
          )}
        </div>
      )}

      {activeTab === 'badges' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {badges.map((badge) => (
            <Card key={badge.id} className={`glass-panel p-4 transition-all ${badge.earned ? 'border-primary/50 bg-primary/5' : 'opacity-50 grayscale'}`}>
              <div className="flex items-start gap-3">
                <div className={`p-3 rounded-none border ${badge.earned ? 'border-primary bg-primary/10 text-primary' : 'border-muted bg-muted/10 text-muted-foreground'}`}>
                  <Star className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-mono font-bold text-sm">{badge.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{badge.description}</p>
                  <p className="text-[10px] text-primary/70 mt-2 font-mono">+{badge.xp_reward} XP</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
