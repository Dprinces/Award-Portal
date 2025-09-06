import React from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  Alert,
} from '@mui/material';
import { Home, Refresh, ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const ServerError = () => {
  const navigate = useNavigate();

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <Container maxWidth="md" sx={{ mt: 8, mb: 4 }}>
      <Card sx={{ textAlign: 'center', py: 6 }}>
        <CardContent>
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h1"
              component="div"
              sx={{
                fontSize: '8rem',
                fontWeight: 'bold',
                color: 'error.main',
                lineHeight: 1,
              }}
            >
              500
            </Typography>
          </Box>
          
          <Typography variant="h4" component="h1" gutterBottom>
            Server Error
          </Typography>
          
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}
          >
            Something went wrong on our end. We're working to fix the issue.
            Please try again in a few moments.
          </Typography>
          
          <Alert severity="error" sx={{ mb: 4, textAlign: 'left' }}>
            <Typography variant="subtitle2" gutterBottom>
              What you can do:
            </Typography>
            <Typography variant="body2" component="ul" sx={{ pl: 2 }}>
              <li>Refresh the page</li>
              <li>Check your internet connection</li>
              <li>Try again in a few minutes</li>
              <li>Contact support if the problem persists</li>
            </Typography>
          </Alert>
          
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={<Refresh />}
              onClick={handleRefresh}
              size="large"
            >
              Refresh Page
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<Home />}
              onClick={() => navigate('/')}
              size="large"
            >
              Go Home
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<ArrowBack />}
              onClick={() => navigate(-1)}
              size="large"
            >
              Go Back
            </Button>
          </Box>
          
          <Box sx={{ mt: 4 }}>
            <Typography variant="body2" color="text.secondary">
              Error Code: 500 | Server Internal Error
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              If this problem continues, please contact our support team.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default ServerError;