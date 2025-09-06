import React from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
} from '@mui/material';
import { Home, ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();

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
                color: 'primary.main',
                lineHeight: 1,
              }}
            >
              404
            </Typography>
          </Box>
          
          <Typography variant="h4" component="h1" gutterBottom>
            Page Not Found
          </Typography>
          
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}
          >
            Sorry, the page you are looking for doesn't exist or has been moved.
            You might have mistyped the address or the page may have been removed.
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
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
              If you believe this is an error, please contact support.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default NotFound;