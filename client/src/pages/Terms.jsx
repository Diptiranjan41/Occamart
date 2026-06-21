// src/pages/Terms.jsx
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
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  IconButton,
  Badge,
  LinearProgress,
  Alert,
  AlertTitle
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Gavel as GavelIcon,
  Description as DescriptionIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  Share as ShareIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Verified as VerifiedIcon,
  Schedule as ScheduleIcon,
  Payment as PaymentIcon,
  Security as SecurityIcon,
  AccountBalance as AccountBalanceIcon,
  Assignment as AssignmentIcon,
  LocalShipping as LocalShippingIcon,
  // Fixed: Import AssignmentReturn icon correctly
  AssignmentReturn as AssignmentReturnIcon,
  PrivacyTip as PrivacyTipIcon,
  WarningAmber as WarningAmberIcon,
  MenuBook as MenuBookIcon,
  Update as UpdateIcon,
  ContactSupport as ContactSupportIcon,
  ShoppingCart as ShoppingCartIcon,
  Store as StoreIcon,
  Receipt as ReceiptIcon,
  Help as HelpIcon,
  // Alternative return icons if AssignmentReturn doesn't work
  KeyboardReturn as KeyboardReturnIcon,
  Restore as RestoreIcon
} from '@mui/icons-material';

const Terms = () => {
  const [expandedSection, setExpandedSection] = useState(null);
  const [acceptTerms, setAcceptTerms] = useState(false);

  const primaryGold = '#D4AF37';
  const backgroundIvory = '#EDE8D0';
  const darkGray = '#1F2937';
  const cardBackground = '#F9F9F9';
  const borderLight = '#E5E7EB';
  const hoverGold = '#B8962E';

  const lastUpdated = "March 1, 2026";
  const effectiveDate = "March 15, 2026";

  const keyUpdates = [
    "Updated dispute resolution process",
    "Enhanced seller protection policies",
    "New international shipping terms",
    "Revised return window periods"
  ];

  const sections = [
    {
      id: 'agreement',
      title: "Agreement to Terms",
      icon: <DescriptionIcon />,
      badge: 'Foundation',
      content: [
        "By accessing or using Occamart, you agree to be bound by these Terms",
        "If you disagree with any part of the terms, you may not access the service",
        "We reserve the right to modify these terms at any time",
        "Continued use of the platform constitutes acceptance of modified terms"
      ]
    },
    {
      id: 'eligibility',
      title: "Eligibility & Account",
      icon: <VerifiedIcon />,
      badge: 'Requirements',
      content: [
        "Must be at least 18 years old to use our services",
        "Accurate and complete registration information required",
        "You are responsible for maintaining account security",
        "One account per user - no multiple accounts",
        "We reserve the right to refuse service to anyone"
      ]
    },
    {
      id: 'payments',
      title: "Payments & Fees",
      icon: <PaymentIcon />,
      badge: 'Financial',
      content: [
        "All payments are processed securely through our partners",
        "Prices are in USD unless otherwise specified",
        "Seller fees are deducted automatically from sales",
        "Refunds are processed within 5-7 business days",
        "Taxes are calculated based on applicable laws"
      ]
    },
    {
      id: 'shipping',
      title: "Shipping & Delivery",
      icon: <LocalShippingIcon />,
      badge: 'Logistics',
      content: [
        "Sellers are responsible for timely shipping",
        "Tracking numbers must be provided within 48 hours",
        "International customs fees are buyer's responsibility",
        "Delivery estimates are not guaranteed",
        "Lost packages claim process available"
      ]
    },
    {
      id: 'returns',
      title: "Returns & Refunds",
      // Using KeyboardReturnIcon as a reliable alternative
      icon: <KeyboardReturnIcon />,
      badge: 'Policy',
      content: [
        "30-day return window for most items",
        "Items must be in original condition",
        "Return shipping costs are buyer's responsibility unless item is defective",
        "Refunds issued to original payment method",
        "Digital products are non-refundable"
      ]
    },
    {
      id: 'prohibited',
      title: "Prohibited Items",
      icon: <WarningAmberIcon />,
      badge: 'Restrictions',
      content: [
        "Illegal items and substances strictly prohibited",
        "Counterfeit or replica items not allowed",
        "Weapons and hazardous materials banned",
        "Stolen goods or items violating IP rights",
        "We reserve the right to remove any listings"
      ]
    }
  ];

  const importantNotices = [
    {
      icon: <SecurityIcon />,
      title: "Data Protection",
      description: "Your data is protected under GDPR and CCPA guidelines"
    },
    {
      icon: <GavelIcon />,
      title: "Dispute Resolution",
      description: "All disputes resolved through binding arbitration"
    },
    {
      icon: <AccountBalanceIcon />,
      title: "Governing Law",
      description: "These terms are governed by California law"
    }
  ];

  const handleAcceptTerms = () => {
    setAcceptTerms(!acceptTerms);
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      bgcolor: backgroundIvory,
      py: { xs: 3, md: 6 }
    }}>
      <Container maxWidth="lg">
        {/* Hero Header */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 4, md: 6 },
            mb: 4,
            background: `linear-gradient(135deg, ${alpha(primaryGold, 0.1)} 0%, ${alpha(hoverGold, 0.05)} 100%)`,
            border: `1px solid ${alpha(primaryGold, 0.2)}`,
            borderRadius: 4,
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <Box sx={{
            position: 'absolute',
            top: -50,
            right: -50,
            width: 200,
            height: 200,
            background: `radial-gradient(circle, ${alpha(primaryGold, 0.1)} 0%, transparent 70%)`,
            borderRadius: '50%'
          }} />
          
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="center">
              <Box sx={{
                p: 2,
                bgcolor: alpha(primaryGold, 0.15),
                borderRadius: '50%',
                display: 'inline-flex'
              }}>
                <GavelIcon sx={{ fontSize: 48, color: primaryGold }} />
              </Box>
              
              <Box sx={{ flex: 1 }}>
                <Typography variant="h3" sx={{ fontWeight: 700, color: darkGray, mb: 1 }}>
                  Terms & Conditions
                </Typography>
                <Typography variant="h6" sx={{ color: alpha(darkGray, 0.7), mb: 2 }}>
                  Please read these terms carefully before using Occamart
                </Typography>
                
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
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
                  <Chip
                    icon={<ScheduleIcon />}
                    label={`Effective: ${effectiveDate}`}
                    sx={{
                      bgcolor: alpha(primaryGold, 0.1),
                      color: darkGray,
                      border: `1px solid ${alpha(primaryGold, 0.3)}`,
                      '& .MuiChip-icon': { color: primaryGold }
                    }}
                  />
                </Stack>
              </Box>

              <Stack direction="row" spacing={1}>
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
            </Stack>
          </Box>
        </Paper>

        {/* Key Updates Alert */}
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <InfoIcon sx={{ color: primaryGold }} />
            <Typography variant="h6" sx={{ color: darkGray, fontWeight: 600 }}>
              What's New in This Version
            </Typography>
          </Box>
          <Grid container spacing={2}>
            {keyUpdates.map((update, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Box sx={{
                  p: 1.5,
                  bgcolor: alpha(primaryGold, 0.05),
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <CheckCircleIcon sx={{ fontSize: 16, color: primaryGold }} />
                  <Typography variant="body2" sx={{ color: darkGray }}>
                    {update}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Paper>

        {/* Important Notices */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {importantNotices.map((notice, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  bgcolor: cardBackground,
                  border: `1px solid ${borderLight}`,
                  borderRadius: 3,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: primaryGold,
                    transform: 'translateY(-4px)',
                    boxShadow: `0 12px 24px ${alpha(primaryGold, 0.1)}`
                  }
                }}
              >
                <Box sx={{ color: primaryGold, mb: 1.5 }}>
                  {notice.icon}
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: darkGray, mb: 0.5 }}>
                  {notice.title}
                </Typography>
                <Typography variant="body2" sx={{ color: alpha(darkGray, 0.7) }}>
                  {notice.description}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Main Terms Sections */}
        <Grid container spacing={3}>
          {sections.map((section, index) => (
            <Grid item xs={12} md={6} key={section.id}>
              <Paper
                elevation={0}
                sx={{
                  bgcolor: cardBackground,
                  border: `1px solid ${borderLight}`,
                  borderRadius: 4,
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  '&:hover': {
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
                      borderBottom: expandedSection === section.id ? `1px solid ${borderLight}` : 'none'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{
                        p: 1,
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
                              fontSize: '0.65rem'
                            }}
                          />
                        </Box>
                        <Typography variant="caption" sx={{ color: alpha(darkGray, 0.6) }}>
                          {section.content.length} clauses
                        </Typography>
                      </Box>
                    </Box>
                  </AccordionSummary>
                  
                  <AccordionDetails sx={{ p: 3 }}>
                    <Stack spacing={2}>
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
                          <Box sx={{
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            bgcolor: alpha(primaryGold, 0.2),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mt: 0.3
                          }}>
                            <Typography variant="caption" sx={{ color: primaryGold, fontWeight: 600 }}>
                              {idx + 1}
                            </Typography>
                          </Box>
                          <Typography variant="body2" sx={{ color: darkGray, flex: 1 }}>
                            {item}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  </AccordionDetails>
                </Accordion>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Legal Compliance Section */}
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
          <Typography variant="h5" sx={{ fontWeight: 600, color: darkGray, mb: 3 }}>
            Legal Compliance & Disclaimers
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  bgcolor: alpha(primaryGold, 0.03),
                  borderRadius: 3,
                  border: `1px solid ${borderLight}`
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: darkGray, mb: 2 }}>
                  Warranty Disclaimer
                </Typography>
                <Typography variant="body2" sx={{ color: alpha(darkGray, 0.8), mb: 1 }}>
                  Occamart provides the platform "as is" and "as available" without warranties of any kind.
                </Typography>
                <Typography variant="body2" sx={{ color: alpha(darkGray, 0.6), fontSize: '0.75rem' }}>
                  We do not guarantee that our service will be uninterrupted or error-free.
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  bgcolor: alpha(primaryGold, 0.03),
                  borderRadius: 3,
                  border: `1px solid ${borderLight}`
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: darkGray, mb: 2 }}>
                  Limitation of Liability
                </Typography>
                <Typography variant="body2" sx={{ color: alpha(darkGray, 0.8), mb: 1 }}>
                  To the maximum extent permitted by law, Occamart shall not be liable for any indirect damages.
                </Typography>
                <Typography variant="body2" sx={{ color: alpha(darkGray, 0.6), fontSize: '0.75rem' }}>
                  Total liability limited to the amount you paid for services in the past 12 months.
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Paper>

        {/* Acknowledgment Section */}
        <Paper
          elevation={0}
          sx={{
            p: 4,
            mt: 4,
            bgcolor: primaryGold,
            borderRadius: 4,
            color: darkGray,
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <Box sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '300px',
            height: '300px',
            background: `radial-gradient(circle, ${alpha('#FFFFFF', 0.2)} 0%, transparent 70%)`,
            borderRadius: '50%',
            transform: 'translate(100px, -100px)'
          }} />
          
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
              Acknowledgment of Terms
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, opacity: 0.9 }}>
              By using Occamart, you acknowledge that you have read, understood, and agree to be bound by these Terms & Conditions.
            </Typography>
            
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
              <Button
                variant="contained"
                onClick={handleAcceptTerms}
                startIcon={acceptTerms ? <CheckCircleIcon /> : null}
                sx={{
                  bgcolor: darkGray,
                  color: '#FFFFFF',
                  px: 4,
                  py: 1.5,
                  '&:hover': {
                    bgcolor: alpha(darkGray, 0.8)
                  }
                }}
              >
                {acceptTerms ? 'Terms Accepted' : 'Accept Terms'}
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<ContactSupportIcon />}
                sx={{
                  borderColor: '#FFFFFF',
                  color: darkGray,
                  '&:hover': {
                    borderColor: '#FFFFFF',
                    bgcolor: alpha('#FFFFFF', 0.1)
                  }
                }}
              >
                Contact Support
              </Button>
            </Stack>

            {acceptTerms && (
              <Alert
                icon={<CheckCircleIcon fontSize="inherit" />}
                severity="success"
                sx={{
                  mt: 2,
                  bgcolor: alpha('#FFFFFF', 0.2),
                  color: darkGray,
                  '& .MuiAlert-icon': { color: '#FFFFFF' }
                }}
              >
                <AlertTitle sx={{ color: darkGray, fontWeight: 600 }}>Success</AlertTitle>
                Thank you for accepting our terms. You can now continue using Occamart.
              </Alert>
            )}
          </Box>
        </Paper>

        {/* Reading Progress Indicator */}
        <Box sx={{
          position: 'sticky',
          bottom: 20,
          mt: 2,
          p: 2,
          bgcolor: alpha(cardBackground, 0.9),
          backdropFilter: 'blur(8px)',
          borderRadius: 4,
          border: `1px solid ${alpha(primaryGold, 0.2)}`,
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}>
          <MenuBookIcon sx={{ color: primaryGold }} />
          <Box sx={{ flex: 1 }}>
            <LinearProgress
              variant="determinate"
              value={expandedSection ? (Object.keys(sections).indexOf(expandedSection) + 1) / sections.length * 100 : 0}
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: alpha(primaryGold, 0.1),
                '& .MuiLinearProgress-bar': {
                  bgcolor: primaryGold,
                  borderRadius: 4
                }
              }}
            />
          </Box>
          <Typography variant="caption" sx={{ color: darkGray }}>
            {expandedSection ? `${Math.round((Object.keys(sections).indexOf(expandedSection) + 1) / sections.length * 100)}% read` : 'Start reading'}
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Terms;