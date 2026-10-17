import { Hazard, SubScores } from '@/types/ai';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { PieChartIcon, BarChart3, Target } from 'lucide-react';
import { motion } from 'motion/react';

interface ReportAnalyticsProps {
  hazards: Hazard[];
  subScores?: SubScores;
}

// Panel wrapper shared by all three charts — hairline border, mono label,
// no rounded card shell.
function Panel({ icon: Icon, title, children, className, contentClassName }: { icon: any; title: string; children: React.ReactNode, className?: string, contentClassName?: string }) {
  return (
    <div className={`bg-card flex flex-col ${className || ''}`}>
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
        <span className="field-tag text-muted-foreground">{title}</span>
      </div>
      <div className={`p-5 ${contentClassName || ''}`}>{children}</div>
    </div>
  );
}

export function ReportAnalytics({ hazards, subScores }: ReportAnalyticsProps) {
  const severityData = [
    { name: 'Critical', value: hazards.filter(h => h.severity === 'Critical').length, color: 'var(--destructive)' },
    { name: 'High', value: hazards.filter(h => h.severity === 'High').length, color: 'var(--warning)' },
    { name: 'Medium', value: hazards.filter(h => h.severity === 'Medium').length, color: 'var(--brand)' },
    { name: 'Low', value: hazards.filter(h => h.severity === 'Low').length, color: 'var(--muted-foreground)' },
  ].filter(d => d.value > 0);

  const categoryCount: Record<string, number> = {};
  hazards.forEach(h => { categoryCount[h.category] = (categoryCount[h.category] || 0) + 1; });
  const categoryData = Object.keys(categoryCount).map(key => ({ name: key, count: categoryCount[key] })).sort((a, b) => b.count - a.count).slice(0, 5);

  const radarData = subScores ? [
    { subject: 'Accessibility', score: subScores.accessibility },
    { subject: 'Mobility', score: subScores.mobility },
    { subject: 'Fire Safety', score: subScores.fireSafety },
    { subject: 'Lighting', score: subScores.lighting },
    { subject: 'Organization', score: subScores.organization },
    { subject: 'Fall Prevention', score: subScores.fallPrevention },
  ] : [];

  return (
    <div className="flex flex-col flex-1 gap-px bg-border border border-border h-full w-full">
      <Panel icon={PieChartIcon} title="Severity breakdown">
        <div className="h-[220px] w-full">
          {severityData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={severityData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={2} dataKey="value" stroke="var(--card)" strokeWidth={2}>
                  {severityData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: 4, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">No hazard data available</div>
          )}
        </div>
        {severityData.length > 0 && (
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2 justify-center">
            {severityData.map(d => (
              <span key={d.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="w-2 h-2" style={{ backgroundColor: d.color }} /> {d.name} ({d.value})
              </span>
            ))}
          </div>
        )}
      </Panel>

      <Panel icon={Target} title="Safety dimensions">
        <div className="h-[220px] w-full">
          {radarData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Score" dataKey="score" stroke="var(--brand)" fill="var(--brand)" fillOpacity={0.25} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: 4, fontSize: 12 }} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">No score data available</div>
          )}
        </div>
      </Panel>

      <Panel icon={BarChart3} title="Top hazard categories" className="flex-1" contentClassName="flex flex-col">
        <div className="space-y-4 py-1 min-h-[160px] flex flex-col justify-center flex-1">
          {categoryData.length > 0 ? categoryData.map((item, index) => {
            const maxCount = Math.max(...categoryData.map(d => d.count), 1);
            const percentage = (item.count / maxCount) * 100;
            return (
              <div key={item.name}>
                <div className="flex justify-between items-center text-sm mb-1.5">
                  <span className="font-medium text-foreground/90 truncate max-w-[75%]">{item.name}</span>
                  <span className="tabular text-muted-foreground text-xs">{item.count}</span>
                </div>
                <div className="h-1 w-full bg-muted overflow-hidden">
                  <motion.div initial={{ width: 0 }} whileInView={{ width: `${percentage}%` }} viewport={{ once: true }} transition={{ duration: 0.6, delay: index * 0.06 }} className="h-full bg-brand" />
                </div>
              </div>
            );
          }) : (
            <div className="flex items-center justify-center h-[160px] text-sm text-muted-foreground">No hazard data available</div>
          )}
        </div>
      </Panel>
    </div>
  );
}
