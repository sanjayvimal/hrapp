import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box, Typography, Button, Grid, Card, CardContent, Avatar,
  Chip, Tab, Tabs, CircularProgress, Divider,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import api from '../api/axios';

const STATUS_COLORS = { active: 'success', inactive: 'default', on_leave: 'warning', terminated: 'error' };

function InfoRow({ label, value }) {
  return (
    <Box py={1} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
      <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
      <Typography variant="body2" fontWeight={500}>{value || '-'}</Typography>
    </Box>
  );
}

export default function EmployeeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [tab, setTab] = useState(0);
  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/employees/${id}/`).then(({ data }) => {
      setEmployee(data);
      setLoading(false);
    });
    api.get('/attendance/', { params: { employee: id } }).then(({ data }) => setAttendance(data.results || data));
    api.get('/leave-applications/', { params: { employee: id } }).then(({ data }) => setLeaves(data.results || data));
    api.get('/payslips/', { params: { employee: id } }).then(({ data }) => setPayslips(data.results || data));
  }, [id]);

  if (loading) return <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>;

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/employees')}>Back</Button>
        <Typography variant="h5" fontWeight={700} sx={{ flexGrow: 1 }}>Employee Profile</Typography>
        <Button variant="contained" startIcon={<EditIcon />} onClick={() => navigate(`/employees/${id}/edit`)}>
          Edit
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <Avatar
                src={employee.profile_photo}
                sx={{ width: 80, height: 80, mx: 'auto', mb: 2, bgcolor: 'primary.main', fontSize: 32 }}
              >
                {employee.first_name?.[0]}{employee.last_name?.[0]}
              </Avatar>
              <Typography variant="h6" fontWeight={700}>{employee.full_name}</Typography>
              <Typography variant="body2" color="text.secondary">{employee.designation_title || 'N/A'}</Typography>
              <Typography variant="caption" color="text.secondary">{employee.department_name}</Typography>
              <Box mt={1}>
                <Chip label={employee.status} color={STATUS_COLORS[employee.status] || 'default'} size="small" />
              </Box>
              <Divider sx={{ my: 2 }} />
              <Typography variant="caption" fontFamily="monospace" color="primary.main" fontWeight={700}>
                {employee.employee_id}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card>
            <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
              <Tab label="Personal Info" />
              <Tab label="Job Details" />
              <Tab label="Bank & Documents" />
              <Tab label="Attendance" />
              <Tab label="Leaves" />
              <Tab label="Payslips" />
            </Tabs>

            <CardContent sx={{ p: 3 }}>
              {tab === 0 && (
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <InfoRow label="Full Name" value={employee.full_name} />
                    <InfoRow label="Email" value={employee.email} />
                    <InfoRow label="Phone" value={employee.phone} />
                    <InfoRow label="Date of Birth" value={employee.date_of_birth} />
                    <InfoRow label="Gender" value={{ M: 'Male', F: 'Female', O: 'Other' }[employee.gender]} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InfoRow label="Address" value={employee.address} />
                    <InfoRow label="City" value={employee.city} />
                    <InfoRow label="State" value={employee.state} />
                    <InfoRow label="Country" value={employee.country} />
                    <InfoRow label="Pincode" value={employee.pincode} />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" fontWeight={600} mt={1} mb={1}>Emergency Contact</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={4}><InfoRow label="Name" value={employee.emergency_contact_name} /></Grid>
                      <Grid item xs={4}><InfoRow label="Phone" value={employee.emergency_contact_phone} /></Grid>
                      <Grid item xs={4}><InfoRow label="Relation" value={employee.emergency_contact_relation} /></Grid>
                    </Grid>
                  </Grid>
                </Grid>
              )}

              {tab === 1 && (
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <InfoRow label="Employee ID" value={employee.employee_id} />
                    <InfoRow label="Department" value={employee.department_name} />
                    <InfoRow label="Designation" value={employee.designation_title} />
                    <InfoRow label="Employment Type" value={employee.employment_type?.replace('_', ' ')} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InfoRow label="Date of Joining" value={employee.date_of_joining} />
                    <InfoRow label="Status" value={employee.status} />
                  </Grid>
                </Grid>
              )}

              {tab === 2 && (
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <InfoRow label="PAN Number" value={employee.pan_number} />
                    <InfoRow label="Aadhar Number" value={employee.aadhar_number} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InfoRow label="Bank Name" value={employee.bank_name} />
                    <InfoRow label="Account Number" value={employee.bank_account_number} />
                    <InfoRow label="IFSC Code" value={employee.ifsc_code} />
                  </Grid>
                </Grid>
              )}

              {tab === 3 && (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Check In</TableCell>
                        <TableCell>Check Out</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {attendance.slice(0, 30).map((rec) => (
                        <TableRow key={rec.id}>
                          <TableCell>{rec.date}</TableCell>
                          <TableCell>{rec.check_in || '-'}</TableCell>
                          <TableCell>{rec.check_out || '-'}</TableCell>
                          <TableCell><Chip label={rec.status} size="small" /></TableCell>
                        </TableRow>
                      ))}
                      {attendance.length === 0 && (
                        <TableRow><TableCell colSpan={4} align="center">No records</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {tab === 4 && (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Type</TableCell>
                        <TableCell>From</TableCell>
                        <TableCell>To</TableCell>
                        <TableCell>Days</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {leaves.map((l) => (
                        <TableRow key={l.id}>
                          <TableCell>{l.leave_type_name}</TableCell>
                          <TableCell>{l.start_date}</TableCell>
                          <TableCell>{l.end_date}</TableCell>
                          <TableCell>{l.days}</TableCell>
                          <TableCell>
                            <Chip label={l.status} size="small"
                              color={{ approved: 'success', rejected: 'error', pending: 'warning', cancelled: 'default' }[l.status]} />
                          </TableCell>
                        </TableRow>
                      ))}
                      {leaves.length === 0 && (
                        <TableRow><TableCell colSpan={5} align="center">No leave records</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {tab === 5 && (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Month</TableCell>
                        <TableCell>Year</TableCell>
                        <TableCell>Gross</TableCell>
                        <TableCell>Deductions</TableCell>
                        <TableCell>Net Salary</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {payslips.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell>{p.month_name}</TableCell>
                          <TableCell>{p.year}</TableCell>
                          <TableCell>₹{Number(p.gross_salary).toLocaleString('en-IN')}</TableCell>
                          <TableCell>₹{Number(p.total_deductions).toLocaleString('en-IN')}</TableCell>
                          <TableCell>₹{Number(p.net_salary).toLocaleString('en-IN')}</TableCell>
                          <TableCell>
                            <Chip label={p.is_paid ? 'Paid' : 'Pending'} size="small" color={p.is_paid ? 'success' : 'warning'} />
                          </TableCell>
                        </TableRow>
                      ))}
                      {payslips.length === 0 && (
                        <TableRow><TableCell colSpan={6} align="center">No payslips</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
