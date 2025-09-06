import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  Box,
  Chip,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { ArrowBack, HowToVote, Category } from '@mui/icons-material';
import { nomineesAPI, categoriesAPI } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';

const NomineeProfile = () => {
  const { nomineeId } = useParams();
  const navigate = useNavigate();
  const [nominee, setNominee] = useState(null);
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchNomineeData();
  }, [nomineeId]);

  const fetchNomineeData = async () => {
    try {
      setLoading(true);
      const nomineeResponse = await nomineesAPI.getById(nomineeId);
      const nomineeData = nomineeResponse.data;
      setNominee(nomineeData);
      
      if (nomineeData.category) {
        const categoryResponse = await categoriesAPI.getById(nomineeData.category);
        setCategory(categoryResponse.data);
      }
    } catch (err) {
      setError('Failed to load nominee details');
      console.error('Error fetching nominee data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVoteClick = () => {
    navigate(`/vote/${nominee.category}/${nominee._id}`);
  };

  if (loading) {
    return <LoadingSpinner message="Loading nominee profile..." />;
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
          sx={{ mb: 2 }}
        >
          Back
        </Button>
      </Box>

      <Grid container spacing={4}>
        {/* Profile Image and Basic Info */}
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            {nominee?.image && (
              <CardMedia
                component="img"
                height="300"
                image={nominee.image}
                alt={nominee.name}
                sx={{ objectFit: 'cover' }}
              />
            )}
            <CardContent>
              <Typography variant="h4" component="h1" gutterBottom>
                {nominee?.name}
              </Typography>
              
              {category && (
                <Chip
                  icon={<Category />}
                  label={category.name}
                  color="primary"
                  sx={{ mb: 2 }}
                />
              )}
              
              <Button
                variant="contained"
                fullWidth
                size="large"
                startIcon={<HowToVote />}
                onClick={handleVoteClick}
                sx={{
                  mt: 2,
                  py: 1.5,
                  bgcolor: 'primary.main',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
                }}
              >
                Vote for {nominee?.name}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Detailed Information */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                About {nominee?.name}
              </Typography>
              
              {nominee?.description && (
                <>
                  <Typography variant="body1" paragraph>
                    {nominee.description}
                  </Typography>
                  <Divider sx={{ my: 3 }} />
                </>
              )}
              
              {nominee?.achievements && nominee.achievements.length > 0 && (
                <>
                  <Typography variant="h6" gutterBottom>
                    Achievements & Recognition
                  </Typography>
                  <List>
                    {nominee.achievements.map((achievement, index) => (
                      <ListItem key={index} sx={{ pl: 0 }}>
                        <ListItemText
                          primary={achievement}
                          primaryTypographyProps={{
                            variant: 'body1',
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>
                  <Divider sx={{ my: 3 }} />
                </>
              )}
              
              {nominee?.qualifications && nominee.qualifications.length > 0 && (
                <>
                  <Typography variant="h6" gutterBottom>
                    Qualifications
                  </Typography>
                  <Box sx={{ mb: 3 }}>
                    {nominee.qualifications.map((qualification, index) => (
                      <Chip
                        key={index}
                        label={qualification}
                        sx={{ mr: 1, mb: 1 }}
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </>
              )}
              
              {nominee?.socialMedia && (
                <>
                  <Typography variant="h6" gutterBottom>
                    Connect
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {nominee.socialMedia.instagram && (
                      <Button
                        variant="outlined"
                        size="small"
                        href={nominee.socialMedia.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Instagram
                      </Button>
                    )}
                    {nominee.socialMedia.twitter && (
                      <Button
                        variant="outlined"
                        size="small"
                        href={nominee.socialMedia.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Twitter
                      </Button>
                    )}
                    {nominee.socialMedia.linkedin && (
                      <Button
                        variant="outlined"
                        size="small"
                        href={nominee.socialMedia.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        LinkedIn
                      </Button>
                    )}
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default NomineeProfile;