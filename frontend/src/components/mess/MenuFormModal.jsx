import React, { useState, useEffect } from 'react';

const MEAL_OPTIONS = [
  { value: 'BREAKFAST', label: ' Breakfast (07:30 AM – 09:30 AM)' },
  { value: 'LUNCH', label: ' Lunch (12:30 PM – 02:30 PM)' },
  { value: 'DINNER', label: ' Dinner (07:30 PM – 09:30 PM)' }
];

const DISH_PRESETS = [
  'Puri Sabzi & Boiled Egg / Banana',
  'Idli Sambar & Coconut Chutney',
  'Aloo Paratha with Curd & Pickle',
  'Uttapam / Masala Dosa with Sambar',
  'Poha with Peanuts & Sev',
  'Bread Butter Jam & Veg Cutlet / Omelette',
  'Chole Bhature & Masala Chai',
  'Steamed Rice, Dal Tadka & Mix Veg',
  'Rice, Dal Fry, Aloo Gobhi Matar & Salad',
  'Rice, Odia Dalma & Bhindi Kurkuri',
  'Rice, Chana Dal & Aloo Baingan',
  'Rice, Dal Makhani & Kashmiri Aloo Dum',
  'Tawa Roti, Egg Curry / Paneer Butter Masala',
  'Roti, Veg Pulao, Dal Makhani & Sweet Kheer',
  'Roti, Chicken Curry / Shahi Paneer & Rice',
  'Roti, Jeera Rice, Kadai Sabzi & Gulab Jamun',
  'Roti, Veg Fried Rice & Manchurian / Chilli Paneer'
];

/**
 * MenuFormModal - Warden & Admin modal to create or update hostel mess meals.
 */
const MenuFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  editItem = null,
  initialDate = null,
  initialMealType = null,
  hostels = [],
  userRole = 'SUPER_ADMIN'
}) => {
  const [formData, setFormData] = useState({
    hostel_id: '',
    menu_date: new Date().toISOString().split('T')[0],
    meal_type: 'BREAKFAST',
    meal_name: '',
    description: '',
    is_available: true
  });

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editItem) {
      setFormData({
        hostel_id: editItem.hostel_id || '',
        menu_date: editItem.menu_date ? new Date(editItem.menu_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        meal_type: editItem.meal_type || 'BREAKFAST',
        meal_name: editItem.meal_name || '',
        description: editItem.description || '',
        is_available: editItem.is_available === 1 || editItem.is_available === true
      });
    } else {
      setFormData({
        hostel_id: hostels.length === 1 ? hostels[0].id : '',
        menu_date: initialDate || new Date().toISOString().split('T')[0],
        meal_type: initialMealType || 'BREAKFAST',
        meal_name: '',
        description: '',
        is_available: true
      });
    }
    setError('');
  }, [editItem, initialDate, initialMealType, isOpen, hostels]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSelectPreset = (presetName) => {
    setFormData(prev => ({
      ...prev,
      meal_name: presetName
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.meal_name.trim()) {
      setError('Please enter a meal / dish name.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await onSubmit({
        ...formData,
        hostel_id: formData.hostel_id ? parseInt(formData.hostel_id, 10) : null
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save menu item.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container modal-md mess-form-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title">{editItem ? '️ Update Mess Food / Time-Table' : ' Add Meal to Time-Table'}</h3>
            <p className="modal-sub">Update hostel mess food menu for breakfast, lunch, or dinner</p>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close">×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="modal-body">
            {error && <div className="alert alert-danger mb-3">{error}</div>}

            <div className="form-row mb-3">
              <div className="form-group col-half">
                <label className="form-label required">Schedule Date</label>
                <input
                  type="date"
                  name="menu_date"
                  value={formData.menu_date}
                  onChange={handleChange}
                  required
                  disabled={!!editItem}
                  className="form-control"
                />
              </div>

              <div className="form-group col-half">
                <label className="form-label required">Meal Time</label>
                <select
                  name="meal_type"
                  value={formData.meal_type}
                  onChange={handleChange}
                  disabled={!!editItem}
                  className="form-select"
                >
                  {MEAL_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group mb-3">
              <label className="form-label required">Dish / Menu Items</label>
              <input
                type="text"
                name="meal_name"
                placeholder="e.g. Puri Sabzi & Boiled Egg / Chai"
                value={formData.meal_name}
                onChange={handleChange}
                required
                className="form-control"
              />
              
              {/* Quick Preset Chips */}
              <div className="preset-chips-container mt-2">
                <span className="preset-label">Quick Suggestions:</span>
                <div className="preset-chips-grid">
                  {DISH_PRESETS.slice(0, 6).map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="preset-chip-btn"
                      onClick={() => handleSelectPreset(preset)}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="form-group mb-3">
              <label className="form-label">Detailed Description / Ingredients (Optional)</label>
              <textarea
                name="description"
                placeholder="e.g. Served with hot spicy chana sabzi, banana or boiled egg, tea/coffee"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="form-control"
              />
            </div>

            <div className="form-group mb-3">
              <label className="checkbox-label flex-gap align-center">
                <input
                  type="checkbox"
                  name="is_available"
                  checked={formData.is_available}
                  onChange={handleChange}
                />
                <span>Dish is currently served & available in mess</span>
              </label>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving Menu...' : (editItem ? '✓ Save Changes' : '✓ Add Meal')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MenuFormModal;
