import React, { useState, useEffect } from 'react';
import { getActivities, getActivityStats } from '../../api/activity';
import { ActivityFilterBar } from './ActivityFilterBar';
import { ActivityDetailsModal } from './ActivityDetailsModal';

const MODULE_COLORS = {
  AUTHENTICATION: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  USERS: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  STUDENTS: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  HOSTELS: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  ATTENDANCE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  NOTICES: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  COMPLAINTS: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  VISITORS: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  MESS: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  FEES: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  ALLOCATION: 'bg-violet-500/10 text-violet-400 border-violet-500/20'
};

export const ActivityTimeline = () => {
  const [activities, setActivities] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    module: '',
    hostelId: '',
    search: '',
    startDate: '',
    endDate: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [actData, statsData] = await Promise.all([
        getActivities(filters),
        getActivityStats()
      ]);
      setActivities(actData.activities || actData.records || []);
      setPagination({
        page: actData.page,
        totalPages: actData.totalPages,
        total: actData.total
      });
      setStats(statsData);
    } catch (err) {
      console.error('Error fetching activity log:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

  const handleResetFilters = () => {
    setFilters({
      page: 1,
      limit: 20,
      module: '',
      hostelId: '',
      search: '',
      startDate: '',
      endDate: ''
    });
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setFilters((prev) => ({ ...prev, page: newPage }));
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100">System Activity & Audit Center</h1>
        <p className="text-sm text-slate-400">
          Centralized operational audit trail tracking actions across all hostel management modules.
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl shadow-lg">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total Activities</span>
            <span className="text-2xl font-bold text-slate-100 mt-1 block">{stats.total || 0}</span>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl shadow-lg">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Last 24 Hours</span>
            <span className="text-2xl font-bold text-indigo-400 mt-1 block">{stats.last24Hours || 0}</span>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl shadow-lg">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Top Module</span>
            <span className="text-lg font-bold text-emerald-400 mt-1 block truncate">
              {stats.byModule && stats.byModule[0] ? `${stats.byModule[0].module} (${stats.byModule[0].count})` : 'N/A'}
            </span>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl shadow-lg">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Active Actors</span>
            <span className="text-2xl font-bold text-amber-400 mt-1 block">{stats.uniqueActors || 0}</span>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <ActivityFilterBar
        filters={filters}
        onFilterChange={setFilters}
        onReset={handleResetFilters}
      />

      {/* Activities Feed Timeline */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-800">
          <h2 className="text-lg font-bold text-slate-200">Activity Log Timeline</h2>
          <span className="text-xs font-semibold text-slate-400">
            Showing {activities.length} of {pagination.total} entries
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent mb-2"></div>
            <p className="text-sm">Loading activity logs...</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            <p className="text-base font-semibold">No activity logs found</p>
            <p className="text-xs mt-1">Try adjusting your filters or search terms.</p>
          </div>
        ) : (
          <div className="relative border-l-2 border-slate-800 ml-4 space-y-6">
            {activities.map((item) => {
              const colorClass = MODULE_COLORS[item.module] || 'bg-slate-800 text-slate-300 border-slate-700';

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedActivity(item)}
                  className="relative pl-6 group cursor-pointer"
                >
                  {/* Timeline dot */}
                  <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-slate-900 border-2 border-indigo-500 group-hover:scale-125 transition-transform" />

                  <div className="bg-slate-800/40 hover:bg-slate-800/80 border border-slate-800/80 hover:border-slate-700 p-4 rounded-xl transition-all shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${colorClass}`}>
                          {item.module || 'SYSTEM'}
                        </span>
                        <span className="text-xs font-semibold text-slate-300">
                          {item.action}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 font-medium">
                        {new Date(item.created_at).toLocaleString()}
                      </span>
                    </div>

                    <p className="text-sm text-slate-200 font-medium mb-2">
                      {item.description}
                    </p>

                    <div className="flex flex-wrap justify-between items-center text-xs text-slate-400 pt-2 border-t border-slate-800/40">
                      <div>
                        <span>Actor: </span>
                        <span className="font-semibold text-slate-300">
                          {item.actor_name || 'System'}
                        </span>
                        {item.actor_username && (
                          <span className="text-slate-500"> (@{item.actor_username})</span>
                        )}
                      </div>

                      {item.hostel_name && (
                        <div>
                          <span>Hostel: </span>
                          <span className="font-semibold text-slate-300">{item.hostel_name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {pagination.totalPages > 1 && (
          <div className="mt-8 pt-4 border-t border-slate-800 flex justify-between items-center text-xs">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-slate-300 font-semibold transition-all"
            >
              Previous
            </button>
            <span className="text-slate-400 font-medium">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-slate-300 font-semibold transition-all"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedActivity && (
        <ActivityDetailsModal
          activity={selectedActivity}
          onClose={() => setSelectedActivity(null)}
        />
      )}
    </div>
  );
};
