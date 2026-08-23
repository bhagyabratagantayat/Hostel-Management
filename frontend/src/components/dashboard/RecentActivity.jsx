import React, { useEffect, useState } from 'react';
import { getActivities } from '../../api/activity';

export const RecentActivity = ({ limit = 5, onNavigateAll }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const data = await getActivities({ page: 1, limit });
        setActivities(data.activities || data.records || []);
      } catch (err) {
        console.error('Failed to load recent activity widget:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecent();
  }, [limit]);

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl">
      <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-800">
        <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
          Recent System Activity
        </h3>
        {onNavigateAll && (
          <button
            onClick={onNavigateAll}
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            View All &rarr;
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-6 text-center text-xs text-slate-500">Loading activities...</div>
      ) : activities.length === 0 ? (
        <div className="py-6 text-center text-xs text-slate-500">No recent activity recorded</div>
      ) : (
        <div className="space-y-3">
          {activities.map((item) => (
            <div
              key={item.id}
              className="p-3 bg-slate-800/40 rounded-xl border border-slate-800/60 hover:bg-slate-800/80 transition-all text-xs"
            >
              <div className="flex justify-between items-start gap-2 mb-1">
                <span className="font-semibold text-slate-200 truncate">{item.description}</span>
                <span className="text-[10px] text-slate-500 shrink-0">
                  {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="flex justify-between items-center text-[10px] text-slate-400">
                <span>By {item.actor_name || 'System'}</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono">
                  {item.module}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
