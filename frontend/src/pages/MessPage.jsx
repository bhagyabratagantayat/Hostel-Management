import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import MealCard from '../components/mess/MealCard';
import WeeklyMenu from '../components/mess/WeeklyMenu';
import MenuFormModal from '../components/mess/MenuFormModal';
import MessAnalyticsCard from '../components/mess/MessAnalyticsCard';
import ComplaintFormModal from '../components/complaints/ComplaintFormModal';

const MessPage = ({ userRole = 'STUDENT' }) => {
  const [activeTab, setActiveTab] = useState('TODAY'); // TODAY, WEEKLY, ROSTER, ANALYTICS
  const [hostels, setHostels] = useState([]);
  const [selectedHostelId, setSelectedHostelId] = useState('');
  
  const [todayMenu, setTodayMenu] = useState([]);
  const [weeklyData, setWeeklyData] = useState(null);
  const [myParticipation, setMyParticipation] = useState([]);
  const [rosterData, setRosterData] = useState({ records: [], total: 0, page: 1, totalPages: 1 });
  const [analyticsData, setAnalyticsData] = useState(null);
  const [summary, setSummary] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [rosterPage, setRosterPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState(null);
  const [isComplaintModalOpen, setIsComplaintModalOpen] = useState(false);
  const [updatingMeal, setUpdatingMeal] = useState(null);

  // Fetch Hostels for Staff
  useEffect(() => {
    if (userRole !== 'STUDENT') {
      api.get('/hostels')
        .then(res => {
          if (res.data?.success) {
            setHostels(res.data.data || []);
          }
        })
        .catch(err => console.error('Failed to load hostels list:', err));
    }
  }, [userRole]);

  // Main data loader
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const params = { hostel_id: selectedHostelId || undefined };

      const [menuRes, weeklyRes, sumRes] = await Promise.all([
        api.getTodayMessMenu(params),
        api.getWeeklyMessMenu(params),
        api.getMessSummary(params)
      ]);

      if (menuRes.data?.success) setTodayMenu(menuRes.data.data || []);
      if (weeklyRes.data?.success) setWeeklyData(weeklyRes.data);
      if (sumRes.data?.success) setSummary(sumRes.data.data);

      if (userRole === 'STUDENT') {
        const partRes = await api.getMyMealParticipation();
        if (partRes.data?.success) {
          const records = partRes.data.data?.records || [];
          const todayStr = new Date().toISOString().split('T')[0];
          setMyParticipation(records.filter(r => new Date(r.meal_date).toISOString().split('T')[0] === todayStr));
        }
      } else {
        // Fetch roster and analytics for staff
        const [rosterRes, analyticsRes] = await Promise.all([
          api.getMealParticipationRoster({
            hostel_id: selectedHostelId || undefined,
            page: rosterPage,
            limit: 15,
            search: searchQuery
          }),
          api.getMessAnalytics(params)
        ]);

        if (rosterRes.data?.success) setRosterData(rosterRes.data.data);
        if (analyticsRes.data?.success) setAnalyticsData(analyticsRes.data.data);
      }
    } catch (err) {
      console.error('Error loading mess page data:', err);
      setError('Failed to load mess management data.');
    } finally {
      setLoading(false);
    }
  }, [selectedHostelId, userRole, rosterPage, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Student toggle handler
  const handleToggleParticipation = async (mealType, status) => {
    try {
      setUpdatingMeal(mealType);
      const todayStr = new Date().toISOString().split('T')[0];
      await api.setMealParticipation({
        meal_date: todayStr,
        meal_type: mealType,
        status
      });
      await loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to set meal status.');
    } finally {
      setUpdatingMeal(null);
    }
  };

  // Staff Menu CRUD handlers
  const handleCreateOrUpdateMenu = async (formData) => {
    if (editingMenuItem) {
      await api.updateMessMenuItem(editingMenuItem.id, formData);
    } else {
      await api.createMessMenuItem(formData);
    }
    await loadData();
  };

  const handleDeleteMenuItem = async (id) => {
    if (!window.confirm('Are you sure you want to delete this menu item?')) return;
    try {
      await api.deleteMessMenuItem(id);
      await loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete menu item.');
    }
  };

  const mealTypes = ['BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER'];

  return (
    <div className="mess-page container">
      <div className="page-header flex-between align-center">
        <div>
          <h2>Hostel Mess & Food Management</h2>
          <p className="subtitle">Daily menus, meal participation schedules, and mess analytics</p>
        </div>

        <div className="header-action-group flex-gap">
          {userRole === 'STUDENT' && (
            <button
              type="button"
              className="btn btn-warning"
              onClick={() => setIsComplaintModalOpen(true)}
            >
              ⚠️ Submit Mess Complaint
            </button>
          )}

          {userRole !== 'STUDENT' && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setEditingMenuItem(null);
                setIsMenuModalOpen(true);
              }}
            >
              + Add Menu Item
            </button>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      {userRole !== 'STUDENT' && hostels.length > 0 && (
        <div className="card toolbar-card margin-bottom">
          <div className="toolbar-row flex-between align-center">
            <div className="filter-group flex-gap align-center">
              <label htmlFor="hostel-filter">Filter Hostel:</label>
              <select
                id="hostel-filter"
                value={selectedHostelId}
                onChange={(e) => setSelectedHostelId(e.target.value)}
                className="form-control"
              >
                {userRole === 'SUPER_ADMIN' && <option value="">All Hostels</option>}
                {hostels.map(h => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="tabs-nav margin-bottom">
        <button
          type="button"
          className={`tab-item ${activeTab === 'TODAY' ? 'active' : ''}`}
          onClick={() => setActiveTab('TODAY')}
        >
          🍲 Today's Menu
        </button>
        <button
          type="button"
          className={`tab-item ${activeTab === 'WEEKLY' ? 'active' : ''}`}
          onClick={() => setActiveTab('WEEKLY')}
        >
          📅 Weekly Schedule
        </button>
        {userRole !== 'STUDENT' && (
          <>
            <button
              type="button"
              className={`tab-item ${activeTab === 'ROSTER' ? 'active' : ''}`}
              onClick={() => setActiveTab('ROSTER')}
            >
              📋 Student Roster
            </button>
            <button
              type="button"
              className={`tab-item ${activeTab === 'ANALYTICS' ? 'active' : ''}`}
              onClick={() => setActiveTab('ANALYTICS')}
            >
              📊 Mess Analytics
            </button>
          </>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* TAB CONTENT 1: TODAY'S MENU */}
      {activeTab === 'TODAY' && (
        <div className="tab-content">
          {summary && userRole !== 'STUDENT' && (
            <div className="mess-summary-cards-grid margin-bottom">
              {mealTypes.map(type => {
                const info = summary.meals[type] || {};
                return (
                  <div key={type} className="stat-card mess-stat-pill">
                    <span className="stat-label">{type} TAKING</span>
                    <span className="stat-value text-success">{info.taking || 0}</span>
                    <span className="stat-sub">Out of {info.totalActiveStudents || 0} active students</span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mess-meals-grid">
            {mealTypes.map(mealType => {
              const menuItem = todayMenu.find(m => m.meal_type === mealType);
              const participation = myParticipation.find(p => p.meal_type === mealType);

              return (
                <MealCard
                  key={mealType}
                  mealType={mealType}
                  menuItem={menuItem}
                  participation={participation}
                  onToggleParticipation={handleToggleParticipation}
                  isStudent={userRole === 'STUDENT'}
                  isUpdating={updatingMeal === mealType}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: WEEKLY SCHEDULE */}
      {activeTab === 'WEEKLY' && (
        <div className="tab-content">
          <WeeklyMenu
            weeklyData={weeklyData}
            onEditItem={(item) => {
              setEditingMenuItem(item);
              setIsMenuModalOpen(true);
            }}
            onDeleteItem={handleDeleteMenuItem}
            canManage={userRole !== 'STUDENT'}
          />
        </div>
      )}

      {/* TAB CONTENT 3: STUDENT ROSTER (STAFF ONLY) */}
      {activeTab === 'ROSTER' && userRole !== 'STUDENT' && (
        <div className="tab-content">
          <div className="card toolbar-card margin-bottom">
            <div className="search-bar">
              <input
                type="text"
                placeholder="Search by student name, code or room..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-control"
              />
            </div>
          </div>

          <div className="card">
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Student Code</th>
                    <th>Room</th>
                    <th>Date</th>
                    <th>Meal</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rosterData.records.length > 0 ? (
                    rosterData.records.map(rec => (
                      <tr key={rec.id}>
                        <td>{rec.student_name}</td>
                        <td>{rec.student_code}</td>
                        <td>{rec.room_number || '-'}</td>
                        <td>{new Date(rec.meal_date).toLocaleDateString()}</td>
                        <td><strong>{rec.meal_type}</strong></td>
                        <td>
                          <span className={`status-pill ${rec.status === 'TAKING' ? 'status-approved' : 'status-rejected'}`}>
                            {rec.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center p-4">
                        No student meal participation records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {rosterData.totalPages > 1 && (
              <div className="pagination-bar flex-between align-center p-3">
                <span>Page {rosterData.page} of {rosterData.totalPages} ({rosterData.total} records)</span>
                <div className="flex-gap">
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    disabled={rosterPage <= 1}
                    onClick={() => setRosterPage(prev => Math.max(1, prev - 1))}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    disabled={rosterPage >= rosterData.totalPages}
                    onClick={() => setRosterPage(prev => Math.min(rosterData.totalPages, prev + 1))}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT 4: MESS ANALYTICS (STAFF ONLY) */}
      {activeTab === 'ANALYTICS' && userRole !== 'STUDENT' && (
        <div className="tab-content">
          <MessAnalyticsCard analyticsData={analyticsData} />
        </div>
      )}

      {/* Modals */}
      <MenuFormModal
        isOpen={isMenuModalOpen}
        onClose={() => {
          setIsMenuModalOpen(false);
          setEditingMenuItem(null);
        }}
        onSubmit={handleCreateOrUpdateMenu}
        editItem={editingMenuItem}
        hostels={hostels}
        userRole={userRole}
      />

      <ComplaintFormModal
        isOpen={isComplaintModalOpen}
        onClose={() => setIsComplaintModalOpen(false)}
        defaultCategory="FOOD_MESS"
        onComplaintCreated={() => {
          setIsComplaintModalOpen(false);
          alert('Mess complaint submitted successfully.');
        }}
      />
    </div>
  );
};

export default MessPage;
