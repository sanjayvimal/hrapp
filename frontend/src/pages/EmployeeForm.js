import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box, Typography, Button, TextField, Grid, Card, CardContent,
  Select, MenuItem, FormControl, InputLabel, CircularProgress,
  Alert, Divider,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import api from '../api/axios';

const INITIAL_FORM = {
  first_name: '', last_name: '', email: '', phone: '',
  date_of_birth: '', gender: '', address: '', city: '', state: '',
  country: 'India', pincode: '', department: '', designation: '',
  employment_type: 'full_time', date_of_joining: '', status: 'active',
  pan_number: '', aadhar_number: '',
  emergency_contact_name: '', emergency_contact_phone: '', emergency_contact_relation: '',
  bank_name: '', bank_account_number: '', ifsc_code: '',
};

export default function EmployeeForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(INITIAL_FORM);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(isEdit);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    api.get('/departments/').then(({ data }) => setDepartments(data.results || data));
    if (isEdit) {
      setFetchLoading(true);
      api.get(`/employees/${id}/`).then(({ data }) => {
        setForm({ ...INITIAL_FORM, ...data });
        if (data.department) {
          api.get('/designations/', { params: { department: data.department } })
            .then(({ data: dData }) => setDesignations(dData.results || dData));
        }
      }).finally(() => setFetchLoading(false));
    }
  }, [id, isEdit]);

  const handleDeptChange = (deptId) => {
    setForm((f) => ({ ...f, department: deptId, designation: '' }));
    if (deptId) {
      api.get('/designations/', { params: { department: deptId } })
        .then(({ data }) => setDesignations(data.results || data));
    } else {
      setDesignations([]);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const payload = { ...form };
      if (!payload.department) payload.department = null;
      if (!payload.designation) payload.designation = null;

      if (isEdit) {
        await api.patch(`/employees/${id}/`, payload);
        setSuccess('Employee updated successfully!');
      } else {
        await api.post('/employees/', payload);
        setSuccess('Employee added successfully!');
        setTimeout(() => navigate('/employees'), 1500);
      }
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === 'object') {
        const msgs = Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`);
        setError(msgs.join('\n'));
      } else {
        setError('Failed to save employee. Please check the form.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>;
  }

  const Section = ({ title }) => (
    <Box mt={3} mb={1}>
      <Typography variant="subtitle1" fontWeight={600} color="primary">{title}</Typography>
      <Divider />
    </Box>
  );

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/employees')}>
          Back
        </Button>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            {isEdit ? 'Edit Employee' : 'Add New Employee'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isEdit ? 'Update employee information' : 'Fill in the details to add a new employee'}
          </Typography>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} style={{ whiteSpace: 'pre-line' }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Card>
        <CardContent sx={{ p: 3 }}>
          <Box component="form" onSubmit={handleSubmit}>
            <Section title="Personal Information" />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth required label="First Name" name="first_name" value={form.first_name} onChange={handleChange} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth required label="Last Name" name="last_name" value={form.last_name} onChange={handleChange} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth required label="Email" name="email" type="email" value={form.email} onChange={handleChange} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth required label="Phone" name="phone" value={form.phone} onChange={handleChange} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth required label="Date of Birth" name="date_of_birth" type="date" value={form.date_of_birth} onChange={handleChange} InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Gender</InputLabel>
                  <Select name="gender" value={form.gender} label="Gender" onChange={handleChange}>
                    <MenuItem value="M">Male</MenuItem>
                    <MenuItem value="F">Female</MenuItem>
                    <MenuItem value="O">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Section title="Address" />
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField fullWidth required label="Address" name="address" value={form.address} onChange={handleChange} multiline rows={2} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth required label="City" name="city" value={form.city} onChange={handleChange} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth required label="State" name="state" value={form.state} onChange={handleChange} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth label="Pincode" name="pincode" value={form.pincode} onChange={handleChange} />
              </Grid>
            </Grid>

            <Section title="Employment Details" />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Department</InputLabel>
                  <Select value={form.department || ''} label="Department" onChange={(e) => handleDeptChange(e.target.value)}>
                    <MenuItem value="">None</MenuItem>
                    {departments.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Designation</InputLabel>
                  <Select name="designation" value={form.designation || ''} label="Designation" onChange={handleChange}>
                    <MenuItem value="">None</MenuItem>
                    {designations.map((d) => <MenuItem key={d.id} value={d.id}>{d.title}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth required>
                  <InputLabel>Employment Type</InputLabel>
                  <Select name="employment_type" value={form.employment_type} label="Employment Type" onChange={handleChange}>
                    <MenuItem value="full_time">Full Time</MenuItem>
                    <MenuItem value="part_time">Part Time</MenuItem>
                    <MenuItem value="contract">Contract</MenuItem>
                    <MenuItem value="intern">Intern</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth required label="Date of Joining" name="date_of_joining" type="date" value={form.date_of_joining} onChange={handleChange} InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select name="status" value={form.status} label="Status" onChange={handleChange}>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                    <MenuItem value="on_leave">On Leave</MenuItem>
                    <MenuItem value="terminated">Terminated</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Section title="Identity Documents" />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="PAN Number" name="pan_number" value={form.pan_number} onChange={handleChange} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Aadhar Number" name="aadhar_number" value={form.aadhar_number} onChange={handleChange} />
              </Grid>
            </Grid>

            <Section title="Emergency Contact" />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth label="Contact Name" name="emergency_contact_name" value={form.emergency_contact_name} onChange={handleChange} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth label="Contact Phone" name="emergency_contact_phone" value={form.emergency_contact_phone} onChange={handleChange} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth label="Relation" name="emergency_contact_relation" value={form.emergency_contact_relation} onChange={handleChange} />
              </Grid>
            </Grid>

            <Section title="Bank Details" />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth label="Bank Name" name="bank_name" value={form.bank_name} onChange={handleChange} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth label="Account Number" name="bank_account_number" value={form.bank_account_number} onChange={handleChange} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth label="IFSC Code" name="ifsc_code" value={form.ifsc_code} onChange={handleChange} />
              </Grid>
            </Grid>

            <Box mt={4} display="flex" gap={2} justifyContent="flex-end">
              <Button variant="outlined" onClick={() => navigate('/employees')}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                disabled={loading}
              >
                {isEdit ? 'Update Employee' : 'Save Employee'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
