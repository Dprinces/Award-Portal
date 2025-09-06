import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  IconButton,
  Chip,
  Alert,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Visibility as VisibilityIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  HowToVote as VoteIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const CategoriesManagement = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuCategory, setMenuCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    votingStartDate: '',
    votingEndDate: '',
    votingActive: true,
    icon: '',
    color: '#3B82F6'
  });

  // Fetch categories
  const { data: categories, isLoading, error } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const response = await api.get('/categories');
      return response.data.data;
    }
  });

  // Fetch category statistics
  const { data: categoryStats } = useQuery({
    queryKey: ['category-stats'],
    queryFn: async () => {
      const response = await api.get('/admin/stats?period=30');
      return response.data.data.categoryPerformance;
    }
  });

  // Create/Update category mutation
  const categoryMutation = useMutation({
    mutationFn: async (categoryData) => {
      if (selectedCategory) {
        const response = await api.put(`/categories/${selectedCategory._id}`, categoryData);
        return response.data;
      } else {
        const response = await api.post('/categories', categoryData);
        return response.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-categories']);
      queryClient.invalidateQueries(['category-stats']);
      toast.success(selectedCategory ? 'Category updated successfully' : 'Category created successfully');
      handleCloseModal();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to save category');
    }
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId) => {
      const response = await api.delete(`/categories/${categoryId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-categories']);
      queryClient.invalidateQueries(['category-stats']);
      toast.success('Category deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete category');
    }
  });

  const handleOpenModal = (category = null) => {
    setSelectedCategory(category);
    if (category) {
      setCategoryForm({
        name: category.name,
        description: category.description,
        votingStartDate: category.votingStartDate ? new Date(category.votingStartDate).toISOString().split('T')[0] : '',
        votingEndDate: category.votingEndDate ? new Date(category.votingEndDate).toISOString().split('T')[0] : '',
        votingActive: category.votingActive,
        icon: category.icon || '',
        color: category.color || '#3B82F6'
      });
    } else {
      setCategoryForm({
        name: '',
        description: '',
        votingStartDate: '',
        votingEndDate: '',
        votingActive: true,
        icon: '',
        color: '#3B82F6'
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedCategory(null);
    setCategoryForm({
      name: '',
      description: '',
      votingStartDate: '',
      votingEndDate: '',
      votingActive: true,
      icon: '',
      color: '#3B82F6'
    });
  };

  const handleSubmit = () => {
    if (!categoryForm.name.trim()) {
      toast.error('Category name is required');
      return;
    }
    categoryMutation.mutate(categoryForm);
  };

  const handleMenuOpen = (event, category) => {
    setAnchorEl(event.currentTarget);
    setMenuCategory(category);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuCategory(null);
  };

  const handleDelete = (category) => {
    if (window.confirm(`Are you sure you want to delete "${category.name}"? This action cannot be undone.`)) {
      deleteCategoryMutation.mutate(category._id);
    }
    handleMenuClose();
  };

  const getCategoryStats = (categoryId) => {
    return categoryStats?.find(stat => stat._id === categoryId) || { voteCount: 0, totalRevenue: 0 };
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user || user.role !== 'admin') {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <Alert severity="error">
          You don't have permission to access this page.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Categories Management
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Create and manage award categories for the voting system
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenModal()}
          size="large"
        >
          Add Category
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error.response?.data?.message || error.message || 'Failed to load categories'}
        </Alert>
      )}

      {/* Categories Grid */}
      <Grid container spacing={3}>
        {categories?.map((category) => {
          const stats = getCategoryStats(category._id);
          return (
            <Grid item xs={12} sm={6} md={4} key={category._id}>
              <Card sx={{ height: '100%', position: 'relative' }}>
                <CardContent>
                  {/* Category Header */}
                  <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: 2,
                          backgroundColor: category.color || '#3B82F6',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '1.2rem',
                          fontWeight: 'bold'
                        }}
                      >
                        {category.icon || category.name.charAt(0)}
                      </Box>
                      <Box>
                        <Typography variant="h6" component="h3">
                          {category.name}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {category.nominees?.length || 0} nominees
                        </Typography>
                      </Box>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, category)}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </Box>

                  {/* Description */}
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 2, minHeight: 40 }}>
                    {category.description || 'No description provided'}
                  </Typography>

                  {/* Statistics */}
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <VoteIcon fontSize="small" color="primary" />
                      <Typography variant="body2">
                        {stats.voteCount} votes
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <TrendingUpIcon fontSize="small" color="success" />
                      <Typography variant="body2">
                        ₦{stats.totalRevenue?.toLocaleString() || '0'}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Status and Dates */}
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Chip
                      label={category.votingActive ? 'Active' : 'Inactive'}
                      color={category.votingActive ? 'success' : 'default'}
                      size="small"
                    />
                    {category.votingEndDate && (
                      <Typography variant="caption" color="textSecondary">
                        Ends: {new Date(category.votingEndDate).toLocaleDateString()}
                      </Typography>
                    )}
                  </Box>

                  {/* Voting Period */}
                  {category.votingStartDate && category.votingEndDate && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="caption" color="textSecondary" display="block">
                        Voting Period:
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {new Date(category.votingStartDate).toLocaleDateString()} - {new Date(category.votingEndDate).toLocaleDateString()}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Empty State */}
      {categories?.length === 0 && (
        <Box textAlign="center" py={8}>
          <Typography variant="h6" color="textSecondary" gutterBottom>
            No categories found
          </Typography>
          <Typography variant="body2" color="textSecondary" mb={3}>
            Create your first category to get started with the voting system.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenModal()}
          >
            Create Category
          </Button>
        </Box>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => { handleOpenModal(menuCategory); handleMenuClose(); }}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleDelete(menuCategory)}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* Category Modal */}
      <Dialog open={showModal} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedCategory ? 'Edit Category' : 'Create New Category'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Category Name"
            fullWidth
            variant="outlined"
            value={categoryForm.name}
            onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
            sx={{ mb: 2 }}
            required
          />
          
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={categoryForm.description}
            onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
            sx={{ mb: 2 }}
          />

          <Box display="flex" gap={2} mb={2}>
            <TextField
              margin="dense"
              label="Icon (emoji or text)"
              variant="outlined"
              value={categoryForm.icon}
              onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
              sx={{ flex: 1 }}
              placeholder="🏆"
            />
            <TextField
              margin="dense"
              label="Color"
              type="color"
              variant="outlined"
              value={categoryForm.color}
              onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
              sx={{ width: 100 }}
            />
          </Box>
          
          <Box display="flex" gap={2} mb={2}>
            <TextField
              margin="dense"
              label="Voting Start Date"
              type="date"
              variant="outlined"
              value={categoryForm.votingStartDate}
              onChange={(e) => setCategoryForm({ ...categoryForm, votingStartDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
              sx={{ flex: 1 }}
            />
            <TextField
              margin="dense"
              label="Voting End Date"
              type="date"
              variant="outlined"
              value={categoryForm.votingEndDate}
              onChange={(e) => setCategoryForm({ ...categoryForm, votingEndDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
              sx={{ flex: 1 }}
            />
          </Box>
          
          <FormControlLabel
            control={
              <Switch
                checked={categoryForm.votingActive}
                onChange={(e) => setCategoryForm({ ...categoryForm, votingActive: e.target.checked })}
              />
            }
            label="Voting Active"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={categoryMutation.isLoading || !categoryForm.name.trim()}
          >
            {categoryMutation.isLoading ? 'Saving...' : (selectedCategory ? 'Update' : 'Create')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CategoriesManagement;