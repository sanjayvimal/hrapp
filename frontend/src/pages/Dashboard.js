import React, { useState, useEffect } from 'react';
import {
  Grid, Card, CardContent, Typography, Box, Chip, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Avatar,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import BusinessIcon from '@mui/icons-material/Business';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import api from '../api/axios';

function StatCard({ title, value, icon, color, subtitle }) {
  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" fontWeight={700}>
              {value ?? <CircularProgress size={24} />}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              width: 48, height: 48, borderRadius: 2,
              bgcolor: `${color}.light`, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            {React.cloneElement(icon, { sx: { color: `${color}.main` } })}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

const STATUS_COLORS = {
  present: 'success',
  absent: 'error',
  half_day: 'warning',
  work_from_home: 'info',
  late: 'warning',
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [attendanceStats, setAttendanceStats] = useState(null);
  const [leaveStats, setLeaveStats] = useState(null);
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [recentLeaves, setRecentLeaves] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get('/employees/stats/'),
      api.get('/attendance/stats/'),
      api.get('/leave-applications/stats/'),
      api.get('/attendance/today/'),
      api.get('/leave-applications/?status=pending&page_size=5'),
    ]).then(([empRes, attRes, leaveRes, todayRes, pendingLeaves]) => {
      setStats(empRes.data);
      setAttendanceStats(attRes.data);
      setLeaveStats(leaveRes.data);
      setTodayAttendance(todayRes.data.slice(0, 8));
      setRecentLeaves(pendingLeaves.data.results || pendingLeaves.data);
    }).catch(console.error);
  }, []);

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Welcome back! Here's what's happening today.
      </Typography>

      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard
            title="Total Employees"
            value={stats?.total_employees}
            icon={<PeopleIcon />}
            color="primary"
            subtitle={`${stats?.active_employees} active`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard
            title="Present Today"
            value={attendanceStats?.present}
            icon={<CheckCircleIcon />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard
            title="Absent Today"
            value={attendanceStats?.absent}
            icon={<AccessTimeIcon />}
            color="error"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard
            title="On Leave"
            value={stats?.on_leave_today}
            icon={<EventBusyIcon />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard
            title="Departments"
            value={stats?.total_departments}
            icon={<BusinessIcon />}
            color="secondary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard
            title="Pending Leaves"
            value={leaveStats?.pending}
            icon={<PendingActionsIcon />}
            color="info"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Today's Attendance
              </Typography>
              {todayAttendance.length === 0 ? (
                <Typography color="text.secondary" py={3} textAlign="center">
                  No attendance records for today yet.
                </Typography>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Employee</TableCell>
                        <TableCell>Check In</TableCell>
                        <TableCell>Check Out</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {todayAttendance.map((rec) => (
                        <TableRow key={rec.id} hover>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Avatar sx={{ width: 28, height: 28, fontSize: 12, bgcolor: 'primary.main' }}>
                                {rec.employee_name?.[0]}
                              </Avatar>
                              {rec.employee_name}
                            </Box>
                          </TableCell>
                          <TableCell>{rec.check_in || '-'}</TableCell>
                          <TableCell>{rec.check_out || '-'}</TableCell>
                          <TableCell>
                            <Chip
                              label={rec.status}
                              size="small"
                              color={STATUS_COLORS[rec.status] || 'default'}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Pending Leave Requests
              </Typography>
              {recentLeaves.length === 0 ? (
                <Typography color="text.secondary" py={3} textAlign="center">
                  No pending leave requests.
                </Typography>
              ) : (
                recentLeaves.slice(0, 5).map((leave) => (
                  <Box
                    key={leave.id}
                    sx={{
                      display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', py: 1.5,
                      borderBottom: '1px solid', borderColor: 'divider',
                    }}
                  >
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {leave.employee_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {leave.leave_type_name} • {leave.days} day(s)
                      </Typography>
                    </Box>
                    <Chip label="Pending" size="small" color="warning" />
                  </Box>
                ))
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
