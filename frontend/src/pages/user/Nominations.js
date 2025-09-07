import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Box,
  Button,
  Alert,
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
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { nomineesAPI, categoriesAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const Nominations = () => {
  const [nominees, setNominees] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingNominee, setEditingNominee] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, nominee: null });
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    image: '',
    achievements: '',
    qualifications: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [nomineesResponse, categoriesResponse] = await Promise.all([
        nomineesAPI.getAll(),
        categoriesAPI.getAll()
      ]);
      
      setNominees(nomineesResponse.data);
      setCategories(categoriesResponse.data);
    } catch (err) {
      setError('Failed to load nominations data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (nominee = null) => {
    if (nominee) {
      setEditingNominee(nominee);
      setFormData({
        name: nominee.student ? `${nominee.student.firstName} ${nominee.student.lastName}` : nominee.name || '',
        description: nominee.description || '',
        category: nominee.category || '',
        image: nominee.image || '',
        achievements: nominee.achievements ? nominee.achievements.join(', ') : '',
        qualifications: nominee.qualifications ? nominee.qualifications.join(', ') : '',
      });
    } else {
      setEditingNominee(null);
      setFormData({
        name: '',
        description: '',
        category: '',
        image: '',
        achievements: '',
        qualifications: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingNominee(null);
    setFormData({
      name: '',
      description: '',
      category: '',
      image: '',
      achievements: '',
      qualifications: '',
    });
  };

  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleSubmit = async () => {
    try {
      const submitData = {
        ...formData,
        achievements: formData.achievements.split(',').map(item => item.trim()).filter(Boolean),
        qualifications: formData.qualifications.split(',').map(item => item.trim()).filter(Boolean),
      };

      if (editingNominee) {
        await nomineesAPI.update(editingNominee._id, submitData);
      } else {
        await nomineesAPI.create(submitData);
      }
      
      await fetchData();
      handleCloseDialog();
    } catch (err) {
      setError('Failed to save nominee');
      console.error('Error saving nominee:', err);
    }
  };

  const handleDelete = async () => {
    try {
      await nomineesAPI.delete(deleteDialog.nominee._id);
      await fetchData();
      setDeleteDialog({ open: false, nominee: null });
    } catch (err) {
      setError('Failed to delete nominee');
      console.error('Error deleting nominee:', err);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading nominations..." />;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          Manage Nominations
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Add Nominee
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {nominees.length === 0 ? (
        <Alert severity="info">
          No nominees found. Click "Add Nominee" to create your first nomination.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {nominees.map((nominee) => {
            const category = categories.find(cat => cat._id === nominee.category);
            
            return (
              <Grid item xs={12} sm={6} md={4} key={nominee._id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  {nominee.image && (
                    <CardMedia
                      component="img"
                      height="200"
                      image={nominee.image}
                      alt={nominee.student ? `${nominee.student.firstName} ${nominee.student.lastName}` : nominee.name || 'Unknown Nominee'}
                      sx={{ objectFit: 'cover' }}
                    />
                  )}
                  
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" component="h2" gutterBottom>
                      {nominee.student ? `${nominee.student.firstName} ${nominee.student.lastName}` : nominee.name || 'Unknown Nominee'}
                    </Typography>
                    
                    {category && (
                      <Chip
                        label={category.name}
                        color="primary"
                        size="small"
                        sx={{ mb: 2 }}
                      />
                    )}
                    
                    {nominee.description && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 2 }}
                      >
                        {nominee.description.length > 100
                          ? `${nominee.description.substring(0, 100)}...`
                          : nominee.description
                        }
                      </Typography>
                    )}
                    
                    {nominee.achievements && nominee.achievements.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Achievements:
                        </Typography>
                        {nominee.achievements.slice(0, 2).map((achievement, index) => (
                          <Chip
                            key={index}
                            label={achievement.title || achievement}
                            size="small"
                            variant="outlined"
                            sx={{ mr: 1, mb: 1 }}
                          />
                        ))}
                      </Box>
                    )}
                  </CardContent>
                  
                  <Box sx={{ p: 2, pt: 0 }}>
                    <Button
                      variant="outlined"
                      startIcon={<Edit />}
                      onClick={() => handleOpenDialog(nominee)}
                      sx={{ mr: 1 }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<Delete />}
                      onClick={() => setDeleteDialog({ open: true, nominee })}
                    >
                      Delete
                    </Button>
                  </Box>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingNominee ? 'Edit Nominee' : 'Add New Nominee'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Name"
                value={formData.name}
                onChange={handleInputChange('name')}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category}
                  onChange={handleInputChange('category')}
                  label="Category"
                >
                  {categories.map((category) => (
                    <MenuItem key={category._id} value={category._id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={handleInputChange('description')}
                multiline
                rows={3}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Image URL"
                value={formData.image}
                onChange={handleInputChange('image')}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Achievements (comma-separated)"
                value={formData.achievements}
                onChange={handleInputChange('achievements')}
                multiline
                rows={2}
                helperText="Enter achievements separated by commas"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Qualifications (comma-separated)"
                value={formData.qualifications}
                onChange={handleInputChange('qualifications')}
                multiline
                rows={2}
                helperText="Enter qualifications separated by commas"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingNominee ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, nominee: null })}
        onConfirm={handleDelete}
        title="Delete Nominee"
        message={`Are you sure you want to delete ${deleteDialog.nominee?.name}? This action cannot be undone.`}
        confirmText="Delete"
        confirmColor="error"
      />
    </Container>
  );
};

export default Nominations;