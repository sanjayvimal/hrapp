import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, Grid, Card, CardContent,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, CircularProgress, Alert, Select, MenuItem, FormControl,
  InputLabel, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Tabs, Tab, IconButton, Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import SettingsIcon from '@mui/icons-material/Settings';
import api from '../api/axios';

const STATUS_COLORS = { pending: 'warning', approved: 'success', rejected: 'error', cancelled: 'default' };

export default function Leaves() {
  const [tab, setTab] = useState(0);
  const [applications, setApplications] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [applyDialog, setApplyDialog] = useState(false);
  const [typeDialog, setTypeDialog] = useState({ open: false, data: null });
  const [remarkDialog, setRemarkDialog] = useState({ open: false, action: null, id: null });
  const [form, setForm] = useState({ employee: '', leave_type: '', start_date: '', end_date: '', days: '', reason: '' });
  const [typeForm, setTypeForm] = useState({ name: '', max_days_per_year: 0, is_paid: true, description: '' });
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const params = {};
    if (filterStatus) params.status = filterStatus;
    const [appRes, typeRes, statsRes] = await Promise.all([
      api.get('/leave-applications/', { params }),
      api.get('/leave-types/'),
      api.get('/leave-applications/stats/'),
    ]);
    setApplications(appRes.data.results || appRes.data);
    setLeaveTypes(typeRes.data.results || typeRes.data);
    setStats(statsRes.data);
    setLoading(false);
  }, [filterStatus]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    api.get('/employees/', { params: { status: 'active', page_size: 200 } })
      .then(({ data }) => setEmployees(data.results || data));
  }, []);

  const applyLeave = async () => {
    setError('');
    try {
      await api.post('/leave-applications/', form);
      setApplyDialog(false);
      setSuccess('Leave application submitted!');
      fetchAll();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const data = err.response?.data;
      setError(data ? Object.values(data).flat().join(', ') : 'Failed to submit leave');
    }
  };

  const handleAction = async () => {
    const { action, id } = remarkDialog;
    try {
      await api.post(`/leave-applications/${id}/${action}/`, { remarks });
      setRemarkDialog({ open: false, action: null, id: null });
      setRemarks('');
      setSuccess(`Leave ${action}d successfully!`);
      fetchAll();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Action failed');
    }
  };

  const saveLeaveType = async () => {
    try {
      if (typeDialog.data) {
        await api.patch(`/leave-types/${typeDialog.data.id}/`, typeForm);
      } else {
        await api.post('/leave-types/', typeForm);
      }
      setTypeDialog({ open: false, data: null });
      fetchAll();
    } catch (err) {
      setError('Failed to save leave type');
    }
  };

  const openTypeDialog = (lt = null) => {
    setTypeForm(lt ? { name: lt.name, max_days_per_year: lt.max_days_per_year, is_paid: lt.is_paid, description: lt.description } : { name: '', max_days_per_year: 0, is_paid: true, description: '' });
    setTypeDialog({ open: true, data: lt });
  };

  const calcDays = (start, end) => {
    if (!start || !end) return '';
    const diff = (new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24) + 1;
    return diff > 0 ? diff : '';
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Leave Management</Typography>
          <Typography variant="body2" color="text.secondary">Manage employee leaves and requests</Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button variant="outlined" startIcon={<SettingsIcon />} onClick={() => openTypeDialog()}>
            Leave Types
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setForm({ employee: '', leave_type: '', start_date: '', end_date: '', days: '', reason: '' }); setApplyDialog(true); }}>
            Apply Leave
          </Button>
        </Box>
      </Box>

      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      {stats && (
        <Grid container spacing={2} mb={3}>
          {[
            { label: 'Pending', value: stats.pending, color: 'warning.main' },
            { label: 'Approved', value: stats.approved, color: 'success.main' },
            { label: 'Rejected', value: stats.rejected, color: 'error.main' },
          ].map(({ label, value, color }) => (
            <Grid item xs={4} key={label}>
              <Card>
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="h4" fontWeight={700} sx={{ color }}>{value}</Typography>
                  <Typography variant="body2" color="text.secondary">{label}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Leave Applications" />
        <Tab label="Leave Types" />
      </Tabs>

      {tab === 0 && (
        <>
          <Paper sx={{ p: 2, mb: 2 }}>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select value={filterStatus} label="Status" onChange={(e) => setFilterStatus(e.target.value)}>
                <MenuItem value="">All</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Paper>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell>Employee</TableCell>
                  <TableCell>Leave Type</TableCell>
                  <TableCell>From</TableCell>
                  <TableCell>To</TableCell>
                  <TableCell>Days</TableCell>
                  <TableCell>Reason</TableCell>
                  <TableCell>Applied On</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={9} align="center" sx={{ py: 5 }}><CircularProgress /></TableCell></TableRow>
                ) : applications.length === 0 ? (
                  <TableRow><TableCell colSpan={9} align="center" sx={{ py: 5, color: 'text.secondary' }}>No leave applications found.</TableCell></TableRow>
                ) : applications.map((app) => (
                  <TableRow key={app.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{app.employee_name}</Typography>
                      <Typography variant="caption" color="text.secondary">{app.employee_id_code}</Typography>
                    </TableCell>
                    <TableCell>{app.leave_type_name}</TableCell>
                    <TableCell>{app.start_date}</TableCell>
                    <TableCell>{app.end_date}</TableCell>
                    <TableCell>{app.days}</TableCell>
                    <TableCell sx={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {app.reason}
                    </TableCell>
                    <TableCell>{new Date(app.applied_on).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Chip label={app.status} size="small" color={STATUS_COLORS[app.status]} />
                    </TableCell>
                    <TableCell align="center">
                      {app.status === 'pending' && (
                        <>
                          <Tooltip title="Approve">
                            <IconButton size="small" color="success" onClick={() => setRemarkDialog({ open: true, action: 'approve', id: app.id })}>
                              <CheckIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reject">
                            <IconButton size="small" color="error" onClick={() => setRemarkDialog({ open: true, action: 'reject', id: app.id })}>
                              <CloseIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {tab === 1 && (
        <Grid container spacing={2}>
          {leaveTypes.map((lt) => (
            <Grid item xs={12} sm={6} md={4} key={lt.id}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Typography variant="h6" fontWeight={600}>{lt.name}</Typography>
                      <Typography variant="body2" color="text.secondary">{lt.description}</Typography>
                    </Box>
                    <IconButton size="small" onClick={() => openTypeDialog(lt)}><SettingsIcon fontSize="small" /></IconButton>
                  </Box>
                  <Box mt={2} display="flex" gap={1}>
                    <Chip label={`${lt.max_days_per_year} days/year`} size="small" variant="outlined" />
                    <Chip label={lt.is_paid ? 'Paid' : 'Unpaid'} size="small" color={lt.is_paid ? 'success' : 'default'} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ border: '2px dashed', borderColor: 'divider', cursor: 'pointer' }} onClick={() => openTypeDialog()}>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <AddIcon color="action" />
                <Typography color="text.secondary">Add Leave Type</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Apply Leave Dialog */}
      <Dialog open={applyDialog} onClose={() => setApplyDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Apply for Leave</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Employee</InputLabel>
                <Select value={form.employee} label="Employee" onChange={(e) => setForm({ ...form, employee: e.target.value })}>
                  {employees.map((e) => <MenuItem key={e.id} value={e.id}>{e.full_name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Leave Type</InputLabel>
                <Select value={form.leave_type} label="Leave Type" onChange={(e) => setForm({ ...form, leave_type: e.target.value })}>
                  {leaveTypes.map((lt) => <MenuItem key={lt.id} value={lt.id}>{lt.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth required type="date" label="Start Date" value={form.start_date}
                onChange={(e) => {
                  const d = calcDays(e.target.value, form.end_date);
                  setForm({ ...form, start_date: e.target.value, days: d });
                }}
                InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth required type="date" label="End Date" value={form.end_date}
                onChange={(e) => {
                  const d = calcDays(form.start_date, e.target.value);
                  setForm({ ...form, end_date: e.target.value, days: d });
                }}
                InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Number of Days" value={form.days}
                onChange={(e) => setForm({ ...form, days: e.target.value })} type="number" />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth required label="Reason" value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })} multiline rows={3} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApplyDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={applyLeave}>Submit</Button>
        </DialogActions>
      </Dialog>

      {/* Approve/Reject Dialog */}
      <Dialog open={remarkDialog.open} onClose={() => setRemarkDialog({ open: false, action: null, id: null })} maxWidth="sm" fullWidth>
        <DialogTitle>{remarkDialog.action === 'approve' ? 'Approve Leave' : 'Reject Leave'}</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Remarks (Optional)" value={remarks} onChange={(e) => setRemarks(e.target.value)} multiline rows={3} sx={{ mt: 1 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRemarkDialog({ open: false, action: null, id: null })}>Cancel</Button>
          <Button variant="contained" color={remarkDialog.action === 'approve' ? 'success' : 'error'} onClick={handleAction}>
            {remarkDialog.action === 'approve' ? 'Approve' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Leave Type Dialog */}
      <Dialog open={typeDialog.open} onClose={() => setTypeDialog({ open: false, data: null })} maxWidth="sm" fullWidth>
        <DialogTitle>{typeDialog.data ? 'Edit Leave Type' : 'Add Leave Type'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField fullWidth required label="Leave Type Name" value={typeForm.name} onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth type="number" label="Max Days Per Year" value={typeForm.max_days_per_year} onChange={(e) => setTypeForm({ ...typeForm, max_days_per_year: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select value={typeForm.is_paid} label="Type" onChange={(e) => setTypeForm({ ...typeForm, is_paid: e.target.value })}>
                  <MenuItem value={true}>Paid</MenuItem>
                  <MenuItem value={false}>Unpaid</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Description" value={typeForm.description} onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })} multiline rows={2} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTypeDialog({ open: false, data: null })}>Cancel</Button>
          <Button variant="contained" onClick={saveLeaveType}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
