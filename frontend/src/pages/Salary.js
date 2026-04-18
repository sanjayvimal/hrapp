import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, Grid, Card, CardContent,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, CircularProgress, Alert, Select, MenuItem, FormControl,
  InputLabel, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Tabs, Tab, IconButton, Tooltip, Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EditIcon from '@mui/icons-material/Edit';
import api from '../api/axios';

const MONTHS = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const INITIAL_STRUCT = {
  employee: '', basic_salary: '', hra: '', transport_allowance: '',
  medical_allowance: '', other_allowances: '', pf_deduction: '',
  esi_deduction: '', tax_deduction: '', other_deductions: '', effective_from: '',
};

export default function Salary() {
  const [tab, setTab] = useState(0);
  const [structures, setStructures] = useState([]);
  const [payslips, setPayslips] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [structDialog, setStructDialog] = useState({ open: false, data: null });
  const [generateDialog, setGenerateDialog] = useState(false);
  const [structForm, setStructForm] = useState(INITIAL_STRUCT);
  const [generateForm, setGenerateForm] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState(String(new Date().getFullYear()));
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const params = {};
    if (filterMonth) params.month = filterMonth;
    if (filterYear) params.year = filterYear;
    const [strRes, slipRes] = await Promise.all([
      api.get('/salary-structures/'),
      api.get('/payslips/', { params }),
    ]);
    setStructures(strRes.data.results || strRes.data);
    setPayslips(slipRes.data.results || slipRes.data);
    setLoading(false);
  }, [filterMonth, filterYear]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    api.get('/employees/', { params: { status: 'active', page_size: 200 } })
      .then(({ data }) => setEmployees(data.results || data));
  }, []);

  const openStructDialog = (s = null) => {
    setStructForm(s ? {
      employee: s.employee, basic_salary: s.basic_salary, hra: s.hra,
      transport_allowance: s.transport_allowance, medical_allowance: s.medical_allowance,
      other_allowances: s.other_allowances, pf_deduction: s.pf_deduction,
      esi_deduction: s.esi_deduction, tax_deduction: s.tax_deduction,
      other_deductions: s.other_deductions, effective_from: s.effective_from,
    } : INITIAL_STRUCT);
    setStructDialog({ open: true, data: s });
    setError('');
  };

  const saveStructure = async () => {
    setError('');
    try {
      if (structDialog.data) {
        await api.patch(`/salary-structures/${structDialog.data.id}/`, structForm);
      } else {
        await api.post('/salary-structures/', structForm);
      }
      setStructDialog({ open: false, data: null });
      setSuccess('Salary structure saved!');
      fetchAll();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const data = err.response?.data;
      setError(data ? Object.values(data).flat().join(', ') : 'Failed to save');
    }
  };

  const generatePayslips = async () => {
    setError('');
    try {
      const { data } = await api.post('/payslips/generate/', generateForm);
      setGenerateDialog(false);
      setSuccess(`Generated ${data.generated} payslip(s). ${data.errors.length} error(s).`);
      fetchAll();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError('Failed to generate payslips');
    }
  };

  const markPaid = async (id) => {
    await api.post(`/payslips/${id}/mark_paid/`, {});
    setSuccess('Payslip marked as paid!');
    fetchAll();
    setTimeout(() => setSuccess(''), 3000);
  };

  const fmt = (n) => n ? `₹${Number(n).toLocaleString('en-IN')}` : '₹0';

  const grossSalary = (f) => {
    return [f.basic_salary, f.hra, f.transport_allowance, f.medical_allowance, f.other_allowances]
      .reduce((a, b) => a + (parseFloat(b) || 0), 0);
  };

  const totalDeductions = (f) => {
    return [f.pf_deduction, f.esi_deduction, f.tax_deduction, f.other_deductions]
      .reduce((a, b) => a + (parseFloat(b) || 0), 0);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Salary & Payroll</Typography>
          <Typography variant="body2" color="text.secondary">Manage salary structures and payslips</Typography>
        </Box>
        <Box display="flex" gap={1}>
          {tab === 0 && (
            <Button variant="outlined" startIcon={<AddIcon />} onClick={() => openStructDialog()}>
              Add Structure
            </Button>
          )}
          {tab === 1 && (
            <Button variant="contained" startIcon={<PlayArrowIcon />} onClick={() => setGenerateDialog(true)}>
              Generate Payslips
            </Button>
          )}
        </Box>
      </Box>

      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Salary Structures" />
        <Tab label="Payslips" />
      </Tabs>

      {tab === 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell>Employee</TableCell>
                <TableCell>Basic</TableCell>
                <TableCell>HRA</TableCell>
                <TableCell>Allowances</TableCell>
                <TableCell>Gross</TableCell>
                <TableCell>Deductions</TableCell>
                <TableCell>Net</TableCell>
                <TableCell>Effective From</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={9} align="center" sx={{ py: 5 }}><CircularProgress /></TableCell></TableRow>
              ) : structures.length === 0 ? (
                <TableRow><TableCell colSpan={9} align="center" sx={{ py: 5, color: 'text.secondary' }}>No salary structures. Add one to get started.</TableCell></TableRow>
              ) : structures.map((s) => (
                <TableRow key={s.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{s.employee_name}</Typography>
                    <Typography variant="caption" color="text.secondary">{s.employee_id_code}</Typography>
                  </TableCell>
                  <TableCell>{fmt(s.basic_salary)}</TableCell>
                  <TableCell>{fmt(s.hra)}</TableCell>
                  <TableCell>{fmt(parseFloat(s.transport_allowance || 0) + parseFloat(s.medical_allowance || 0) + parseFloat(s.other_allowances || 0))}</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'success.main' }}>{fmt(s.gross_salary)}</TableCell>
                  <TableCell sx={{ color: 'error.main' }}>{fmt(s.total_deductions)}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{fmt(s.net_salary)}</TableCell>
                  <TableCell>{s.effective_from}</TableCell>
                  <TableCell align="center">
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => openStructDialog(s)}><EditIcon fontSize="small" /></IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {tab === 1 && (
        <>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Box display="flex" gap={2}>
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>Month</InputLabel>
                <Select value={filterMonth} label="Month" onChange={(e) => setFilterMonth(e.target.value)}>
                  <MenuItem value="">All</MenuItem>
                  {MONTHS.slice(1).map((m, i) => <MenuItem key={i + 1} value={i + 1}>{m}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField size="small" label="Year" type="number" value={filterYear} onChange={(e) => setFilterYear(e.target.value)} sx={{ width: 100 }} />
            </Box>
          </Paper>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell>Employee</TableCell>
                  <TableCell>Month/Year</TableCell>
                  <TableCell>Working Days</TableCell>
                  <TableCell>Paid Days</TableCell>
                  <TableCell>Gross</TableCell>
                  <TableCell>Deductions</TableCell>
                  <TableCell>Net Salary</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={9} align="center" sx={{ py: 5 }}><CircularProgress /></TableCell></TableRow>
                ) : payslips.length === 0 ? (
                  <TableRow><TableCell colSpan={9} align="center" sx={{ py: 5, color: 'text.secondary' }}>No payslips found. Generate payslips to get started.</TableCell></TableRow>
                ) : payslips.map((p) => (
                  <TableRow key={p.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{p.employee_name}</Typography>
                      <Typography variant="caption" color="text.secondary">{p.employee_id_code}</Typography>
                    </TableCell>
                    <TableCell>{p.month_name} {p.year}</TableCell>
                    <TableCell>{p.working_days}</TableCell>
                    <TableCell>{p.paid_days}</TableCell>
                    <TableCell sx={{ color: 'success.main' }}>{fmt(p.gross_salary)}</TableCell>
                    <TableCell sx={{ color: 'error.main' }}>{fmt(p.total_deductions)}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{fmt(p.net_salary)}</TableCell>
                    <TableCell>
                      <Chip label={p.is_paid ? 'Paid' : 'Pending'} size="small" color={p.is_paid ? 'success' : 'warning'} />
                    </TableCell>
                    <TableCell align="center">
                      {!p.is_paid && (
                        <Tooltip title="Mark as Paid">
                          <IconButton size="small" color="success" onClick={() => markPaid(p.id)}>
                            <CheckCircleIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {/* Salary Structure Dialog */}
      <Dialog open={structDialog.open} onClose={() => setStructDialog({ open: false, data: null })} maxWidth="md" fullWidth>
        <DialogTitle>{structDialog.data ? 'Edit Salary Structure' : 'Add Salary Structure'}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Employee</InputLabel>
                <Select value={structForm.employee} label="Employee" onChange={(e) => setStructForm({ ...structForm, employee: e.target.value })}>
                  {employees.map((e) => <MenuItem key={e.id} value={e.id}>{e.full_name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth required type="date" label="Effective From" value={structForm.effective_from} onChange={(e) => setStructForm({ ...structForm, effective_from: e.target.value })} InputLabelProps={{ shrink: true }} />
            </Grid>

            <Grid item xs={12}><Typography variant="subtitle2" color="primary" fontWeight={600}>Earnings</Typography><Divider /></Grid>
            <Grid item xs={6} sm={4}><TextField fullWidth required label="Basic Salary" type="number" value={structForm.basic_salary} onChange={(e) => setStructForm({ ...structForm, basic_salary: e.target.value })} /></Grid>
            <Grid item xs={6} sm={4}><TextField fullWidth label="HRA" type="number" value={structForm.hra} onChange={(e) => setStructForm({ ...structForm, hra: e.target.value })} /></Grid>
            <Grid item xs={6} sm={4}><TextField fullWidth label="Transport Allowance" type="number" value={structForm.transport_allowance} onChange={(e) => setStructForm({ ...structForm, transport_allowance: e.target.value })} /></Grid>
            <Grid item xs={6} sm={4}><TextField fullWidth label="Medical Allowance" type="number" value={structForm.medical_allowance} onChange={(e) => setStructForm({ ...structForm, medical_allowance: e.target.value })} /></Grid>
            <Grid item xs={6} sm={4}><TextField fullWidth label="Other Allowances" type="number" value={structForm.other_allowances} onChange={(e) => setStructForm({ ...structForm, other_allowances: e.target.value })} /></Grid>
            <Grid item xs={6} sm={4}>
              <Card variant="outlined">
                <CardContent sx={{ py: 1 }}>
                  <Typography variant="caption" color="text.secondary">Gross Salary</Typography>
                  <Typography variant="h6" color="success.main" fontWeight={700}>
                    {fmt(grossSalary(structForm))}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}><Typography variant="subtitle2" color="error" fontWeight={600}>Deductions</Typography><Divider /></Grid>
            <Grid item xs={6} sm={3}><TextField fullWidth label="PF Deduction" type="number" value={structForm.pf_deduction} onChange={(e) => setStructForm({ ...structForm, pf_deduction: e.target.value })} /></Grid>
            <Grid item xs={6} sm={3}><TextField fullWidth label="ESI Deduction" type="number" value={structForm.esi_deduction} onChange={(e) => setStructForm({ ...structForm, esi_deduction: e.target.value })} /></Grid>
            <Grid item xs={6} sm={3}><TextField fullWidth label="Tax Deduction" type="number" value={structForm.tax_deduction} onChange={(e) => setStructForm({ ...structForm, tax_deduction: e.target.value })} /></Grid>
            <Grid item xs={6} sm={3}><TextField fullWidth label="Other Deductions" type="number" value={structForm.other_deductions} onChange={(e) => setStructForm({ ...structForm, other_deductions: e.target.value })} /></Grid>
            <Grid item xs={12}>
              <Box display="flex" justifyContent="space-between">
                <Box>
                  <Typography variant="caption" color="text.secondary">Total Deductions</Typography>
                  <Typography variant="h6" color="error.main">{fmt(totalDeductions(structForm))}</Typography>
                </Box>
                <Box textAlign="right">
                  <Typography variant="caption" color="text.secondary">Net Salary</Typography>
                  <Typography variant="h5" fontWeight={700}>{fmt(grossSalary(structForm) - totalDeductions(structForm))}</Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStructDialog({ open: false, data: null })}>Cancel</Button>
          <Button variant="contained" onClick={saveStructure}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Generate Payslips Dialog */}
      <Dialog open={generateDialog} onClose={() => setGenerateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Generate Payslips</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            This will generate payslips for all active employees with salary structures for the selected month.
          </Typography>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={6}>
              <FormControl fullWidth required>
                <InputLabel>Month</InputLabel>
                <Select value={generateForm.month} label="Month" onChange={(e) => setGenerateForm({ ...generateForm, month: e.target.value })}>
                  {MONTHS.slice(1).map((m, i) => <MenuItem key={i + 1} value={i + 1}>{m}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth required label="Year" type="number" value={generateForm.year} onChange={(e) => setGenerateForm({ ...generateForm, year: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGenerateDialog(false)}>Cancel</Button>
          <Button variant="contained" startIcon={<PlayArrowIcon />} onClick={generatePayslips}>
            Generate
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
