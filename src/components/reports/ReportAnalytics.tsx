import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Hazard, SubScores } from '@/types/ai';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { PieChartIcon, BarChart3, Target } from 'lucide-react';

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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
            <BarChart3 className="h-4 w-4" /> Top Hazard Categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] w-full">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
                  <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis dataKey="name" type="category" width={120} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--foreground))' }} />
                  <Tooltip 
                    cursor={{ fill: 'hsl(var(--muted))' }}
                    contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                No hazard data available
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
