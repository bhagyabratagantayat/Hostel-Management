import React from 'react';

export const ActivityDetailsModal = ({ activity, onClose }) => {
  if (!activity) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl overflow-hidden text-slate-200">
        {/* Header */}
        <div className="flex justify-between items-start pb-4 border-b border-slate-800">
          <div>
            <span className="inline-block text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-2">
              {activity.module || 'SYSTEM'}
            </span>
            <h3 className="text-lg font-bold text-slate-100">{activity.action}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-xl font-bold p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            &times;
          </button>
        </div>

        {/* Details Grid */}
        <div className="py-4 space-y-4 text-sm max-h-[60vh] overflow-y-auto custom-scrollbar">
          <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-800/80">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Description</h4>
            <p className="text-slate-200 font-medium">{activity.description || 'No description available'}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-800/80">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Actor</span>
              <p className="text-slate-200 font-semibold mt-1">
                {activity.actor_name || 'System / Anonymous'}
              </p>
              {activity.actor_username && (
                <p className="text-xs text-slate-400">@{activity.actor_username} ({activity.actor_role})</p>
              )}
            </div>

            <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-800/80">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Timestamp</span>
              <p className="text-slate-200 font-semibold mt-1">
                {new Date(activity.created_at).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-800/80">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Hostel Context</span>
              <p className="text-slate-200 font-semibold mt-1">
                {activity.hostel_name || 'Global / N/A'}
              </p>
            </div>

            <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-800/80">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Target Entity</span>
              <p className="text-slate-200 font-semibold mt-1">
                {activity.entity_type ? `${activity.entity_type} #${activity.entity_id || ''}` : 'N/A'}
              </p>
            </div>
          </div>

          {/* Metadata JSON display */}
          {activity.metadata && (
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-emerald-400 overflow-x-auto">
              <span className="text-slate-400 font-sans block text-xs font-semibold mb-2">Event Metadata</span>
              <pre>{JSON.stringify(activity.metadata, null, 2)}</pre>
            </div>
          )}

          {/* Technical Info */}
          <div className="flex justify-between items-center text-xs text-slate-500 pt-2 border-t border-slate-800/60">
            <span>IP: {activity.ip_address || 'Internal'}</span>
            <span className="truncate max-w-[250px]" title={activity.user_agent}>
              UA: {activity.user_agent || 'Server Process'}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm rounded-xl transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
