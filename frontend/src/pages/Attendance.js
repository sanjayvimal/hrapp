import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, Grid, Card, CardContent, Select, MenuItem,
  FormControl, InputLabel, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, CircularProgress, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  IconButton, Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import api from '../api/axios';

const STATUS_OPTIONS = [
  { value: 'present', label: 'Present', color: 'success' },
  { value: 'absent', label: 'Absent', color: 'error' },
  { value: 'half_day', label: 'Half Day', color: 'warning' },
  { value: 'work_from_home', label: 'WFH', color: 'info' },
  { value: 'late', label: 'Late', color: 'warning' },
  { value: 'holiday', label: 'Holiday', color: 'default' },
  { value: 'weekend', label: 'Weekend', color: 'default' },
];

const STATUS_COLOR_MAP = Object.fromEntries(STATUS_OPTIONS.map((s) => [s.value, s.color]));

export default function Attendance() {
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dialog, setDialog] = useState({ open: false, data: null });
  const [form, setForm] = useState({ employee: '', date: today, check_in: '', check_out: '', status: 'present', notes: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const fetchAttendance = useCallback(async () => {
    setLoading(true);
    const params = { date: selectedDate };
    if (filterStatus) params.status = filterStatus;
    const [attRes, statsRes] = await Promise.all([
      api.get('/attendance/', { params }),
      api.get('/attendance/stats/'),
    ]);
    setAttendance(attRes.data.results || attRes.data);
    setStats(statsRes.data);
    setLoading(false);
  }, [selectedDate, filterStatus]);

  useEffect(() => {
    api.get('/employees/', { params: { status: 'active', page_size: 200 } })
      .then(({ data }) => setEmployees(data.results || data));
  }, []);

  useEffect(() => { fetchAttendance(); }, [fetchAttendance]);

  const openDialog = (rec = null) => {
    setForm(rec
      ? { employee: rec.employee, date: rec.date, check_in: rec.check_in || '', check_out: rec.check_out || '', status: rec.status, notes: rec.notes || '' }
      : { employee: '', date: selectedDate, check_in: '', check_out: '', status: 'present', notes: '' }
    );
    setDialog({ open: true, data: rec });
    setError('');
  };

  const saveAttendance = async () => {
    setError('');
    try {
      const payload = { ...form };
      if (!payload.check_in) payload.check_in = null;
      if (!payload.check_out) payload.check_out = null;

      if (dialog.data) {
        await api.patch(`/attendance/${dialog.data.id}/`, payload);
      } else {
        await api.post('/attendance/', payload);
      }
      setDialog({ open: false, data: null });
      setSuccess('Attendance saved!');
      fetchAttendance();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const data = err.response?.data;
      if (data?.non_field_errors) setError(data.non_field_errors[0]);
      else setError('Failed to save attendance');
    }
  };

  const markBulkPresent = async () => {
    const records = employees.map((e) => ({
      employee: e.id,
      date: selectedDate,
      status: 'present',
    }));
    await api.post('/attendance/bulk_create/', { records });
    fetchAttendance();
    setSuccess('Bulk attendance marked as present!');
    setTimeout(() => setSuccess(''), 3000);
  };

  const filteredAttendance = filterStatus
    ? attendance.filter((a) => a.status === filterStatus)
    : attendance;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Attendance</Typography>
          <Typography variant="body2" color="text.secondary">Track daily employee attendance</Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button variant="outlined" startIcon={<CheckCircleIcon />} onClick={markBulkPresent}>
            Mark All Present
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => openDialog()}>
            Add Record
          </Button>
        </Box>
      </Box>

      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      {stats && (
        <Grid container spacing={2} mb={3}>
          {[
            { label: 'Present', value: stats.present, color: '#4caf50' },
            { label: 'Absent', value: stats.absent, color: '#f44336' },
            { label: 'Late', value: stats.late, color: '#ff9800' },
            { label: 'Not Marked', value: stats.not_marked, color: '#9e9e9e' },
          ].map(({ label, value, color }) => (
            <Grid item xs={6} sm={3} key={label}>
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

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
          <TextField
            type="date"
            label="Date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
          />
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Filter Status</InputLabel>
            <Select value={filterStatus} label="Filter Status" onChange={(e) => setFilterStatus(e.target.value)}>
              <MenuItem value="">All</MenuItem>
              {STATUS_OPTIONS.map((s) => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
            </Select>
          </FormControl>
          <Box display="flex" alignItems="center" gap={1} ml="auto">
            <AccessTimeIcon color="action" fontSize="small" />
            <Typography variant="body2" color="text.secondary">
              {filteredAttendance.length} records
            </Typography>
          </Box>
        </Box>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell>Employee</TableCell>
              <TableCell>Check In</TableCell>
              <TableCell>Check Out</TableCell>
              <TableCell>Hours</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Notes</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} align="center" sx={{ py: 5 }}><CircularProgress /></TableCell></TableRow>
            ) : filteredAttendance.length === 0 ? (
              <TableRow><TableCell colSpan={7} align="center" sx={{ py: 5, color: 'text.secondary' }}>No attendance records for this date.</TableCell></TableRow>
            ) : (
              filteredAttendance.map((rec) => (
                <TableRow key={rec.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{rec.employee_name}</Typography>
                    <Typography variant="caption" color="text.secondary">{rec.employee_id_code}</Typography>
                  </TableCell>
                  <TableCell>{rec.check_in || '-'}</TableCell>
                  <TableCell>{rec.check_out || '-'}</TableCell>
                  <TableCell>{rec.hours_worked ? `${rec.hours_worked}h` : '-'}</TableCell>
                  <TableCell>
                    <Chip label={rec.status.replace('_', ' ')} size="small" color={STATUS_COLOR_MAP[rec.status] || 'default'} />
                  </TableCell>
                  <TableCell sx={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {rec.notes || '-'}
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => openDialog(rec)}><EditIcon fontSize="small" /></IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialog.open} onClose={() => setDialog({ open: false, data: null })} maxWidth="sm" fullWidth>
        <DialogTitle>{dialog.data ? 'Edit Attendance' : 'Add Attendance'}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Employee</InputLabel>
                <Select value={form.employee} label="Employee" onChange={(e) => setForm({ ...form, employee: e.target.value })}>
                  {employees.map((e) => (
                    <MenuItem key={e.id} value={e.id}>{e.full_name} ({e.employee_id})</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="date" label="Date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select value={form.status} label="Status" onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  {STATUS_OPTIONS.map((s) => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="time" label="Check In" value={form.check_in} onChange={(e) => setForm({ ...form, check_in: e.target.value })} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="time" label="Check Out" value={form.check_out} onChange={(e) => setForm({ ...form, check_out: e.target.value })} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} multiline rows={2} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog({ open: false, data: null })}>Cancel</Button>
          <Button variant="contained" onClick={saveAttendance}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
