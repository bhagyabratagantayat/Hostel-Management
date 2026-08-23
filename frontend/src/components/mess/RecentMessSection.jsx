import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import MealCard from './MealCard';

/**
 * RecentMessSection - Dashboard summary section for today's mess menu & meal counts.
 */
const RecentMessSection = ({ userRole = 'STUDENT', hostelId = null, onOpenMessComplaint }) => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [todayMenu, setTodayMenu] = useState([]);
  const [myParticipation, setMyParticipation] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingMeal, setUpdatingMeal] = useState(null);

  const fetchMessData = async () => {
    try {
      setLoading(true);
      setError('');

      const [sumRes, menuRes] = await Promise.all([
        api.getMessSummary({ hostel_id: hostelId }),
        api.getTodayMessMenu({ hostel_id: hostelId })
      ]);

      if (sumRes.data?.success) {
        setSummary(sumRes.data.data);
      }
      if (menuRes.data?.success) {
        setTodayMenu(menuRes.data.data || []);
      }

      if (userRole === 'STUDENT') {
        const partRes = await api.getMyMealParticipation();
        if (partRes.data?.success) {
          const records = partRes.data.data?.records || [];
          const todayStr = new Date().toISOString().split('T')[0];
          setMyParticipation(records.filter(r => new Date(r.meal_date).toISOString().split('T')[0] === todayStr));
        }
      }
    } catch (err) {
      console.error('Failed to load dashboard mess data:', err);
      setError('Could not load mess details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessData();
  }, [hostelId, userRole]);

  const handleToggleParticipation = async (mealType, status) => {
    try {
      setUpdatingMeal(mealType);
      const todayStr = new Date().toISOString().split('T')[0];
      await api.setMealParticipation({
        meal_date: todayStr,
        meal_type: mealType,
        status
      });
      await fetchMessData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update participation status.');
    } finally {
      setUpdatingMeal(null);
    }
  };

  const mealTypes = ['BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER'];

  const getMessPath = () => {
    if (userRole === 'SUPER_ADMIN') return '/admin/mess';
    if (userRole === 'SUPERINTENDENT') return '/superintendent/mess';
    return '/student/mess';
  };

  if (loading) {
    return (
      <div className="card dashboard-section-card">
        <div className="card-header">
          <h3>Today's Mess & Food</h3>
        </div>
        <div className="card-body">
          <div className="skeleton-line" style={{ width: '60%', height: '24px', marginBottom: '12px' }} />
          <div className="skeleton-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div className="skeleton-card" style={{ height: '140px' }} />
            <div className="skeleton-card" style={{ height: '140px' }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card dashboard-section-card mess-dashboard-widget">
      <div className="card-header flex-between">
        <div>
          <h3>Today's Mess Schedule</h3>
          <span className="subtitle">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </span>
        </div>
        <div className="widget-header-actions">
          {userRole === 'STUDENT' && onOpenMessComplaint && (
            <button
              type="button"
              className="btn btn-sm btn-outline-warning"
              onClick={onOpenMessComplaint}
            >
              ⚠️ Report Mess Issue
            </button>
          )}
          <button
            type="button"
            className="btn btn-sm btn-outline-primary"
            onClick={() => navigate(getMessPath())}
          >
            View Full Mess Dashboard →
          </button>
        </div>
      </div>

      <div className="card-body">
        {error && <div className="alert alert-error">{error}</div>}

        {/* Staff Overview Summary Cards */}
        {(userRole === 'SUPER_ADMIN' || userRole === 'SUPERINTENDENT') && summary && (
          <div className="mess-staff-summary-grid">
            {mealTypes.map(type => {
              const info = summary.meals[type] || {};
              return (
                <div key={type} className="staff-summary-card">
                  <div className="type-tag">{type}</div>
                  <div className="count-display">
                    <span className="count-taking">{info.taking || 0}</span>
                    <span className="count-label">Taking</span>
                  </div>
                  <div className="count-breakdown">
                    <span>Opt Out: {info.notTaking || 0}</span>
                    <span>Total Active: {info.totalActiveStudents || 0}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Meal Cards Grid */}
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
    </div>
  );
};

export default RecentMessSection;
