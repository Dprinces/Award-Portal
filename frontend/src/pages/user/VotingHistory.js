import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Alert,
  Chip,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
} from '@mui/material';
import {
  HowToVote,
  Payment,
  FilterList,
  History,
} from '@mui/icons-material';
import { votesAPI, paymentsAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const VotingHistory = () => {
  const [votes, setVotes] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterCategory, setFilterCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('votes'); // 'votes' or 'payments'

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [votesResponse, paymentsResponse] = await Promise.all([
        votesAPI.getUserVotes(),
        paymentsAPI.getPaymentHistory()
      ]);
      
      setVotes(votesResponse.data);
      setPayments(paymentsResponse.data);
    } catch (err) {
      setError('Failed to load voting history');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getFilteredVotes = () => {
    return votes.filter(vote => {
      const matchesCategory = !filterCategory || vote.category._id === filterCategory;
      const matchesSearch = !searchTerm || 
        (vote.nominee.student ? `${vote.nominee.student.firstName} ${vote.nominee.student.lastName}` : vote.nominee.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        vote.category.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  };

  const getFilteredPayments = () => {
    return payments.filter(payment => {
      const matchesSearch = !searchTerm || 
        payment.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.status.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  };

  const getUniqueCategories = () => {
    const categories = votes.map(vote => vote.category);
    const uniqueCategories = categories.filter((category, index, self) => 
      index === self.findIndex(c => c._id === category._id)
    );
    return uniqueCategories;
  };

  const getTotalSpent = () => {
    return payments
      .filter(payment => payment.status === 'success')
      .reduce((total, payment) => total + payment.amount, 0);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading your voting history..." />;
  }

  const filteredVotes = getFilteredVotes();
  const filteredPayments = getFilteredPayments();
  const uniqueCategories = getUniqueCategories();
  const totalSpent = getTotalSpent();

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Voting History
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <HowToVote sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" component="div">
                {votes.length}
              </Typography>
              <Typography color="text.secondary">
                Total Votes
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Payment sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h4" component="div">
                ₦{totalSpent.toLocaleString()}
              </Typography>
              <Typography color="text.secondary">
                Total Spent
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <FilterList sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
              <Typography variant="h4" component="div">
                {uniqueCategories.length}
              </Typography>
              <Typography color="text.secondary">
                Categories Voted
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <History sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h4" component="div">
                {payments.length}
              </Typography>
              <Typography color="text.secondary">
                Transactions
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tab Navigation */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Chip
            label="Voting History"
            color={activeTab === 'votes' ? 'primary' : 'default'}
            onClick={() => setActiveTab('votes')}
            clickable
          />
          <Chip
            label="Payment History"
            color={activeTab === 'payments' ? 'primary' : 'default'}
            onClick={() => setActiveTab('payments')}
            clickable
          />
        </Box>

        {/* Filters */}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
            />
          </Grid>
          
          {activeTab === 'votes' && (
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Filter by Category</InputLabel>
                <Select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  label="Filter by Category"
                >
                  <MenuItem value="">All Categories</MenuItem>
                  {uniqueCategories.map((category) => (
                    <MenuItem key={category._id} value={category._id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}
        </Grid>
      </Box>

      {/* Content based on active tab */}
      {activeTab === 'votes' ? (
        // Votes Table
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Your Votes ({filteredVotes.length})
            </Typography>
            
            {filteredVotes.length === 0 ? (
              <Alert severity="info">
                {votes.length === 0 
                  ? "You haven't cast any votes yet."
                  : "No votes match your current filters."
                }
              </Alert>
            ) : (
              <>
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Nominee</TableCell>
                        <TableCell>Category</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Amount Paid</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredVotes
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map((vote) => (
                          <TableRow key={vote._id}>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Avatar
                                  src={vote.nominee.image}
                                  alt={vote.nominee.student ? `${vote.nominee.student.firstName} ${vote.nominee.student.lastName}` : vote.nominee.name || 'Unknown Nominee'}
                                  sx={{ width: 32, height: 32, mr: 2 }}
                                />
                                {vote.nominee.student ? `${vote.nominee.student.firstName} ${vote.nominee.student.lastName}` : vote.nominee.name || 'Unknown Nominee'}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={vote.category.name}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>
                              {new Date(vote.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              ₦{vote.amount?.toLocaleString() || '0'}
                            </TableCell>
                          </TableRow>
                        ))
                      }
                    </TableBody>
                  </Table>
                </TableContainer>
                
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25]}
                  component="div"
                  count={filteredVotes.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                />
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        // Payments Table
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Payment History ({filteredPayments.length})
            </Typography>
            
            {filteredPayments.length === 0 ? (
              <Alert severity="info">
                {payments.length === 0 
                  ? "No payment history found."
                  : "No payments match your current filters."
                }
              </Alert>
            ) : (
              <>
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Reference</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Description</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredPayments
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map((payment) => (
                          <TableRow key={payment._id}>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                {payment.reference}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              ₦{payment.amount.toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={payment.status}
                                size="small"
                                color={getStatusColor(payment.status)}
                              />
                            </TableCell>
                            <TableCell>
                              {new Date(payment.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              {payment.description || 'Vote payment'}
                            </TableCell>
                          </TableRow>
                        ))
                      }
                    </TableBody>
                  </Table>
                </TableContainer>
                
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25]}
                  component="div"
                  count={filteredPayments.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                />
              </>
            )}
          </CardContent>
        </Card>
      )}
    </Container>
  );
};

export default VotingHistory;