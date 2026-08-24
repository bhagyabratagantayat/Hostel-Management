import React, { useState } from 'react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MEAL_TYPES = ['BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER'];

/**
 * WeeklyMenu - Displays weekly schedule grid on desktop and expandable cards on mobile.
 */
const WeeklyMenu = ({ weeklyData, onEditItem, onDeleteItem, canManage = false }) => {
  const [expandedDay, setExpandedDay] = useState(0); // Default open Monday (0)

  // Map items by day index (0-6) and meal_type
  const getItemsForDay = (dayIndex) => {
    if (!weeklyData || !weeklyData.items || !weeklyData.startDate) {
      return { dateStr: '', items: {} };
    }

    try {
      const parts = String(weeklyData.startDate).substring(0, 10).split('-').map(Number);
      const startDate = new Date(parts[0], (parts[1] || 1) - 1, parts[2] || 1);
      const targetDate = new Date(startDate);
      targetDate.setDate(startDate.getDate() + dayIndex);

      const yyyy = targetDate.getFullYear();
      const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
      const dd = String(targetDate.getDate()).padStart(2, '0');
      const targetDateStr = `${yyyy}-${mm}-${dd}`;

      const dayItems = (weeklyData.items || []).filter(item => {
        if (!item || !item.menu_date) return false;
        const itemDateStr = String(item.menu_date).substring(0, 10);
        return itemDateStr === targetDateStr;
      });

      const mapped = {};
      MEAL_TYPES.forEach(type => {
        mapped[type] = dayItems.find(i => i.meal_type === type);
      });

      return { dateStr: targetDateStr, items: mapped };
    } catch (err) {
      console.error('Error computing weekly menu day items:', err);
      return { dateStr: '', items: {} };
    }
  };

  return (
    <div className="weekly-menu-container">
      {/* Desktop Grid View (>= 768px) */}
      <div className="desktop-weekly-grid">
        <table className="weekly-table">
          <thead>
            <tr>
              <th>Day</th>
              <th>Breakfast</th>
              <th>Lunch</th>
              <th>Snacks</th>
              <th>Dinner</th>
            </tr>
          </thead>
          <tbody>
            {DAYS.map((dayName, idx) => {
              const { dateStr, items = {} } = getItemsForDay(idx);
              return (
                <tr key={dayName}>
                  <td className="day-header-cell">
                    <div className="day-name">{dayName}</div>
                    <div className="day-date">{dateStr}</div>
                  </td>
                  {MEAL_TYPES.map(mealType => {
                    const item = items ? items[mealType] : undefined;
                    return (
                      <td key={mealType} className="meal-cell">
                        {item ? (
                          <div className="cell-content">
                            <div className="cell-title">{item.meal_name}</div>
                            {item.description && (
                              <div className="cell-desc">{item.description}</div>
                            )}
                            <div className="cell-actions">
                              <span className={`status-dot ${item.is_available ? 'active' : 'inactive'}`} />
                              {canManage && (
                                <div className="manage-btns">
                                  <button
                                    type="button"
                                    className="btn-icon-sm"
                                    title="Edit"
                                    onClick={() => onEditItem && onEditItem(item)}
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-icon-sm danger"
                                    title="Delete"
                                    onClick={() => onDeleteItem && onDeleteItem(item.id)}
                                  >
                                    🗑️
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="no-item-text">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Accordion View (< 768px) */}
      <div className="mobile-weekly-accordion">
        {DAYS.map((dayName, idx) => {
          const { dateStr, items = {} } = getItemsForDay(idx);
          const isExpanded = expandedDay === idx;

          return (
            <div key={dayName} className={`mobile-day-card ${isExpanded ? 'expanded' : ''}`}>
              <button
                type="button"
                className="day-accordion-header"
                onClick={() => setExpandedDay(isExpanded ? null : idx)}
              >
                <div>
                  <span className="day-title-text">{dayName}</span>
                  <span className="day-date-sub">{dateStr}</span>
                </div>
                <span className="accordion-chevron">{isExpanded ? '▲' : '▼'}</span>
              </button>

              {isExpanded && (
                <div className="day-accordion-body">
                  {MEAL_TYPES.map(mealType => {
                    const item = items ? items[mealType] : undefined;
                    return (
                      <div key={mealType} className="mobile-meal-item">
                        <div className="mobile-meal-type">{mealType}</div>
                        {item ? (
                          <div className="mobile-meal-detail">
                            <div className="mobile-meal-name">{item.meal_name}</div>
                            {item.description && (
                              <div className="mobile-meal-desc">{item.description}</div>
                            )}
                            {canManage && (
                              <div className="mobile-item-actions">
                                <button
                                  type="button"
                                  className="btn-text-action"
                                  onClick={() => onEditItem && onEditItem(item)}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="btn-text-action danger"
                                  onClick={() => onDeleteItem && onDeleteItem(item.id)}
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="mobile-meal-empty">Not set</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WeeklyMenu;
