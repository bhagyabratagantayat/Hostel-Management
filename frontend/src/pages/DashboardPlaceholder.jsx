import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Card from '../components/Card';
import Loading from '../components/Loading';
import Error from '../components/Error';
import Button from '../components/Button';
import Input from '../components/Input';

const DashboardPlaceholder = () => {
  const [hostels, setHostels] = useState([]);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Parallel fetch for health and hostels list
      const [healthRes, hostelsRes] = await Promise.all([
        api.get('/health').catch(err => ({ status: 'DEGRADED', services: { database: { status: 'DISCONNECTED' } } })),
        api.get('/hostels')
      ]);
      
      setHealth(healthRes);
      setHostels(hostelsRes.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch dashboard data. Make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredHostels = hostels.filter(h => 
    h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <Loading message="Connecting to College Hostel Management System database..." />;
  if (error) return <Error message={error} onRetry={fetchData} />;

  const isDbConnected = health?.services?.database?.status === 'CONNECTED';

  return (
    <div className="dashboard-page">
      <div className="dashboard-header-section">
        <h1 className="page-heading">CHMS Foundation Dashboard</h1>
        <p className="page-subheading">College Hostel Management System - Real-time Database Verification</p>
      </div>

      {/* System Status Cards */}
      <div className="status-grid">
        <Card title="System Connectivity" className="status-card">
          <div className="status-indicator-row">
            <span className={`status-dot ${health?.status === 'UP' ? 'online' : 'degraded'}`}></span>
            <span className="status-text">
              API Status: <strong>{health?.status || 'UNKNOWN'}</strong>
            </span>
          </div>
          <p className="status-detail-text">Running on node environment: <code>{health?.environment || 'development'}</code></p>
        </Card>

        <Card title="Database Verification" className="status-card">
          <div className="status-indicator-row">
            <span className={`status-dot ${isDbConnected ? 'online' : 'offline'}`}></span>
            <span className="status-text">
              MySQL: <strong>{isDbConnected ? 'CONNECTED' : 'DISCONNECTED'}</strong>
            </span>
          </div>
          <p className="status-detail-text">Hostinger MySQL database instance verified via live health check query.</p>
        </Card>
      </div>

      {/* Hostels Section */}
      <div className="hostels-section-header">
        <h2 className="section-title">Hostels Directory (Loaded from MySQL)</h2>
        <div className="search-filter-container">
          <Input 
            placeholder="Search hostels by name or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <Button onClick={fetchData} variant="secondary">
            Refresh Data
          </Button>
        </div>
      </div>

      {filteredHostels.length === 0 ? (
        <div className="empty-hostels-state">
          <p>No hostels found matching "{searchQuery}".</p>
        </div>
      ) : (
        <div className="hostels-grid">
          {filteredHostels.map((hostel) => (
            <Card 
              key={hostel.id} 
              title={hostel.name} 
              className="hostel-card"
              footer={
                <div className="hostel-card-footer">
                  <span className="hostel-code-badge">{hostel.code}</span>
                  <span className={`hostel-gender-badge ${hostel.gender.toLowerCase()}`}>
                    {hostel.gender}
                  </span>
                </div>
              }
            >
              <div className="hostel-detail-item">
                <span className="detail-label">Location:</span>
                <span className="detail-value">{hostel.location}</span>
              </div>
              <div className="hostel-detail-item">
                <span className="detail-label">Status:</span>
                <span className="detail-value status-active">● {hostel.status}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardPlaceholder;
