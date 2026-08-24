import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Loading from '../components/Loading';

const DataIntegrityPage = () => {
  const [integrityData, setIntegrityData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [activeSeverity, setActiveSeverity] = useState('ALL');

  // Repair Action State
  const [repairingIssue, setRepairingIssue] = useState(null);
  const [repairing, setRepairing] = useState(false);
  const [repairSuccessMsg, setRepairSuccessMsg] = useState(null);

  useEffect(() => {
    runDiagnosticCheck();
  }, []);

  const runDiagnosticCheck = async () => {
    try {
      setScanning(true);
      setError(null);
      setRepairSuccessMsg(null);
      const res = await api.getDataIntegrity();
      if (res.success) {
        setIntegrityData(res.data);
      } else {
        setError(res.message || 'Failed to complete data integrity scan.');
      }
    } catch (err) {
      setError(err.message || 'Error running data integrity scan.');
    } finally {
      setLoading(false);
      setScanning(false);
    }
  };

  const handleExecuteRepair = async (issue, action) => {
    if (!window.confirm(`Are you sure you want to perform repair "${action}" for ${issue.title}?`)) {
      return;
    }

    try {
      setRepairing(true);
      setError(null);
      setRepairSuccessMsg(null);

      const res = await api.repairDataIntegrity(issue.type, issue.target_id || issue.id, action);
      if (res.success) {
        setRepairSuccessMsg(`✅ Successfully repaired: ${issue.title}`);
        runDiagnosticCheck();
      } else {
        setError(res.message || 'Failed to repair integrity issue.');
      }
    } catch (err) {
      setError(err.message || 'Error executing repair action.');
    } finally {
      setRepairing(false);
      setRepairingIssue(null);
    }
  };

  if (loading) return <Loading message="Initializing Data Integrity Center..." />;

  const summary = integrityData?.summary || { critical: 0, warning: 0, info: 0, totalIssues: 0 };
  const issues = integrityData?.issues || [];

  const filteredIssues = activeSeverity === 'ALL'
    ? issues
    : issues.filter(i => i.severity === activeSeverity);

  return (
    <div className="data-integrity-page">
      <div className="page-header flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <div className="breadcrumbs text-sm text-gray-500 mb-1">
            <Link to="/admin/master" className="hover:underline">Master Data</Link> / <span>Data Integrity</span>
          </div>
          <h1 className="page-heading">🛡️ Data Integrity Diagnostic Center</h1>
          <p className="page-subheading">
            Scan and detect relational inconsistencies, ghost allocations, orphaned records, and schema gaps.
          </p>
        </div>
        <button
          onClick={runDiagnosticCheck}
          disabled={scanning}
          className="btn btn-indigo flex items-center gap-2"
        >
          <span>{scanning ? '🔄' : '🔍'}</span>
          {scanning ? 'Scanning System...' : 'Run Integrity Scan'}
        </button>
      </div>

      {error && <div className="alert alert-error mb-4">⚠️ {error}</div>}
      {repairSuccessMsg && <div className="alert alert-success mb-4">{repairSuccessMsg}</div>}

      {/* Severity Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div
          onClick={() => setActiveSeverity('ALL')}
          className={`cursor-pointer border rounded-lg p-5 bg-white shadow-sm transition ${
            activeSeverity === 'ALL' ? 'border-indigo-600 ring-2 ring-indigo-100' : ''
          }`}
        >
          <div className="text-xs font-semibold text-gray-500 uppercase">Total Issues Detected</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{summary.totalIssues}</div>
          <div className="text-xs text-gray-400 mt-1">Across 15 integrity rules</div>
        </div>

        <div
          onClick={() => setActiveSeverity('CRITICAL')}
          className={`cursor-pointer border rounded-lg p-5 bg-white shadow-sm transition ${
            activeSeverity === 'CRITICAL' ? 'border-rose-600 ring-2 ring-rose-100' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-600 uppercase">CRITICAL</span>
            <span className="badge badge-danger">High Risk</span>
          </div>
          <div className="text-2xl font-bold text-rose-600 mt-1">{summary.critical}</div>
          <div className="text-xs text-gray-400 mt-1">Allocation / Occupancy mismatches</div>
        </div>

        <div
          onClick={() => setActiveSeverity('WARNING')}
          className={`cursor-pointer border rounded-lg p-5 bg-white shadow-sm transition ${
            activeSeverity === 'WARNING' ? 'border-amber-600 ring-2 ring-amber-100' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-600 uppercase">WARNING</span>
            <span className="badge badge-warning">Medium Risk</span>
          </div>
          <div className="text-2xl font-bold text-amber-600 mt-1">{summary.warning}</div>
          <div className="text-xs text-gray-400 mt-1">Status inconsistencies & duplicates</div>
        </div>

        <div
          onClick={() => setActiveSeverity('INFO')}
          className={`cursor-pointer border rounded-lg p-5 bg-white shadow-sm transition ${
            activeSeverity === 'INFO' ? 'border-blue-600 ring-2 ring-blue-100' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-600 uppercase">INFO</span>
            <span className="badge badge-info">Low Risk</span>
          </div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{summary.info}</div>
          <div className="text-xs text-gray-400 mt-1">Missing metadata / optional fields</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b mb-6 pb-2 overflow-x-auto">
        {['ALL', 'CRITICAL', 'WARNING', 'INFO'].map((sev) => (
          <button
            key={sev}
            onClick={() => setActiveSeverity(sev)}
            className={`px-4 py-2 text-sm font-medium rounded-t-md transition whitespace-nowrap ${
              activeSeverity === sev
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {sev} ({sev === 'ALL' ? summary.totalIssues : (summary[sev.toLowerCase()] || 0)})
          </button>
        ))}
      </div>

      {/* Issues List */}
      {filteredIssues.length === 0 ? (
        <div className="bg-white p-8 rounded-lg text-center border">
          <span className="text-4xl">🎉</span>
          <h3 className="font-bold text-gray-800 mt-2">Zero Integrity Issues Found</h3>
          <p className="text-sm text-gray-500 mt-1">
            All master data relationships, room allocations, and bed occupancy states are 100% healthy.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredIssues.map((issue, idx) => (
            <div
              key={idx}
              className={`bg-white p-5 rounded-lg border shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
                issue.severity === 'CRITICAL' ? 'border-l-4 border-l-rose-500' :
                (issue.severity === 'WARNING' ? 'border-l-4 border-l-amber-500' : 'border-l-4 border-l-blue-500')
              }`}
            >
              <div className="space-y-1 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className={`badge ${
                    issue.severity === 'CRITICAL' ? 'badge-danger' :
                    (issue.severity === 'WARNING' ? 'badge-warning' : 'badge-info')
                  }`}>
                    {issue.severity}
                  </span>
                  <h3 className="font-bold text-gray-900">{issue.title}</h3>
                </div>
                <p className="text-sm text-gray-600">{issue.description}</p>
                {issue.location && (
                  <div className="text-xs text-gray-400 font-mono">
                    Entity: {issue.entity} | ID: {issue.target_id || 'N/A'} | Location: {issue.location}
                  </div>
                )}
              </div>

              {/* Controlled Individual Repair Actions */}
              <div className="flex flex-wrap gap-2 pt-2 md:pt-0 border-t md:border-t-0 w-full md:w-auto justify-end">
                {issue.repair_actions && issue.repair_actions.length > 0 ? (
                  issue.repair_actions.map((act, aIdx) => (
                    <button
                      key={aIdx}
                      disabled={repairing}
                      onClick={() => handleExecuteRepair(issue, act.action)}
                      className="btn btn-sm btn-indigo text-xs whitespace-nowrap"
                    >
                      {act.label}
                    </button>
                  ))
                ) : (
                  <span className="text-xs text-gray-400 italic">Manual Review Required</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DataIntegrityPage;
