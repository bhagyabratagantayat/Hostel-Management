import React, { useState, useEffect } from 'react';
import api from '../services/api';

const StudentAccommodationPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    api.getMyAllocation()
      .then(res => {
        setData(res.data?.data || res.data || null);
      })
      .catch(err => {
        console.error('Error fetching accommodation profile:', err);
        setError(err.response?.data?.message || 'Unable to load accommodation details.');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px', textAlign: 'center', color: '#64748B' }}>
        Loading your accommodation profile...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px' }}>
        <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '16px 20px', borderRadius: '10px' }}>
          {error || 'No accommodation details found.'}
        </div>
      </div>
    );
  }

  const { currentAllocation, history = [] } = data;

  return (
    <div style={{ maxWidth: '900px', margin: '30px auto', padding: '0 20px', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: '1.75rem', color: '#0F172A', marginBottom: '8px' }}>My Hostel Accommodation</h1>
      <p style={{ color: '#64748B', marginBottom: '24px' }}>View your current room assignment and complete stay history.</p>

      {/* Current Accommodation Card */}
      <div style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #3730A3 100%)', color: '#fff', padding: '24px', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(79, 70, 229, 0.3)', marginBottom: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <span style={{ background: 'rgba(255, 255, 255, 0.2)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {currentAllocation ? 'CURRENTLY ALLOCATED' : 'NOT ALLOCATED'}
            </span>
            <h2 style={{ margin: '12px 0 4px 0', fontSize: '1.6rem', fontWeight: '700' }}>
              {currentAllocation ? currentAllocation.hostel_name : 'No Active Room Assignment'}
            </h2>
            <p style={{ margin: 0, opacity: 0.9, fontSize: '0.95rem' }}>
              {currentAllocation ? `${currentAllocation.hostel_code || ''} Campus Block` : 'Please contact hostel warden for room allocation.'}
            </p>
          </div>

          {currentAllocation && (
            <div style={{ background: 'rgba(255, 255, 255, 0.15)', padding: '12px 20px', borderRadius: '12px', backdropFilter: 'blur(10px)', textAlign: 'right' }}>
              <div style={{ fontSize: '0.85rem', opacity: '0.8' }}>Room & Bed</div>
              <div style={{ fontSize: '1.4rem', fontWeight: '800' }}>
                Room {currentAllocation.room_number} &bull; Bed {currentAllocation.bed_number}
              </div>
            </div>
          )}
        </div>

        {currentAllocation && (
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.2)', display: 'flex', gap: '24px', fontSize: '0.9rem' }}>
            <div>
              <span style={{ opacity: 0.85 }}>Occupancy Since: </span>
              <strong>{currentAllocation.allocated_from ? currentAllocation.allocated_from.slice(0, 10) : 'N/A'}</strong>
            </div>
          </div>
        )}
      </div>

      {/* Stay History Timeline */}
      <div style={{ background: '#fff', border: '1px solid #E2E8F0', padding: '24px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <h3 style={{ fontSize: '1.15rem', color: '#1E293B', marginBottom: '20px' }}>📜 Allocation History</h3>

        {history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px', color: '#94A3B8' }}>No accommodation history records on file.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {history.map(item => (
              <div
                key={item.id}
                style={{
                  borderLeft: `4px solid ${
                    item.status === 'ACTIVE' ? '#10B981' : (item.status === 'TRANSFERRED' ? '#3B82F6' : '#EF4444')
                  }`,
                  background: '#F8FAFC',
                  padding: '16px',
                  borderRadius: '0 10px 10px 0',
                  borderTop: '1px solid #F1F5F9',
                  borderRight: '1px solid #F1F5F9',
                  borderBottom: '1px solid #F1F5F9'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ fontWeight: '700', fontSize: '1rem', color: '#0F172A' }}>
                    {item.hostel_name} &bull; Room {item.room_number} &bull; Bed {item.bed_number}
                  </div>
                  <span
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: '700',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      background: item.status === 'ACTIVE' ? '#D1FAE5' : (item.status === 'TRANSFERRED' ? '#DBEAFE' : '#FEE2E2'),
                      color: item.status === 'ACTIVE' ? '#065F46' : (item.status === 'TRANSFERRED' ? '#1E40AF' : '#991B1B')
                    }}
                  >
                    {item.status}
                  </span>
                </div>

                <div style={{ fontSize: '0.88rem', color: '#64748B' }}>
                  <strong>Duration:</strong> {item.allocated_from ? item.allocated_from.slice(0, 10) : 'N/A'} {item.allocated_until ? `to ${item.allocated_until.slice(0, 10)}` : 'to Present'}
                </div>

                {item.transfer_reason && (
                  <div style={{ fontSize: '0.85rem', color: '#2563EB', marginTop: '6px' }}>
                    <strong>Transfer Reason:</strong> {item.transfer_reason}
                  </div>
                )}

                {item.checkout_reason && (
                  <div style={{ fontSize: '0.85rem', color: '#DC2626', marginTop: '6px' }}>
                    <strong>Checkout Reason:</strong> {item.checkout_reason} {item.custom_reason ? `(${item.custom_reason})` : ''}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentAccommodationPage;
