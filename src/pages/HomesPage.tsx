import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, Home, MapPin, Search } from "lucide-react";
import { useHomeStore } from "@/stores/useHomeStore";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export function HomesPage() {
  const { homes, hiddenHomes } = useHomeStore();
  const [searchQuery, setSearchQuery] = useState("");

  const visibleHomes = homes.filter(h => !hiddenHomes.includes(h.id));
  const filteredHomes = visibleHomes.filter(h => 
    h.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    h.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.nickname?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Homes</h1>
          <p className="text-muted-foreground mt-1">Manage the properties you are monitoring.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search homes..." 
              className="pl-9 bg-background" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button asChild className="shrink-0">
            <Link to="/homes/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Home
            </Link>
          </Button>
        </div>
      </div>

      {visibleHomes.length === 0 ? (
        <div className="border-dashed border-2 rounded-2xl flex flex-col items-center justify-center p-12 text-center text-muted-foreground min-h-[400px]">
          <div className="h-20 w-20 bg-primary/5 rounded-full flex items-center justify-center mb-6">
            <Home className="h-10 w-10 text-primary/40" />
          </div>
          <h2 className="text-2xl font-semibold text-foreground mb-2">No digital home created</h2>
          <p className="max-w-md mx-auto mb-8">
            Start mapping your home to prepare for AI safety analysis. You can add multiple properties to monitor.
          </p>
          <Button size="lg" asChild>
            <Link to="/homes/new">
              <Plus className="mr-2 h-5 w-5" />
              Create Your First Home
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHomes.map(home => {
            const progress = home.rooms.length > 0 ? Math.min(100, home.rooms.length * 20) : 0;
            return (
              <Card key={home.id} className="overflow-hidden border-primary/20 shadow-sm transition-all hover:shadow-md relative flex flex-col">
                {home.coverImage && (
                  <div className="h-32 w-full overflow-hidden relative bg-muted">
                    <img src={home.coverImage} alt={home.name} className="object-cover w-full h-full" />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
                  </div>
                )}
                {!home.coverImage && <div className="absolute top-0 left-0 w-1 h-full bg-primary" />}
                <CardHeader className="pb-4 relative">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="text-xl flex items-center gap-2">
                        {home.nickname || home.name}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{home.address || "No address provided"}</span>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 flex-1">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-muted-foreground">Setup Progress</span>
                      <span className="font-bold">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Rooms</p>
                      <p className="text-2xl font-semibold">{home.rooms.length}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Status</p>
                      <Badge variant="outline" className="mt-1">
                        {home.rooms.length > 0 ? 'Mapping' : 'New'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/30 border-t px-6 py-4 flex gap-3">
                  <Button variant="default" className="w-full" asChild>
                    <Link to={`/homes/${home.id}`}>Manage</Link>
                  </Button>
                </CardFooter>
              </Card>
            );
          })}

          <Card className="border-dashed border-2 flex flex-col items-center justify-center p-8 text-center text-muted-foreground hover:bg-muted/50 transition-colors min-h-[300px]">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Plus className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground text-lg mb-2">Add Another Property</h3>
            <p className="max-w-[250px] mx-auto text-sm mb-6">Set up a new home profile to begin tracking safety and accessibility.</p>
            <Button variant="outline" asChild>
              <Link to="/homes/new">Create Home</Link>
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}
