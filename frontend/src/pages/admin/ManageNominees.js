import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Tooltip,
  Menu,
  ListItemIcon,
  ListItemText,
  Avatar,
  Card,
  CardContent,
  Grid,
  Tabs,
  Tab,
  Badge
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Visibility as VisibilityIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  Category as CategoryIcon,
  AccessTime as AccessTimeIcon,
  FilterList as FilterListIcon
} from '@mui/icons-material';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const ManageNominees = () => {
  const [nominees, setNominees] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [activeTab, setActiveTab] = useState(0); // 0: pending, 1: approved, 2: rejected
  
  // Filter states
  const [filters, setFilters] = useState({
    status: 'pending',
    category: '',
    search: ''
  });
  
  // Dialog states
  const [viewDialog, setViewDialog] = useState({ open: false, nominee: null });
  const [rejectDialog, setRejectDialog] = useState({ open: false, nominee: null });
  const [rejectReason, setRejectReason] = useState('');
  
  // Menu state
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedNominee, setSelectedNominee] = useState(null);

  const statusOptions = [
    { value: 'pending', label: 'Pending', color: 'warning' },
    { value: 'approved', label: 'Approved', color: 'success' },
    { value: 'rejected', label: 'Rejected', color: 'error' }
  ];

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchNominees();
  }, [page, rowsPerPage, filters]);

  useEffect(() => {
    const statusMap = ['pending', 'approved', 'rejected'];
    setFilters(prev => ({ ...prev, status: statusMap[activeTab] }));
    setPage(0);
  }, [activeTab]);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data.data.categories);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchNominees = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        status: filters.status
      };
      
      if (filters.category) params.category = filters.category;
      if (filters.search) params.search = filters.search;
      
      const response = await api.get('/admin/nominees', { params });
      
      setNominees(response.data.data.nominees);
      setTotalCount(response.data.data.totalCount);
    } catch (err) {
      console.error('Error fetching nominees:', err);
      setError('Failed to load nominees');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (nominee) => {
    try {
      setError('');
      setSuccess('');
      
      await api.patch(`/admin/nominees/${nominee._id}/approve`);
      setSuccess(`${nominee.student.firstName} ${nominee.student.lastName} has been approved`);
      fetchNominees();
    } catch (err) {
      console.error('Error approving nominee:', err);
      setError(err.response?.data?.message || 'Failed to approve nominee');
    }
  };

  const handleReject = async () => {
    try {
      setError('');
      setSuccess('');
      
      await api.patch(`/admin/nominees/${rejectDialog.nominee._id}/reject`, {
        reason: rejectReason
      });
      
      setSuccess(`${rejectDialog.nominee.student.firstName} ${rejectDialog.nominee.student.lastName} has been rejected`);
      setRejectDialog({ open: false, nominee: null });
      setRejectReason('');
      fetchNominees();
    } catch (err) {
      console.error('Error rejecting nominee:', err);
      setError(err.response?.data?.message || 'Failed to reject nominee');
    }
  };

  const handleMenuOpen = (event, nominee) => {
    setAnchorEl(event.currentTarget);
    setSelectedNominee(nominee);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedNominee(null);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const getStatusCounts = () => {
    // This would typically come from an API endpoint
    return {
      pending: nominees.filter(n => n.status === 'pending').length,
      approved: nominees.filter(n => n.status === 'approved').length,
      rejected: nominees.filter(n => n.status === 'rejected').length
    };
  };

  if (loading && nominees.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Manage Nominees
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<FilterListIcon />}
            onClick={() => {/* Implement advanced filters */}}
          >
            Filters
          </Button>
        </Box>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Status Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} variant="fullWidth">
          <Tab 
            label={
              <Badge badgeContent={getStatusCounts().pending} color="warning">
                Pending
              </Badge>
            }
          />
          <Tab 
            label={
              <Badge badgeContent={getStatusCounts().approved} color="success">
                Approved
              </Badge>
            }
          />
          <Tab 
            label={
              <Badge badgeContent={getStatusCounts().rejected} color="error">
                Rejected
              </Badge>
            }
          />
        </Tabs>
      </Paper>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="Search nominees"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Search by name, student ID, or department"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                label="Category"
              >
                <MenuItem value="">All Categories</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category._id} value={category._id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={12} md={4}>
            <Button
              variant="outlined"
              onClick={() => {
                setFilters({ status: filters.status, category: '', search: '' });
                setPage(0);
              }}
            >
              Clear Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Nominees Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Student</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Nomination Reason</TableCell>
                <TableCell>Submitted</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {nominees.map((nominee) => (
                <TableRow key={nominee._id}>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {nominee.student.firstName.charAt(0)}{nominee.student.lastName.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2">
                          {nominee.student.firstName} {nominee.student.lastName}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {nominee.student.studentId} • {nominee.student.department}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={nominee.category.name}
                      color="primary"
                      variant="outlined"
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {nominee.reason.length > 100
                        ? `${nominee.reason.substring(0, 100)}...`
                        : nominee.reason}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(nominee.createdAt).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={nominee.status.charAt(0).toUpperCase() + nominee.status.slice(1)}
                      color={statusOptions.find(s => s.value === nominee.status)?.color || 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    {nominee.status === 'pending' ? (
                      <Box display="flex" gap={1}>
                        <Tooltip title="Approve">
                          <IconButton
                            color="success"
                            onClick={() => handleApprove(nominee)}
                            size="small"
                          >
                            <CheckIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Reject">
                          <IconButton
                            color="error"
                            onClick={() => setRejectDialog({ open: true, nominee })}
                            size="small"
                          >
                            <CloseIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="View Details">
                          <IconButton
                            onClick={() => setViewDialog({ open: true, nominee })}
                            size="small"
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    ) : (
                      <IconButton
                        onClick={(e) => handleMenuOpen(e, nominee)}
                        size="small"
                      >
                        <MoreVertIcon />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </Paper>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          setViewDialog({ open: true, nominee: selectedNominee });
          handleMenuClose();
        }}>
          <ListItemIcon>
            <VisibilityIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        
        {selectedNominee?.status === 'rejected' && (
          <MenuItem onClick={() => {
            handleApprove(selectedNominee);
            handleMenuClose();
          }}>
            <ListItemIcon>
              <CheckIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Approve</ListItemText>
          </MenuItem>
        )}
        
        {selectedNominee?.status === 'approved' && (
          <MenuItem onClick={() => {
            setRejectDialog({ open: true, nominee: selectedNominee });
            handleMenuClose();
          }}>
            <ListItemIcon>
              <CloseIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Reject</ListItemText>
          </MenuItem>
        )}
      </Menu>

      {/* View Details Dialog */}
      <Dialog 
        open={viewDialog.open} 
        onClose={() => setViewDialog({ open: false, nominee: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Nominee Details
        </DialogTitle>
        <DialogContent>
          {viewDialog.nominee && (
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Box display="flex" alignItems="center" gap={2} mb={2}>
                        <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                          <PersonIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="h6">
                            {viewDialog.nominee.student.firstName} {viewDialog.nominee.student.lastName}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {viewDialog.nominee.student.email}
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <SchoolIcon color="action" />
                        <Typography variant="body2">
                          {viewDialog.nominee.student.studentId}
                        </Typography>
                      </Box>
                      
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <CategoryIcon color="action" />
                        <Typography variant="body2">
                          {viewDialog.nominee.student.department}
                        </Typography>
                      </Box>
                      
                      <Box display="flex" alignItems="center" gap={1}>
                        <AccessTimeIcon color="action" />
                        <Typography variant="body2">
                          Submitted: {new Date(viewDialog.nominee.createdAt).toLocaleString()}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Nomination Details
                      </Typography>
                      
                      <Box mb={2}>
                        <Typography variant="subtitle2" color="primary">
                          Category
                        </Typography>
                        <Typography variant="body2">
                          {viewDialog.nominee.category.name}
                        </Typography>
                      </Box>
                      
                      <Box mb={2}>
                        <Typography variant="subtitle2" color="primary">
                          Status
                        </Typography>
                        <Chip
                          label={viewDialog.nominee.status.charAt(0).toUpperCase() + viewDialog.nominee.status.slice(1)}
                          color={statusOptions.find(s => s.value === viewDialog.nominee.status)?.color || 'default'}
                          size="small"
                        />
                      </Box>
                      
                      {viewDialog.nominee.rejectionReason && (
                        <Box mb={2}>
                          <Typography variant="subtitle2" color="error">
                            Rejection Reason
                          </Typography>
                          <Typography variant="body2">
                            {viewDialog.nominee.rejectionReason}
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Nomination Reason
                      </Typography>
                      <Typography variant="body2">
                        {viewDialog.nominee.reason}
                      </Typography>
                      
                      {viewDialog.nominee.achievements && (
                        <Box mt={2}>
                          <Typography variant="h6" gutterBottom>
                            Achievements
                          </Typography>
                          <Typography variant="body2">
                            {viewDialog.nominee.achievements}
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialog({ open: false, nominee: null })}>
            Close
          </Button>
          {viewDialog.nominee?.status === 'pending' && (
            <>
              <Button
                color="error"
                onClick={() => {
                  setRejectDialog({ open: true, nominee: viewDialog.nominee });
                  setViewDialog({ open: false, nominee: null });
                }}
              >
                Reject
              </Button>
              <Button
                variant="contained"
                color="success"
                onClick={() => {
                  handleApprove(viewDialog.nominee);
                  setViewDialog({ open: false, nominee: null });
                }}
              >
                Approve
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog 
        open={rejectDialog.open} 
        onClose={() => {
          setRejectDialog({ open: false, nominee: null });
          setRejectReason('');
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Reject Nominee
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Are you sure you want to reject {rejectDialog.nominee?.student.firstName} {rejectDialog.nominee?.student.lastName}?
          </Typography>
          <TextField
            fullWidth
            label="Rejection Reason"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            margin="normal"
            multiline
            rows={3}
            required
            helperText="Please provide a reason for rejection"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setRejectDialog({ open: false, nominee: null });
            setRejectReason('');
          }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleReject}
            disabled={!rejectReason.trim()}
          >
            Reject
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ManageNominees;