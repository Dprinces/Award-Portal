import React from 'react';
import { Box, Container, Typography, Link, Divider } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: '#ffffff',
        color: '#333',
        mt: 'auto',
        borderTop: '1px solid rgba(0,0,0,0.08)',
      }}
    >
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'flex-start', sm: 'center' },
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>
              🏆 Sandwich Award
            </Typography>
            <Typography variant="body2" sx={{ color: '#666' }}>
              Your voice matters. Your vote counts.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {[
              { text: 'Home', path: '/' },
              { text: 'Categories', path: '/categories' },
              { text: 'Results', path: '/results' },
              { text: 'Contact', path: '/contact' },
            ].map((link) => (
              <Link
                key={link.text}
                component={RouterLink}
                to={link.path}
                sx={{
                  color: '#333',
                  textDecoration: 'none',
                  fontSize: '0.95rem',
                  '&:hover': { color: '#667eea' },
                }}
              >
                {link.text}
              </Link>
            ))}
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'flex-start', sm: 'center' },
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          <Typography variant="body2" sx={{ color: '#666' }}>
            © {currentYear} Sandwich Award. All rights reserved.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {[
              { text: 'Privacy', path: '/privacy' },
              { text: 'Terms', path: '/terms' },
            ].map((link) => (
              <Link
                key={link.text}
                component={RouterLink}
                to={link.path}
                sx={{
                  color: '#666',
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  '&:hover': { color: '#333' },
                }}
              >
                {link.text}
              </Link>
            ))}
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;