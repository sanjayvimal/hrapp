import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Grid, Card, CardContent, CardActions,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, IconButton, Chip, CircularProgress, Alert,
  List, ListItem, ListItemText, Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import BusinessIcon from '@mui/icons-material/Business';
import PeopleIcon from '@mui/icons-material/People';
import api from '../api/axios';

export default function Departments() {
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deptDialog, setDeptDialog] = useState({ open: false, data: null });
  const [desigDialog, setDesigDialog] = useState({ open: false, data: null, deptId: null });
  const [form, setForm] = useState({ name: '', description: '' });
  const [desigForm, setDesigForm] = useState({ title: '', department: '', description: '' });
  const [error, setError] = useState('');

  const fetchAll = async () => {
    setLoading(true);
    const [deptRes, desigRes] = await Promise.all([
      api.get('/departments/'),
      api.get('/designations/'),
    ]);
    setDepartments(deptRes.data.results || deptRes.data);
    setDesignations(desigRes.data.results || desigRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const openDeptDialog = (dept = null) => {
    setForm(dept ? { name: dept.name, description: dept.description } : { name: '', description: '' });
    setDeptDialog({ open: true, data: dept });
    setError('');
  };

  const saveDept = async () => {
    try {
      if (deptDialog.data) {
        await api.patch(`/departments/${deptDialog.data.id}/`, form);
      } else {
        await api.post('/departments/', form);
      }
      setDeptDialog({ open: false, data: null });
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.name?.[0] || 'Failed to save department');
    }
  };

  const deleteDept = async (id) => {
    if (!window.confirm('Delete this department? All designations will also be deleted.')) return;
    await api.delete(`/departments/${id}/`);
    fetchAll();
  };

  const openDesigDialog = (deptId, desig = null) => {
    setDesigForm(desig
      ? { title: desig.title, department: deptId, description: desig.description }
      : { title: '', department: deptId, description: '' }
    );
    setDesigDialog({ open: true, data: desig, deptId });
    setError('');
  };

  const saveDesig = async () => {
    try {
      if (desigDialog.data) {
        await api.patch(`/designations/${desigDialog.data.id}/`, desigForm);
      } else {
        await api.post('/designations/', desigForm);
      }
      setDesigDialog({ open: false, data: null, deptId: null });
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.title?.[0] || 'Failed to save designation');
    }
  };

  const deleteDesig = async (id) => {
    if (!window.confirm('Delete this designation?')) return;
    await api.delete(`/designations/${id}/`);
    fetchAll();
  };

  if (loading) return <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Departments & Designations</Typography>
          <Typography variant="body2" color="text.secondary">Manage organizational structure</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => openDeptDialog()}>
          Add Department
        </Button>
      </Box>

      <Grid container spacing={3}>
        {departments.map((dept) => {
          const deptDesigs = designations.filter((d) => d.department === dept.id);
          return (
            <Grid item xs={12} md={6} lg={4} key={dept.id}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box display="flex" gap={1.5} alignItems="center">
                      <Box sx={{ bgcolor: 'primary.light', p: 1, borderRadius: 1 }}>
                        <BusinessIcon color="primary" />
                      </Box>
                      <Box>
                        <Typography variant="h6" fontWeight={600}>{dept.name}</Typography>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <PeopleIcon fontSize="small" color="action" />
                          <Typography variant="caption" color="text.secondary">
                            {dept.employee_count} employee(s)
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                    <Box>
                      <IconButton size="small" onClick={() => openDeptDialog(dept)}><EditIcon fontSize="small" /></IconButton>
                      <IconButton size="small" color="error" onClick={() => deleteDept(dept.id)}><DeleteIcon fontSize="small" /></IconButton>
                    </Box>
                  </Box>

                  {dept.description && (
                    <Typography variant="body2" color="text.secondary" mt={1}>{dept.description}</Typography>
                  )}

                  <Divider sx={{ my: 2 }} />
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="subtitle2" fontWeight={600}>Designations</Typography>
                    <Button size="small" startIcon={<AddIcon />} onClick={() => openDesigDialog(dept.id)}>
                      Add
                    </Button>
                  </Box>

                  {deptDesigs.length === 0 ? (
                    <Typography variant="caption" color="text.secondary">No designations yet</Typography>
                  ) : (
                    <List dense disablePadding>
                      {deptDesigs.map((desig) => (
                        <ListItem
                          key={desig.id}
                          disablePadding
                          secondaryAction={
                            <Box>
                              <IconButton size="small" onClick={() => openDesigDialog(dept.id, desig)}><EditIcon sx={{ fontSize: 14 }} /></IconButton>
                              <IconButton size="small" color="error" onClick={() => deleteDesig(desig.id)}><DeleteIcon sx={{ fontSize: 14 }} /></IconButton>
                            </Box>
                          }
                        >
                          <ListItemText
                            primary={desig.title}
                            secondary={`${desig.employee_count} emp.`}
                            primaryTypographyProps={{ variant: 'body2' }}
                            secondaryTypographyProps={{ variant: 'caption' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
        {departments.length === 0 && (
          <Grid item xs={12}>
            <Box textAlign="center" py={8} color="text.secondary">
              <BusinessIcon sx={{ fontSize: 60, opacity: 0.3 }} />
              <Typography mt={1}>No departments yet. Add your first department.</Typography>
            </Box>
          </Grid>
        )}
      </Grid>

      {/* Department Dialog */}
      <Dialog open={deptDialog.open} onClose={() => setDeptDialog({ open: false, data: null })} maxWidth="sm" fullWidth>
        <DialogTitle>{deptDialog.data ? 'Edit Department' : 'Add Department'}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <TextField fullWidth label="Department Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} margin="normal" required />
          <TextField fullWidth label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} margin="normal" multiline rows={3} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeptDialog({ open: false, data: null })}>Cancel</Button>
          <Button variant="contained" onClick={saveDept}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Designation Dialog */}
      <Dialog open={desigDialog.open} onClose={() => setDesigDialog({ open: false, data: null, deptId: null })} maxWidth="sm" fullWidth>
        <DialogTitle>{desigDialog.data ? 'Edit Designation' : 'Add Designation'}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <TextField fullWidth label="Designation Title" value={desigForm.title} onChange={(e) => setDesigForm({ ...desigForm, title: e.target.value })} margin="normal" required />
          <TextField fullWidth label="Description" value={desigForm.description} onChange={(e) => setDesigForm({ ...desigForm, description: e.target.value })} margin="normal" multiline rows={2} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDesigDialog({ open: false, data: null, deptId: null })}>Cancel</Button>
          <Button variant="contained" onClick={saveDesig}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
