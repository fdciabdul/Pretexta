import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BarChart3, TrendingUp, Target, Brain, PieChart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar, PieChart as RePieChart, Pie, Cell } from 'recharts';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const COLORS = ['#90EE90', '#3B82F6', '#A855F7', '#EC4899', '#F59E0B', '#06B6D4'];

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const token = localStorage.getItem('soceng_token');
      const response = await axios.get(`${API}/analytics/personal`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(response.data);
    } catch (error) {
      console.error('Failed to load analytics', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="text-primary font-mono animate-pulse">LOADING_DATA...</div></div>;
  if (!data || data.total_simulations === 0) {
    return (
      <div className="text-center py-24">
        <BarChart3 className="w-16 h-16 text-primary/30 mx-auto mb-4" />
        <h2 className="text-xl font-mono text-primary mb-2">NO DATA YET</h2>
        <p className="text-muted-foreground font-mono text-sm">Complete some simulations to see your analytics</p>
      </div>
    );
  }

  // Prepare radar chart data
  const radarData = Object.entries(data.cialdini_radar || {}).map(([key, value]) => ({
    category: key.charAt(0).toUpperCase() + key.slice(1),
    score: value,
    fullMark: 100,
  }));

  // Prepare type distribution for pie chart
  const pieData = Object.entries(data.type_distribution || {}).map(([key, value]) => ({
    name: key.replace('_', ' '),
    value,
  }));

  // Prepare difficulty bar chart
  const difficultyData = Object.entries(data.difficulty_breakdown || {}).map(([key, val]) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    avg_score: val.avg_score,
    count: val.count,
  }));

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="border-b border-primary/20 pb-6">
        <h1 className="text-3xl font-bold font-mono uppercase tracking-widest text-primary flex items-center gap-3">
          <BarChart3 className="w-8 h-8" /> ANALYTICS
        </h1>
        <p className="text-muted-foreground font-mono text-sm mt-1">&gt; Performance intelligence dashboard</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-panel">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Total Missions</p>
            <p className="text-3xl font-bold font-mono text-primary">{data.total_simulations}</p>
          </CardContent>
        </Card>
        <Card className="glass-panel">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Avg Score</p>
            <p className="text-3xl font-bold font-mono text-blue-400">{data.avg_score}%</p>
          </CardContent>
        </Card>
        <Card className="glass-panel">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Improvement</p>
            <p className={`text-3xl font-bold font-mono flex items-center justify-center gap-1 ${data.improvement_rate >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              <TrendingUp className="w-5 h-5" /> {data.improvement_rate > 0 ? '+' : ''}{data.improvement_rate}%
            </p>
          </CardContent>
        </Card>
        <Card className="glass-panel">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Categories</p>
            <p className="text-3xl font-bold font-mono text-purple-400">{Object.keys(data.cialdini_radar || {}).length}/6</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Cialdini Radar */}
        {radarData.length > 0 && (
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="font-mono text-sm uppercase tracking-widest flex items-center gap-2">
                <Brain className="w-4 h-4 text-primary" /> Cialdini Defense Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#333" />
                  <PolarAngleAxis dataKey="category" tick={{ fill: '#888', fontSize: 11, fontFamily: 'monospace' }} />
                  <Radar name="Score" dataKey="score" stroke="#90EE90" fill="#90EE90" fillOpacity={0.2} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Score Over Time */}
        {data.score_over_time?.length > 0 && (
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="font-mono text-sm uppercase tracking-widest flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" /> Score Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.score_over_time}>
                  <XAxis dataKey="date" tick={{ fill: '#888', fontSize: 9 }} tickFormatter={(v) => new Date(v).toLocaleDateString()} />
                  <YAxis domain={[0, 100]} tick={{ fill: '#888', fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333', fontFamily: 'monospace', fontSize: 11 }} />
                  <Line type="monotone" dataKey="score" stroke="#90EE90" strokeWidth={2} dot={{ fill: '#90EE90', r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Difficulty Breakdown */}
        {difficultyData.length > 0 && (
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="font-mono text-sm uppercase tracking-widest flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" /> Performance by Difficulty
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={difficultyData}>
                  <XAxis dataKey="name" tick={{ fill: '#888', fontSize: 11, fontFamily: 'monospace' }} />
                  <YAxis domain={[0, 100]} tick={{ fill: '#888', fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333', fontFamily: 'monospace', fontSize: 11 }} />
                  <Bar dataKey="avg_score" fill="#90EE90" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Type Distribution */}
        {pieData.length > 0 && (
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="font-mono text-sm uppercase tracking-widest flex items-center gap-2">
                <PieChart className="w-4 h-4 text-primary" /> Simulation Types
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={250}>
                <RePieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {pieData.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333', fontFamily: 'monospace', fontSize: 11 }} />
                </RePieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
