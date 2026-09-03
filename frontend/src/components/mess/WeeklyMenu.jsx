import React, { useState } from 'react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MEAL_TYPES = ['BREAKFAST', 'LUNCH', 'DINNER'];

const MEAL_META = {
  BREAKFAST: { title: 'Breakfast', icon: 'fa-mug-hot', color: '#f59e0b', time: '07:30 AM – 09:30 AM' },
  LUNCH: { title: 'Lunch', icon: 'fa-bowl-rice', color: '#10b981', time: '12:30 PM – 02:30 PM' },
  DINNER: { title: 'Dinner', icon: 'fa-utensils', color: '#6366f1', time: '07:30 PM – 09:30 PM' }
};

/**
 * WeeklyMenu - Modern Time-Table matrix & mobile daily view for 3 hostel meals.
 */
const WeeklyMenu = ({ weeklyData, onEditItem, onDeleteItem, onAddForDay, canManage = false }) => {
  // Current Day detection (0 = Sun, 1 = Mon... -> convert to 0 = Mon, 6 = Sun)
  const todayJs = new Date().getDay();
  const currentDayIndex = todayJs === 0 ? 6 : todayJs - 1;
  const [selectedDayTab, setSelectedDayTab] = useState(currentDayIndex);

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

  const activeDayData = getItemsForDay(selectedDayTab);

  return (
    <div className="weekly-timetable-container">
      {/* Timetable Controls & Day Selector */}
      <div className="timetable-header-row flex-between align-center">
        <div className="timetable-legend">
          <span className="legend-badge breakfast" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <i className="fa-solid fa-mug-hot"></i> Breakfast (7:30–9:30 AM)
          </span>
          <span className="legend-badge lunch" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <i className="fa-solid fa-bowl-rice"></i> Lunch (12:30–2:30 PM)
          </span>
          <span className="legend-badge dinner" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <i className="fa-solid fa-utensils"></i> Dinner (7:30–9:30 PM)
          </span>
        </div>
        {canManage && (
          <div className="warden-banner-hint" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <i className="fa-solid fa-shield-halved text-indigo-500"></i>
            <span><strong>Warden Controls Active</strong>: Modify dishes and schedule below.</span>
          </div>
        )}
      </div>

      {/* Day Selector Pills (Mobile & Quick-Switch) */}
      <div className="timetable-day-pills">
        {DAYS.map((dayName, idx) => {
          const { dateStr } = getItemsForDay(idx);
          const isToday = idx === currentDayIndex;
          const isSelected = idx === selectedDayTab;

          return (
            <button
              key={dayName}
              type="button"
              className={`day-pill-btn ${isSelected ? 'active' : ''} ${isToday ? 'is-today' : ''}`}
              onClick={() => setSelectedDayTab(idx)}
            >
              <span className="day-pill-name">{dayName.substring(0, 3)}</span>
              <span className="day-pill-date">{dateStr ? dateStr.substring(8, 10) : ''}</span>
              {isToday && <span className="today-indicator-dot" title="Today" />}
            </button>
          );
        })}
      </div>

      {/* Active Day Card View (Highlighted on all screen sizes) */}
      <div className="active-day-timetable-card">
        <div className="active-day-header flex-between align-center">
          <div>
            <h3 className="active-day-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-regular fa-calendar-days text-indigo-600"></i>
              {DAYS[selectedDayTab]}
              {selectedDayTab === currentDayIndex && (
                <span className="today-badge">
                  <i className="fa-solid fa-circle text-xs mr-1"></i> TODAY'S FOOD
                </span>
              )}
            </h3>
            <span className="active-day-date">{activeDayData.dateStr}</span>
          </div>
          {canManage && onAddForDay && (
            <button
              type="button"
              className="btn btn-sm btn-outline-primary"
              onClick={() => onAddForDay(DAYS[selectedDayTab], activeDayData.dateStr)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <i className="fa-solid fa-plus"></i> Add / Edit Day Menu
            </button>
          )}
        </div>

        <div className="active-day-meals-grid">
          {MEAL_TYPES.map(mealType => {
            const item = activeDayData.items ? activeDayData.items[mealType] : undefined;
            const meta = MEAL_META[mealType];

            return (
              <div key={mealType} className={`timetable-meal-tile ${mealType.toLowerCase()}`}>
                <div className="tile-header flex-between align-center">
                  <div className="tile-title-group">
                    <span className="tile-icon" style={{ color: meta.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className={`fa-solid ${meta.icon}`}></i>
                    </span>
                    <div>
                      <h4 className="tile-type-name">{meta.title}</h4>
                      <span className="tile-timing-text">
                        <i className="fa-regular fa-clock mr-1"></i>
                        {meta.time}
                      </span>
                    </div>
                  </div>
                  {canManage && (
                    <div className="tile-actions">
                      {item ? (
                        <button
                          type="button"
                          className="btn-icon-tile"
                          title="Edit Meal"
                          onClick={() => onEditItem && onEditItem(item)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <i className="fa-solid fa-pen"></i> Edit
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn-icon-tile"
                          title="Set Meal"
                          onClick={() => onAddForDay && onAddForDay(DAYS[selectedDayTab], activeDayData.dateStr, mealType)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <i className="fa-solid fa-plus"></i> Set
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="tile-body">
                  {item ? (
                    <>
                      <h5 className="tile-food-title">{item.meal_name}</h5>
                      {item.description && <p className="tile-food-desc">{item.description}</p>}
                      <div className="tile-footer">
                        <span className={`dish-status ${item.is_available ? 'active' : 'inactive'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <i className={`fa-solid ${item.is_available ? 'fa-check' : 'fa-xmark'}`}></i>
                          {item.is_available ? 'Available' : 'Not Served'}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="tile-empty-state">
                      <i className="fa-solid fa-utensils text-slate-300" style={{ fontSize: '1.25rem', marginBottom: '4px', display: 'block' }}></i>
                      <p>Standard hostel menu scheduled</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Desktop 7-Day Complete Time-Table Matrix Table */}
      <div className="desktop-timetable-matrix-wrapper">
        <div className="matrix-table-title flex-between align-center">
          <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fa-solid fa-table-cells text-indigo-600"></i>
            Full 7-Day Hostel Mess Time-Table
          </h4>
          <span className="text-muted">Monday through Sunday Schedule</span>
        </div>
        <div className="table-responsive" style={{ overflowX: 'auto' }}>
          <table className="timetable-matrix-table" style={{ width: '100%', minWidth: '700px' }}>
            <thead>
              <tr>
                <th className="th-day">Day</th>
                <th className="th-meal">
                  <div className="th-meal-inner">
                    <span><i className="fa-solid fa-mug-hot text-amber-500 mr-1"></i> Breakfast</span>
                    <small>07:30 – 09:30 AM</small>
                  </div>
                </th>
                <th className="th-meal">
                  <div className="th-meal-inner">
                    <span><i className="fa-solid fa-bowl-rice text-emerald-500 mr-1"></i> Lunch</span>
                    <small>12:30 – 02:30 PM</small>
                  </div>
                </th>
                <th className="th-meal">
                  <div className="th-meal-inner">
                    <span><i className="fa-solid fa-utensils text-indigo-500 mr-1"></i> Dinner</span>
                    <small>07:30 – 09:30 PM</small>
                  </div>
                </th>
                {canManage && <th style={{ width: '90px', textAlign: 'center' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {DAYS.map((dayName, idx) => {
                const { dateStr, items } = getItemsForDay(idx);
                const isToday = idx === currentDayIndex;

                return (
                  <tr key={dayName} className={isToday ? 'row-is-today' : ''}>
                    <td className="td-day-label">
                      <strong>{dayName}</strong>
                      {dateStr && <small>{dateStr.substring(5)}</small>}
                      {isToday && <span className="mini-today-badge">TODAY</span>}
                    </td>

                    {MEAL_TYPES.map(mealType => {
                      const item = items[mealType];
                      return (
                        <td key={mealType} className="td-meal-cell">
                          {item ? (
                            <div className="matrix-meal-content">
                              <span className="matrix-meal-name">{item.meal_name}</span>
                              {item.description && <small className="matrix-meal-desc">{item.description}</small>}
                            </div>
                          ) : (
                            <span className="matrix-meal-empty">&mdash;</span>
                          )}
                        </td>
                      );
                    })}

                    {canManage && (
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="btn btn-xs btn-outline-secondary"
                          onClick={() => onAddForDay && onAddForDay(dayName, dateStr)}
                          title={`Edit ${dayName} Menu`}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <i className="fa-solid fa-pen-to-square"></i> Edit
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default WeeklyMenu;
