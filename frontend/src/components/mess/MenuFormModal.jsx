import React, { useState, useEffect } from 'react';

/**
 * MenuFormModal - Modal dialog for adding or editing mess menu items.
 */
const MenuFormModal = ({ isOpen, onClose, onSubmit, editItem = null, hostels = [], userRole = 'SUPER_ADMIN' }) => {
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
        menu_date: new Date().toISOString().split('T')[0],
        meal_type: 'BREAKFAST',
        meal_name: '',
        description: '',
        is_available: true
      });
    }
    setError('');
  }, [editItem, isOpen, hostels]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.meal_name.trim()) {
      setError('Please enter a meal name.');
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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content mess-form-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{editItem ? 'Edit Mess Menu Item' : 'Add Mess Menu Item'}</h3>
          <button type="button" className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && <div className="alert alert-error">{error}</div>}

          {!editItem && (
            <div className="form-group">
              <label>Hostel Scope</label>
              <select
                name="hostel_id"
                value={formData.hostel_id}
                onChange={handleChange}
                className="form-control"
              >
                {userRole === 'SUPER_ADMIN' && (
                  <option value="">All Hostels (Common Menu)</option>
                )}
                {hostels.map(h => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="form-row">
            <div className="form-group col-6">
              <label>Menu Date *</label>
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

            <div className="form-group col-6">
              <label>Meal Type *</label>
              <select
                name="meal_type"
                value={formData.meal_type}
                onChange={handleChange}
                disabled={!!editItem}
                className="form-control"
              >
                <option value="BREAKFAST">BREAKFAST</option>
                <option value="LUNCH">LUNCH</option>
                <option value="SNACKS">SNACKS</option>
                <option value="DINNER">DINNER</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Meal Name *</label>
            <input
              type="text"
              name="meal_name"
              placeholder="e.g. Idli, Sambar & Chutney"
              value={formData.meal_name}
              onChange={handleChange}
              required
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label>Description (Optional)</label>
            <textarea
              name="description"
              placeholder="e.g. Served hot with fresh coconut chutney"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="form-control"
            />
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="is_available"
                checked={formData.is_available}
                onChange={handleChange}
              />
              <span>Meal is available for service</span>
            </label>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : (editItem ? 'Update Menu Item' : 'Create Menu Item')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MenuFormModal;
