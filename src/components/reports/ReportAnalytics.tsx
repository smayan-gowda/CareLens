import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Hazard, SubScores } from '@/types/ai';
import { 
  PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { PieChartIcon, BarChart3, Target } from 'lucide-react';
import { motion } from 'motion/react';

interface ReportAnalyticsProps {
  hazards: Hazard[];
  subScores?: SubScores;
}

export function ReportAnalytics({ hazards, subScores }: ReportAnalyticsProps) {
  // Aggregate data for severity distribution
  const severityData = [
    { name: 'Critical', value: hazards.filter(h => h.severity === 'Critical').length, color: '#ef4444' },
    { name: 'High', value: hazards.filter(h => h.severity === 'High').length, color: '#f97316' },
    { name: 'Medium', value: hazards.filter(h => h.severity === 'Medium').length, color: '#f59e0b' },
    { name: 'Low', value: hazards.filter(h => h.severity === 'Low').length, color: '#3b82f6' },
  ].filter(d => d.value > 0);

  // Aggregate data for category distribution
  const categoryCount: Record<string, number> = {};
  hazards.forEach(h => {
    categoryCount[h.category] = (categoryCount[h.category] || 0) + 1;
  });

  const categoryData = Object.keys(categoryCount).map(key => ({
    name: key,
    count: categoryCount[key]
  })).sort((a, b) => b.count - a.count).slice(0, 5); // top 5

  const radarData = subScores ? [
    { subject: 'Accessibility', score: subScores.accessibility, fullMark: 100 },
    { subject: 'Mobility', score: subScores.mobility, fullMark: 100 },
    { subject: 'Fire Safety', score: subScores.fireSafety, fullMark: 100 },
    { subject: 'Lighting', score: subScores.lighting, fullMark: 100 },
    { subject: 'Organization', score: subScores.organization, fullMark: 100 },
    { subject: 'Fall Prevention', score: subScores.fallPrevention, fullMark: 100 },
  ] : [];

  return (
    <div className="space-y-6">
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
            <PieChartIcon className="h-4 w-4" /> Severity Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] w-full">
            {severityData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={severityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {severityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                No hazard data available
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
            <Target className="h-4 w-4" /> Safety Dimensions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] w-full">
            {radarData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="hsl(var(--muted-foreground)/0.3)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Score" dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.4} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                No score data available
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
            <BarChart3 className="h-4 w-4" /> Top Hazard Categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 py-2 min-h-[210px] flex flex-col justify-center">
            {categoryData.length > 0 ? (
              categoryData.map((item, index) => {
                const maxCount = Math.max(...categoryData.map(d => d.count), 1);
                const percentage = (item.count / maxCount) * 100;
                return (
                  <div key={item.name} className="space-y-1.5 group">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-semibold text-foreground/90 truncate max-w-[80%]">{item.name}</span>
                      <span className="text-muted-foreground text-xs font-medium bg-muted/60 px-2 py-0.5 rounded-full transition-colors group-hover:bg-muted">
                        {item.count} {item.count === 1 ? 'hazard' : 'hazards'}
                      </span>
                    </div>
                    <div className="h-2.5 w-full bg-muted/50 rounded-full overflow-hidden border border-border/10">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.6, ease: "easeOut", delay: index * 0.08 }}
                        className="h-full bg-primary rounded-full shadow-xs"
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex items-center justify-center h-[180px] text-sm text-muted-foreground">
                No hazard data available
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
