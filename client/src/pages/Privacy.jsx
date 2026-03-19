// src/pages/PrivacyPolicy.jsx
import React, { useState } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Grid,
  Divider,
  Chip,
  Button,
  alpha,
  useTheme,
  Zoom,
  Fade,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  IconButton,
  Badge,
  Stack
} from '@mui/material';
import {
  Security as SecurityIcon,
  Gavel as GavelIcon,
  Visibility as VisibilityIcon,
  Cookie as CookieIcon,
  Mail as MailIcon,
  Storage as StorageIcon,
  ExpandMore as ExpandMoreIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  Share as ShareIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  VerifiedUser as VerifiedUserIcon,
  Shield as ShieldIcon,
  Assignment as AssignmentIcon,
  Policy as PolicyIcon,
  Update as UpdateIcon,
  Language as LanguageIcon,
  AccountBalance as AccountBalanceIcon,
  ContactSupport as ContactSupportIcon,
  Lock as LockIcon,
  FolderShared as FolderSharedIcon,
  ManageAccounts as ManageAccountsIcon
} from '@mui/icons-material';

const PrivacyPolicy = () => {
  const theme = useTheme();
  const [expandedSection, setExpandedSection] = useState(null);
  
  const primaryGold = '#D4AF37';
  const backgroundIvory = '#EDE8D0';
  const darkGray = '#1F2937';
  const cardBackground = '#F9F9F9';
  const borderLight = '#E5E7EB';
  const hoverGold = '#B8962E';

  const lastUpdated = "January 15, 2024";

  const sections = [
    {
      id: 'collection',
      title: "Information We Collect",
      icon: <StorageIcon />,
      badge: 'Essential',
      content: [
        "Personal identification information (Name, email address, phone number, etc.)",
        "Payment information (processed securely through our payment partners)",
        "Shipping and billing addresses",
        "Purchase history and preferences",
        "Device information and IP address",
        "Cookies and usage data"
      ]
    },
    {
      id: 'usage',
      title: "How We Use Your Information",
      icon: <VisibilityIcon />,
      badge: 'Processing',
      content: [
        "Process and fulfill your orders",
        "Communicate about your orders and account",
        "Send promotional offers (with your consent)",
        "Improve our website and services",
        "Prevent fraudulent transactions",
        "Comply with legal obligations"
      ]
    },
    {
      id: 'protection',
      title: "Data Protection",
      icon: <SecurityIcon />,
      badge: 'Secure',
      content: [
        "256-bit SSL encryption for all transactions",
        "Regular security audits and monitoring",
        "Strict access controls for employee data access",
        "Secure data storage with industry-standard encryption",
        "Regular backups to prevent data loss"
      ]
    },
    {
      id: 'compliance',
      title: "Legal Compliance",
      icon: <GavelIcon />,
      badge: 'Regulated',
      content: [
        "Compliance with GDPR for EU customers",
        "CCPA compliance for California residents",
        "PCI DSS compliance for payment processing",
        "COPPA compliance - we don't knowingly collect data from children under 13"
      ]
    }
  ];

  const securityHighlights = [
    { icon: <LockIcon />, text: '256-bit SSL Encryption' },
    { icon: <ShieldIcon />, text: 'PCI DSS Compliant' },
    { icon: <VerifiedUserIcon />, text: 'GDPR Ready' },
    { icon: <AssignmentIcon />, text: 'Regular Audits' }
  ];

  const userRights = [
    "Right to Access Your Data",
    "Right to Rectification",
    "Right to Erasure (Right to be Forgotten)",
    "Right to Restrict Processing",
    "Right to Data Portability",
    "Right to Object"
  ];

  const cookiePreferences = [
    { name: 'Essential Cookies', always: true, description: 'Required for website functionality' },
    { name: 'Analytics Cookies', always: false, description: 'Help us improve our website' },
    { name: 'Marketing Cookies', always: false, description: 'Personalized advertising' },
    { name: 'Functional Cookies', always: false, description: 'Enhanced website features' }
  ];

  return (
    <Box sx={{
      minHeight: '100vh',
      bgcolor: backgroundIvory,
      py: { xs: 2, md: 4 }
    }}>
      <Container maxWidth="lg">
        {/* Header Section with Gradient */}
        <Fade in timeout={1000}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, md: 6 },
              mb: 4,
              background: `linear-gradient(135deg, ${primaryGold}15 0%, ${alpha(hoverGold, 0.1)} 100%)`,
              color: darkGray,
              border: `1px solid ${alpha(primaryGold, 0.2)}`,
              borderRadius: 4,
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                right: 0,
                width: '300px',
                height: '300px',
                background: `radial-gradient(circle, ${alpha(primaryGold, 0.1)} 0%, transparent 70%)`,
                borderRadius: '50%',
                transform: 'translate(100px, -100px)'
              }
            }}
          >
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Badge
                  badgeContent="GDPR Compliant"
                  color="success"
                  sx={{
                    '& .MuiBadge-badge': {
                      bgcolor: '#4CAF50',
                      color: 'white',
                      fontSize: '0.7rem',
                      fontWeight: 'bold',
                      px: 1.5,
                      py: 0.5
                    }
                  }}
                >
                  <PolicyIcon sx={{ fontSize: 48, color: primaryGold }} />
                </Badge>
                <Box>
                  <Typography variant="h3" component="h1" sx={{ fontWeight: 700, color: darkGray }}>
                    Privacy Policy
                  </Typography>
                  <Typography variant="h6" sx={{ color: alpha(darkGray, 0.7) }}>
                    Your privacy is important to us at Occamart
                  </Typography>
                </Box>
              </Box>
              
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={6}>
                  <Chip
                    icon={<UpdateIcon />}
                    label={`Last Updated: ${lastUpdated}`}
                    sx={{
                      bgcolor: alpha(primaryGold, 0.1),
                      color: darkGray,
                      border: `1px solid ${alpha(primaryGold, 0.3)}`,
                      '& .MuiChip-icon': { color: primaryGold }
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Stack direction="row" spacing={1} justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
                    <Tooltip title="Download PDF">
                      <IconButton sx={{ color: primaryGold, '&:hover': { bgcolor: alpha(primaryGold, 0.1) } }}>
                        <DownloadIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Print">
                      <IconButton sx={{ color: primaryGold, '&:hover': { bgcolor: alpha(primaryGold, 0.1) } }}>
                        <PrintIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Share">
                      <IconButton sx={{ color: primaryGold, '&:hover': { bgcolor: alpha(primaryGold, 0.1) } }}>
                        <ShareIcon />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Fade>

        {/* Security Highlights */}
        <Zoom in timeout={1000}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 4,
              bgcolor: cardBackground,
              border: `1px solid ${borderLight}`,
              borderRadius: 4
            }}
          >
            <Grid container spacing={2}>
              {securityHighlights.map((item, index) => (
                <Grid item xs={6} md={3} key={index}>
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    p: 2,
                    borderRadius: 2,
                    bgcolor: alpha(primaryGold, 0.05),
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      bgcolor: alpha(primaryGold, 0.1),
                      transform: 'translateY(-2px)'
                    }
                  }}>
                    <Box sx={{ color: primaryGold }}>{item.icon}</Box>
                    <Typography variant="body2" sx={{ fontWeight: 500, color: darkGray }}>
                      {item.text}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Zoom>

        {/* Main Content */}
        <Grid container spacing={3}>
          {sections.map((section, index) => (
            <Grid item xs={12} md={6} key={section.id}>
              <Fade in timeout={1000 + index * 200}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 0,
                    height: '100%',
                    bgcolor: cardBackground,
                    border: `1px solid ${borderLight}`,
                    borderRadius: 4,
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: `0 8px 24px ${alpha(primaryGold, 0.15)}`,
                      borderColor: alpha(primaryGold, 0.3)
                    }
                  }}
                >
                  <Accordion
                    expanded={expandedSection === section.id}
                    onChange={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
                    sx={{
                      bgcolor: 'transparent',
                      boxShadow: 'none',
                      '&:before': { display: 'none' }
                    }}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon sx={{ color: primaryGold }} />}
                      sx={{
                        p: 3,
                        borderBottom: expandedSection === section.id ? `1px solid ${borderLight}` : 'none',
                        '& .MuiAccordionSummary-content': { margin: 0 }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 2 }}>
                        <Box sx={{
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: alpha(primaryGold, 0.1),
                          color: primaryGold
                        }}>
                          {section.icon}
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600, color: darkGray }}>
                              {section.title}
                            </Typography>
                            <Chip
                              label={section.badge}
                              size="small"
                              sx={{
                                bgcolor: alpha(primaryGold, 0.1),
                                color: hoverGold,
                                fontSize: '0.7rem',
                                fontWeight: 500
                              }}
                            />
                          </Box>
                          <Typography variant="caption" sx={{ color: alpha(darkGray, 0.6) }}>
                            {section.content.length} key points
                          </Typography>
                        </Box>
                      </Box>
                    </AccordionSummary>
                    
                    <AccordionDetails sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {section.content.map((item, idx) => (
                          <Box
                            key={idx}
                            sx={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: 1.5,
                              p: 1.5,
                              borderRadius: 2,
                              bgcolor: alpha(primaryGold, 0.02),
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                bgcolor: alpha(primaryGold, 0.05),
                                transform: 'translateX(4px)'
                              }
                            }}
                          >
                            <CheckCircleIcon sx={{ fontSize: 18, color: primaryGold, mt: 0.3 }} />
                            <Typography variant="body2" sx={{ color: darkGray }}>
                              {item}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                </Paper>
              </Fade>
            </Grid>
          ))}
        </Grid>

        {/* Cookie Policy Section */}
        <Fade in timeout={1500}>
          <Paper
            elevation={0}
            sx={{
              p: 4,
              mt: 4,
              bgcolor: cardBackground,
              border: `1px solid ${borderLight}`,
              borderRadius: 4,
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Box sx={{
                p: 1.5,
                borderRadius: 2,
                bgcolor: alpha(primaryGold, 0.1),
                color: primaryGold
              }}>
                <CookieIcon />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 600, color: darkGray }}>
                Cookie Policy
              </Typography>
            </Box>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Typography variant="body2" paragraph sx={{ color: darkGray }}>
                  We use cookies and similar tracking technologies to track activity on our website and hold certain information. 
                  Cookies are files with small amount of data which may include an anonymous unique identifier.
                </Typography>
                <Typography variant="body2" sx={{ color: darkGray }}>
                  You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, 
                  if you do not accept cookies, you may not be able to use some portions of our website.
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    bgcolor: alpha(primaryGold, 0.05),
                    borderRadius: 3
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: darkGray }}>
                    Cookie Preferences
                  </Typography>
                  {cookiePreferences.map((cookie, index) => (
                    <Box key={index} sx={{ mb: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption" sx={{ fontWeight: 500, color: darkGray }}>
                          {cookie.name}
                        </Typography>
                        {cookie.always && (
                          <Chip
                            label="Always Active"
                            size="small"
                            sx={{
                              bgcolor: alpha(primaryGold, 0.1),
                              color: hoverGold,
                              fontSize: '0.6rem',
                              height: 20
                            }}
                          />
                        )}
                      </Box>
                      <Typography variant="caption" sx={{ color: alpha(darkGray, 0.6) }}>
                        {cookie.description}
                      </Typography>
                    </Box>
                  ))}
                </Paper>
              </Grid>
            </Grid>
          </Paper>
        </Fade>

        {/* User Rights Section */}
        <Fade in timeout={1700}>
          <Paper
            elevation={0}
            sx={{
              p: 4,
              mt: 4,
              bgcolor: primaryGold,
              borderRadius: 4,
              color: darkGray,
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                right: 0,
                width: '200px',
                height: '200px',
                background: `radial-gradient(circle, ${alpha('#FFFFFF', 0.2)} 0%, transparent 70%)`,
                borderRadius: '50%'
              }
            }}
          >
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
                Your Rights Under Privacy Laws
              </Typography>
              
              <Grid container spacing={2}>
                {userRights.map((right, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Box sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      p: 1.5,
                      bgcolor: alpha('#FFFFFF', 0.15),
                      borderRadius: 2,
                      backdropFilter: 'blur(4px)',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: alpha('#FFFFFF', 0.25),
                        transform: 'translateX(4px)'
                      }
                    }}>
                      <CheckCircleIcon sx={{ fontSize: 18, color: '#FFFFFF' }} />
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {right}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>

              <Box sx={{
                mt: 3,
                p: 2,
                bgcolor: alpha('#FFFFFF', 0.1),
                borderRadius: 2,
                backdropFilter: 'blur(4px)'
              }}>
                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <InfoIcon sx={{ fontSize: 20 }} />
                  To exercise any of these rights, please contact our privacy team
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Fade>

        {/* Contact Section */}
        <Fade in timeout={1900}>
          <Paper
            elevation={0}
            sx={{
              p: 4,
              mt: 4,
              bgcolor: cardBackground,
              border: `1px solid ${borderLight}`,
              borderRadius: 4
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Box sx={{
                p: 1.5,
                borderRadius: 2,
                bgcolor: alpha(primaryGold, 0.1),
                color: primaryGold
              }}>
                <MailIcon />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 600, color: darkGray }}>
                Contact Our Privacy Team
              </Typography>
            </Box>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      bgcolor: alpha(primaryGold, 0.03),
                      borderRadius: 2,
                      border: `1px solid ${borderLight}`
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: darkGray }}>
                      Data Protection Officer
                    </Typography>
                    <Typography variant="body2" sx={{ color: darkGray }}>
                      dpo@occamart.com
                    </Typography>
                  </Paper>
                  
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      bgcolor: alpha(primaryGold, 0.03),
                      borderRadius: 2,
                      border: `1px solid ${borderLight}`
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: darkGray }}>
                      General Inquiries
                    </Typography>
                    <Typography variant="body2" sx={{ color: darkGray }}>
                      privacy@occamart.com
                    </Typography>
                  </Paper>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    bgcolor: alpha(primaryGold, 0.03),
                    borderRadius: 2,
                    border: `1px solid ${borderLight}`,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: darkGray }}>
                    Office Address
                  </Typography>
                  <Typography variant="body2" sx={{ color: darkGray, mb: 2 }}>
                    123 Privacy Street<br />
                    San Francisco, CA 94105<br />
                    United States
                  </Typography>
                  <Typography variant="body2" sx={{ color: darkGray }}>
                    <strong>Phone:</strong> +1 (555) 123-4567
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            {/* Quick Actions */}
            <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="outlined"
                startIcon={<MailIcon />}
                sx={{
                  borderColor: primaryGold,
                  color: primaryGold,
                  '&:hover': {
                    borderColor: hoverGold,
                    bgcolor: alpha(primaryGold, 0.05)
                  }
                }}
              >
                Email Support
              </Button>
              <Button
                variant="contained"
                startIcon={<ContactSupportIcon />}
                sx={{
                  bgcolor: primaryGold,
                  color: darkGray,
                  '&:hover': {
                    bgcolor: hoverGold
                  }
                }}
              >
                Live Chat
              </Button>
            </Box>
          </Paper>
        </Fade>
      </Container>
    </Box>
  );
};

export default PrivacyPolicy;