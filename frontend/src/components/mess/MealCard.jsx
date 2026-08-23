import React from 'react';

/**
 * MealCard - Displays single meal item details and participation actions for students.
 */
const MealCard = ({
  mealType,
  menuItem,
  participation,
  onToggleParticipation,
  isStudent = false,
  isUpdating = false
}) => {
  const mealIcons = {
    BREAKFAST: '🌅',
    LUNCH: '☀️',
    SNACKS: '☕',
    DINNER: '🌙'
  };

  const mealTitles = {
    BREAKFAST: 'Breakfast',
    LUNCH: 'Lunch',
    SNACKS: 'Snacks',
    DINNER: 'Dinner'
  };

  const currentStatus = participation ? participation.status : 'TAKING'; // default opt-in

  return (
    <div className={`meal-card ${menuItem?.is_available === 0 ? 'unavailable' : ''}`}>
      <div className="meal-card-header">
        <div className="meal-title-group">
          <span className="meal-icon">{mealIcons[mealType] || '🍲'}</span>
          <div>
            <h4 className="meal-type-title">{mealTitles[mealType] || mealType}</h4>
            {menuItem && (
              <span className={`availability-badge ${menuItem.is_available ? 'available' : 'unavailable'}`}>
                {menuItem.is_available ? 'Available' : 'Unavailable'}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="meal-card-body">
        {menuItem ? (
          <>
            <h3 className="meal-name">{menuItem.meal_name}</h3>
            {menuItem.description && (
              <p className="meal-description">{menuItem.description}</p>
            )}
            {menuItem.hostel_name && (
              <span className="meal-hostel-tag">Scope: {menuItem.hostel_name}</span>
            )}
          </>
        ) : (
          <div className="empty-meal-state">
            <p>No menu published for today</p>
          </div>
        )}
      </div>

      {isStudent && menuItem && menuItem.is_available !== 0 && (
        <div className="meal-card-footer">
          <div className="participation-toggle-container">
            <span className="participation-label">My Response:</span>
            <div className="btn-group-toggle">
              <button
                type="button"
                className={`toggle-btn taking ${currentStatus === 'TAKING' ? 'active' : ''}`}
                disabled={isUpdating}
                onClick={() => onToggleParticipation && onToggleParticipation(mealType, 'TAKING')}
              >
                ✓ Taking
              </button>
              <button
                type="button"
                className={`toggle-btn not-taking ${currentStatus === 'NOT_TAKING' ? 'active' : ''}`}
                disabled={isUpdating}
                onClick={() => onToggleParticipation && onToggleParticipation(mealType, 'NOT_TAKING')}
              >
                ✕ Not Taking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MealCard;
