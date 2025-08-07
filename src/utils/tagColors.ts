// Tag color mapping for activity categories
export const getTagColor = (tag: string): string => {
  const tagColorMap: Record<string, string> = {
    // Workshop related
    'workshop': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'education': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'masterclass': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    
    // Screening related
    'screening': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    'documentary': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    'short-film': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    
    // Ceremony related
    'ceremony': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    'official': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    'opening': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    'closing': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    
    // Panel/Discussion related
    'panel': 'bg-green-500/20 text-green-400 border-green-500/30',
    'discussion': 'bg-green-500/20 text-green-400 border-green-500/30',
    'talk': 'bg-green-500/20 text-green-400 border-green-500/30',
    'seminar': 'bg-green-500/20 text-green-400 border-green-500/30',
    
    // Networking related
    'networking': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    'social': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    'party': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    'mixer': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    
    // Exhibition related
    'exhibition': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    'showcase': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    'display': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    
    // Competition related
    'competition': 'bg-red-500/20 text-red-400 border-red-500/30',
    'contest': 'bg-red-500/20 text-red-400 border-red-500/30',
    'award': 'bg-red-500/20 text-red-400 border-red-500/30',
    
    // Special categories
    'free': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    'paid': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    'vip': 'bg-violet-500/20 text-violet-400 border-violet-500/30',
    'premium': 'bg-violet-500/20 text-violet-400 border-violet-500/30',
    
    // Format related
    'online': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    'hybrid': 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    'live': 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    
    // Duration related
    'full-day': 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    'half-day': 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    'evening': 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
  };

  // Return specific color if found, otherwise default to the original FCB283 color
  return tagColorMap[tag.toLowerCase()] || 'bg-[#FCB283]/20 text-[#FCB283] border-[#FCB283]/30';
};

// Get all available tag categories with their colors (for reference)
export const getTagCategories = () => {
  return {
    workshop: { color: 'blue', tags: ['workshop', 'education', 'masterclass'] },
    screening: { color: 'purple', tags: ['screening', 'documentary', 'short-film'] },
    ceremony: { color: 'yellow', tags: ['ceremony', 'official', 'opening', 'closing'] },
    panel: { color: 'green', tags: ['panel', 'discussion', 'talk', 'seminar'] },
    networking: { color: 'pink', tags: ['networking', 'social', 'party', 'mixer'] },
    exhibition: { color: 'orange', tags: ['exhibition', 'showcase', 'display'] },
    competition: { color: 'red', tags: ['competition', 'contest', 'award'] },
    special: { color: 'various', tags: ['free', 'paid', 'vip', 'premium'] },
    format: { color: 'various', tags: ['online', 'hybrid', 'live'] },
    duration: { color: 'gray', tags: ['full-day', 'half-day', 'evening'] }
  };
};
