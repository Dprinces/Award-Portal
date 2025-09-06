import React from 'react';
import {
  Box,
  Container,
  Typography,
  Link,
  Grid,
  IconButton,
  Divider,
  Chip,
  Stack,
} from '@mui/material';
import {
  Facebook,
  Twitter,
  Instagram,
  LinkedIn,
  Email,
  Phone,
  LocationOn,
  TrendingUp,
  Security,
  Support,
  Verified,
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { motion } from 'framer-motion';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    'Quick Links': [
      { text: 'Home', path: '/' },
      { text: 'Vote', path: '/vote' },
      { text: 'Results', path: '/results' },
      { text: 'About', path: '/about' },
    ],
    'Account': [
      { text: 'Login', path: '/login' },
      { text: 'Register', path: '/register' },
      { text: 'Profile', path: '/profile' },
      { text: 'Dashboard', path: '/dashboard' },
    ],
    'Support': [
      { text: 'Help Center', path: '/help' },
      { text: 'Contact Us', path: '/contact' },
      { text: 'Privacy Policy', path: '/privacy' },
      { text: 'Terms of Service', path: '/terms' },
    ],
  };

  const socialLinks = [
    { icon: <Facebook />, url: 'https://facebook.com', label: 'Facebook' },
    { icon: <Twitter />, url: 'https://twitter.com', label: 'Twitter' },
    { icon: <Instagram />, url: 'https://instagram.com', label: 'Instagram' },
    { icon: <LinkedIn />, url: 'https://linkedin.com', label: 'LinkedIn' },
  ];

  return (
    <Box
      component="footer"
      sx={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #3b82f6 100%)',
        color: 'white',
        mt: 'auto',
        py: 8,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(45deg, rgba(255,255,255,0.05) 0%, transparent 50%, rgba(255,255,255,0.05) 100%)',
          pointerEvents: 'none',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '1px',
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
        }
      }}
    >
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Grid container spacing={6}>
          {/* Brand Section */}
          <Grid item xs={12} md={4}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Box sx={{ mb: 3 }}>
                <Typography 
                  variant="h4" 
                  gutterBottom 
                  sx={{ 
                    fontWeight: 800,
                    background: 'linear-gradient(135deg, #ffffff 0%, #e0e7ff 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    mb: 1
                  }}
                >
                  🏆 Sandwich Award
                </Typography>
                <Chip
                  icon={<Verified sx={{ fontSize: '16px !important' }} />}
                  label="Official Platform"
                  size="small"
                  sx={{
                    backgroundColor: 'rgba(255,255,255,0.15)',
                    color: 'white',
                    fontWeight: 600,
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.2)'
                  }}
                />
              </Box>
              
              <Typography 
                variant="body1" 
                sx={{ 
                  mb: 4, 
                  opacity: 0.9,
                  lineHeight: 1.7,
                  fontSize: '1rem',
                  fontWeight: 400
                }}
              >
                Celebrating excellence and recognizing outstanding achievements in our community.
                Your voice matters, your vote counts.
              </Typography>
            </motion.div>
            
            {/* Contact Info */}
            <Stack spacing={2} sx={{ mb: 4 }}>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.12)',
                      transform: 'translateX(4px)'
                    }
                  }}
                >
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      backgroundColor: 'rgba(255,255,255,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mr: 2
                    }}
                  >
                    <Email sx={{ fontSize: '1.2rem', color: 'white' }} />
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Email Support
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      support@sandwichaward.com
                    </Typography>
                  </Box>
                </Box>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.12)',
                      transform: 'translateX(4px)'
                    }
                  }}
                >
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      backgroundColor: 'rgba(255,255,255,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mr: 2
                    }}
                  >
                    <LocationOn sx={{ fontSize: '1.2rem', color: 'white' }} />
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Location
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      University Campus, Nigeria
                    </Typography>
                  </Box>
                </Box>
              </motion.div>
            </Stack>
            
            {/* Social Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                Connect With Us
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {socialLinks.map((social, index) => (
                  <motion.div
                    key={social.label}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                  >
                    <IconButton
                      component="a"
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        width: 48,
                        height: 48,
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        color: 'white',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          backgroundColor: 'rgba(255,255,255,0.2)',
                          transform: 'translateY(-4px) scale(1.1)',
                          boxShadow: '0 8px 25px rgba(0,0,0,0.3)'
                        },
                      }}
                      aria-label={social.label}
                    >
                      {social.icon}
                    </IconButton>
                  </motion.div>
                ))}
              </Box>
            </motion.div>
          </Grid>

          {/* Links Sections */}
          {Object.entries(footerLinks).map(([title, links], sectionIndex) => {
            const sectionIcons = {
              'Quick Links': <TrendingUp />,
              'Account': <Security />,
              'Support': <Support />
            };
            
            return (
              <Grid item xs={12} sm={6} md={2.67} key={title}>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 + sectionIndex * 0.1 }}
                >
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          backgroundColor: 'rgba(255,255,255,0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 1.5
                        }}
                      >
                        {React.cloneElement(sectionIcons[title], { sx: { fontSize: '1rem', color: 'white' } })}
                      </Box>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 700,
                          fontSize: '1.1rem',
                          color: 'white'
                        }}
                      >
                        {title}
                      </Typography>
                    </Box>
                    
                    <Stack spacing={1}>
                      {links.map((link, linkIndex) => (
                        <motion.div
                          key={link.text}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.4, delay: 0.3 + sectionIndex * 0.1 + linkIndex * 0.05 }}
                        >
                          <Link
                            component={RouterLink}
                            to={link.path}
                            sx={{
                              display: 'block',
                              color: 'white',
                              textDecoration: 'none',
                              py: 1,
                              px: 2,
                              borderRadius: 2,
                              opacity: 0.8,
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                opacity: 1,
                                backgroundColor: 'rgba(255,255,255,0.1)',
                                transform: 'translateX(8px)',
                                backdropFilter: 'blur(10px)'
                              },
                            }}
                          >
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {link.text}
                            </Typography>
                          </Link>
                        </motion.div>
                      ))}
                    </Stack>
                  </Box>
                </motion.div>
              </Grid>
            );
          })}
        </Grid>

        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <Divider 
            sx={{ 
              my: 6, 
              borderColor: 'rgba(255, 255, 255, 0.2)',
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
              height: '1px',
              border: 'none'
            }} 
          />
        </motion.div>

        {/* Bottom Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 3,
              p: 3,
              borderRadius: 3,
              backgroundColor: 'rgba(255,255,255,0.05)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
              <Typography 
                variant="body1" 
                sx={{ 
                  fontWeight: 600,
                  mb: 0.5,
                  color: 'white'
                }}
              >
                © {currentYear} Sandwich Award
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                All rights reserved. Made with passion for excellence.
              </Typography>
            </Box>
            
            <Box
              sx={{
                display: 'flex',
                gap: 2,
                flexWrap: 'wrap',
                justifyContent: { xs: 'center', sm: 'flex-end' },
              }}
            >
              {[
                { text: 'Privacy Policy', path: '/privacy' },
                { text: 'Terms of Service', path: '/terms' },
                { text: 'Cookie Policy', path: '/cookies' }
              ].map((link, index) => (
                <motion.div
                  key={link.text}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.7 + index * 0.1 }}
                >
                  <Link
                    component={RouterLink}
                    to={link.path}
                    sx={{
                      color: 'white',
                      textDecoration: 'none',
                      py: 1,
                      px: 2,
                      borderRadius: 2,
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        transform: 'translateY(-2px)'
                      },
                    }}
                  >
                    {link.text}
                  </Link>
                </motion.div>
              ))}
            </Box>
          </Box>

          {/* Additional Info */}
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <Typography 
                variant="body2" 
                sx={{ 
                  opacity: 0.7, 
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.6) 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                Built with ❤️ for the Student • Powered by Team Highflyers lead by Comrade OGUNLEYE OLASUNKANMI ANTHONY• Designed for Excellence
              </Typography>
            </motion.div>
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
};

export default Footer;