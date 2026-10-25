import sys

file_path = '/src/pages/ResourcesPage.tsx'

with open(file_path, 'r') as f:
    lines = f.readlines()

# We want to replace from the line starting with "  {/* Left Column:"
# down to the line before "  {/* Right Column:"

start_idx = -1
end_idx = -1

for i, line in enumerate(lines):
    if 'Left Column: Context panel, filters, and smart AI matching suggestions' in line:
        start_idx = i
    if 'Right Column: the map is the centerpiece' in line:
        end_idx = i
        break

if start_idx != -1 and end_idx != -1:
    new_sidebar = """  {/* Left Column: Context panel and search (Span 4) */}
  <div className="lg:col-span-4 space-y-8">
    <div className="space-y-6">
      {/* Primary Search */}
      <div className="space-y-3">
        <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/70 block">Discovery</label>
        <div className="relative group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 transition-colors group-focus-within:text-brand" />
          <Input 
            id="keyword-filter-bar"
            placeholder="Search specialties..." 
            className="pl-10 h-12 bg-muted/20 border-border/50 focus-visible:border-brand/50 focus-visible:ring-0 text-sm transition-all shadow-none rounded-none" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && searchQuery.trim()) {
                e.preventDefault();
                handleAISearch(searchQuery);
              }
            }}
          />
          {isAISearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-brand/60" />
            </div>
          )}
        </div>

        {/* AI Active Banner Integrated quietly */}
        <AnimatePresence>
          {aiCategorizedInfo && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="p-3 bg-brand/5 border border-brand/10 rounded-sm text-[11px] flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Sparkles className="w-3 h-3 text-brand shrink-0" />
                <span className="truncate text-muted-foreground">
                  Refining for <span className="text-foreground font-medium">{aiCategorizedInfo.category}</span>
                </span>
              </div>
              <button
                id="clear-ai-categorized-filter"
                onClick={() => {
                  setAiCategorizedInfo(null);
                  setSelectedCategory("All");
                  setSearchQuery("");
                }}
                className="p-1 text-muted-foreground hover:text-foreground transition-colors shrink-0"
              >
                <X className="w-3 h-3" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Location Search */}
      {activeTab === 'local' && (
        <div className="space-y-3">
          <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/70 block">Location</label>
          <div className="flex flex-col gap-2">
            <div className="relative group">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 transition-colors group-focus-within:text-brand" />
              <Input 
                id="search-address-input"
                placeholder="City or ZIP code" 
                className="pl-10 h-12 bg-muted/20 border-border/50 focus-visible:border-brand/50 focus-visible:ring-0 text-sm transition-all shadow-none rounded-none" 
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearchSubmit();
                  }
                }}
              />
            </div>
            <Button 
              id="submit-search-btn" 
              variant="outline" 
              onClick={handleSearchSubmit}
              disabled={isLoading}
              className="h-10 border-border/50 hover:bg-muted/30 text-xs font-semibold rounded-none"
            >
              Update Map
            </Button>
          </div>
        </div>
      )}

      {/* Contextual Note */}
      {latestScan && (
        <div className="pt-6 border-t border-border/50">
          <div className="flex gap-3">
            <div className="mt-0.5">
              <Sparkles className="w-3.5 h-3.5 text-brand/60" />
            </div>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Results are prioritized using your <span className="text-foreground font-medium">{latestScan.roomType}</span> assessment data to surface the most relevant local safety specialists.
            </p>
          </div>
        </div>
      )}
    </div>
  </div>

"""
    lines[start_idx:end_idx] = [new_sidebar]
    
    with open(file_path, 'w') as f:
        f.writelines(lines)
    print("Successfully updated ResourcesPage.tsx")
else:
    print(f"Failed to find indices: start={start_idx}, end={end_idx}")
    sys.exit(1)
