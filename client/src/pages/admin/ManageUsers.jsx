// src/pages/admin/ManageUsers.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Users,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  Loader,
  AlertCircle,
  CheckCircle,
  X,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  User,
  Lock,
  Save,
  UserPlus,
  UserCheck,
  UserX,
  MoreVertical,
  ShoppingBag,
  Star,
  Clock
} from 'lucide-react';

const API_URL = 'http://localhost:5000/api';
const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const ManageUsers = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Form state
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    isActive: true
  });

  const colors = {
    bgPrimary: '#FAF7F2',
    bgSecondary: '#F5F0E8',
    primary: '#D4AF37',
    primaryDark: '#B8962E',
    textPrimary: '#1F2937',
    textSecondary: '#4B5563',
    textLight: '#6B7280',
    border: '#E5E7EB',
    white: '#FFFFFF',
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6'
  };

  useEffect(() => {
    fetchUsers();
  }, [currentPage, selectedRole, selectedStatus]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = users.filter(u => 
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.phone?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchTerm, users]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedRole !== 'all') params.append('role', selectedRole);
      if (selectedStatus !== 'all') params.append('isActive', selectedStatus === 'active');
      params.append('page', currentPage);
      params.append('limit', 10);

      const response = await api.get(`/users?${params.toString()}`);
      
      if (response.data.success) {
        setUsers(response.data.data);
        setFilteredUsers(response.data.data);
        setTotalPages(response.data.totalPages || 1);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setMessage({ type: 'error', text: 'Failed to fetch users' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/auth/register', {
        ...userForm,
        isVerified: true
      });

      if (response.data.success) {
        setMessage({ type: 'success', text: 'User added successfully' });
        setShowAddModal(false);
        resetForm();
        fetchUsers();
      }
    } catch (error) {
      console.error('Error adding user:', error);
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to add user' });
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      const response = await api.put(`/users/${selectedUser._id}`, userForm);

      if (response.data.success) {
        setMessage({ type: 'success', text: 'User updated successfully' });
        setShowEditModal(false);
        resetForm();
        fetchUsers();
      }
    } catch (error) {
      console.error('Error updating user:', error);
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update user' });
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      const response = await api.delete(`/users/${userId}`);

      if (response.data.success) {
        setMessage({ type: 'success', text: 'User deleted successfully' });
        fetchUsers();
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to delete user' });
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      const response = await api.patch(`/users/${userId}/toggle-status`, {
        isActive: !currentStatus
      });

      if (response.data.success) {
        setMessage({ type: 'success', text: `User ${!currentStatus ? 'activated' : 'deactivated'} successfully` });
        fetchUsers();
      }
    } catch (error) {
      console.error('Error toggling user status:', error);
      setMessage({ type: 'error', text: 'Failed to update user status' });
    }
  };

  const resetForm = () => {
    setUserForm({
      name: '',
      email: '',
      password: '',
      role: 'user',
      phone: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      isActive: true
    });
    setSelectedUser(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const styles = {
    container: {
      minHeight: '100vh',
      background: colors.bgPrimary,
      padding: '30px',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '30px',
      flexWrap: 'wrap',
      gap: '20px',
    },
    title: {
      fontSize: '2rem',
      fontWeight: '700',
      color: colors.textPrimary,
    },
    addButton: {
      padding: '12px 24px',
      background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
      color: colors.white,
      border: 'none',
      borderRadius: '12px',
      fontSize: '1rem',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    filtersBar: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px',
      flexWrap: 'wrap',
      gap: '15px',
      padding: '20px',
      background: colors.white,
      borderRadius: '12px',
      border: `1px solid ${colors.border}`,
    },
    searchBox: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '10px 15px',
      background: colors.bgPrimary,
      borderRadius: '8px',
      border: `1px solid ${colors.border}`,
      flex: 1,
      minWidth: '250px',
    },
    searchInput: {
      border: 'none',
      background: 'transparent',
      outline: 'none',
      fontSize: '0.95rem',
      width: '100%',
      color: colors.textPrimary,
    },
    filterGroup: {
      display: 'flex',
      gap: '10px',
      flexWrap: 'wrap',
    },
    select: {
      padding: '8px 12px',
      borderRadius: '8px',
      border: `1px solid ${colors.border}`,
      background: colors.white,
      cursor: 'pointer',
      outline: 'none',
    },
    statsRow: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '15px',
      marginBottom: '20px',
    },
    statCard: {
      background: colors.white,
      padding: '20px',
      borderRadius: '12px',
      border: `1px solid ${colors.border}`,
      display: 'flex',
      alignItems: 'center',
      gap: '15px',
    },
    statIcon: {
      width: '50px',
      height: '50px',
      borderRadius: '10px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    tableContainer: {
      background: colors.white,
      borderRadius: '16px',
      border: `1px solid ${colors.border}`,
      overflow: 'auto',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      minWidth: '1000px',
    },
    th: {
      padding: '15px',
      textAlign: 'left',
      background: colors.bgSecondary,
      color: colors.textPrimary,
      fontWeight: '600',
      borderBottom: `2px solid ${colors.border}`,
    },
    td: {
      padding: '15px',
      borderBottom: `1px solid ${colors.border}`,
    },
    statusBadge: {
      padding: '4px 8px',
      borderRadius: '20px',
      fontSize: '0.75rem',
      fontWeight: '600',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
    },
    actionButtons: {
      display: 'flex',
      gap: '8px',
    },
    actionButton: {
      padding: '6px',
      background: colors.bgSecondary,
      border: `1px solid ${colors.border}`,
      borderRadius: '6px',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
    },
    modal: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
    },
    modalContent: {
      background: colors.white,
      borderRadius: '24px',
      padding: '30px',
      maxWidth: '600px',
      width: '100%',
      maxHeight: '90vh',
      overflowY: 'auto',
    },
    modalHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px',
    },
    modalTitle: {
      fontSize: '1.5rem',
      fontWeight: '600',
      color: colors.textPrimary,
    },
    closeButton: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: '5px',
    },
    formGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '15px',
    },
    fullWidth: {
      gridColumn: 'span 2',
    },
    formGroup: {
      marginBottom: '15px',
    },
    label: {
      display: 'block',
      marginBottom: '5px',
      color: colors.textSecondary,
      fontWeight: '500',
    },
    input: {
      width: '100%',
      padding: '10px',
      border: `1px solid ${colors.border}`,
      borderRadius: '8px',
      fontSize: '0.95rem',
    },
    radioGroup: {
      display: 'flex',
      gap: '20px',
      padding: '10px',
    },
    radioLabel: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      cursor: 'pointer',
    },
    submitButton: {
      width: '100%',
      padding: '12px',
      background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
      color: colors.white,
      border: 'none',
      borderRadius: '8px',
      fontSize: '1rem',
      fontWeight: '600',
      cursor: 'pointer',
      marginTop: '20px',
    },
    messageBox: {
      padding: '12px 20px',
      borderRadius: '8px',
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    },
    successMessage: {
      background: `${colors.success}10`,
      border: `1px solid ${colors.success}`,
      color: colors.success,
    },
    errorMessage: {
      background: `${colors.error}10`,
      border: `1px solid ${colors.error}`,
      color: colors.error,
    },
    pagination: {
      display: 'flex',
      justifyContent: 'center',
      gap: '10px',
      marginTop: '20px',
    },
    pageButton: {
      padding: '8px 12px',
      border: `1px solid ${colors.border}`,
      background: colors.white,
      borderRadius: '8px',
      cursor: 'pointer',
    },
    activePage: {
      background: colors.primary,
      color: colors.white,
      borderColor: colors.primary,
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Manage Users</h1>
        <button 
          style={styles.addButton}
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
        >
          <UserPlus size={20} />
          Add New User
        </button>
      </div>

      {message.text && (
        <div style={{
          ...styles.messageBox,
          ...(message.type === 'success' ? styles.successMessage : styles.errorMessage)
        }}>
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span>{message.text}</span>
        </div>
      )}

      <div style={styles.filtersBar}>
        <div style={styles.searchBox}>
          <Search size={18} color={colors.textLight} />
          <input
            type="text"
            placeholder="Search users by name, email or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        <div style={styles.filterGroup}>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            style={styles.select}
          >
            <option value="all">All Roles</option>
            <option value="user">Users</option>
            <option value="admin">Admins</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={styles.select}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>User</th>
              <th style={styles.th}>Contact</th>
              <th style={styles.th}>Role</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Joined</th>
              <th style={styles.th}>Orders</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>
                  <Loader size={40} style={{ animation: 'spin 1s linear infinite' }} />
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: colors.textLight }}>
                  No users found
                </td>
              </tr>
            ) : (
              filteredUsers.map(user => (
                <tr key={user._id}>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: colors.white,
                        fontWeight: '600'
                      }}>
                        {user.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: '500' }}>{user.name}</div>
                        <div style={{ fontSize: '0.8rem', color: colors.textLight }}>@{user.email?.split('@')[0]}</div>
                      </div>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <div><Mail size={14} style={{ display: 'inline', marginRight: '5px' }} /> {user.email}</div>
                    {user.phone && <div><Phone size={14} style={{ display: 'inline', marginRight: '5px' }} /> {user.phone}</div>}
                  </td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.statusBadge,
                      background: user.role === 'admin' ? `${colors.primary}15` : `${colors.info}15`,
                      color: user.role === 'admin' ? colors.primary : colors.info
                    }}>
                      <Shield size={12} />
                      {user.role}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.statusBadge,
                      background: user.isActive ? `${colors.success}15` : `${colors.error}15`,
                      color: user.isActive ? colors.success : colors.error
                    }}>
                      {user.isActive ? <UserCheck size={12} /> : <UserX size={12} />}
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Calendar size={14} color={colors.textLight} />
                      {formatDate(user.createdAt)}
                    </div>
                  </td>
                  <td style={styles.td}>
                    <span style={{ fontWeight: '600', color: colors.primary }}>
                      {user.orderCount || 0}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.actionButtons}>
                      <button
                        style={styles.actionButton}
                        onClick={() => {
                          setSelectedUser(user);
                          setShowDetailsModal(true);
                        }}
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        style={styles.actionButton}
                        onClick={() => {
                          setSelectedUser(user);
                          setUserForm({
                            name: user.name,
                            email: user.email,
                            role: user.role,
                            phone: user.phone || '',
                            address: user.address || '',
                            city: user.city || '',
                            state: user.state || '',
                            pincode: user.pincode || '',
                            isActive: user.isActive
                          });
                          setShowEditModal(true);
                        }}
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        style={{ ...styles.actionButton, color: colors.warning }}
                        onClick={() => handleToggleStatus(user._id, user.isActive)}
                        title={user.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {user.isActive ? <UserX size={16} /> : <UserCheck size={16} />}
                      </button>
                      <button
                        style={{ ...styles.actionButton, color: colors.error }}
                        onClick={() => handleDeleteUser(user._id)}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={styles.pagination}>
          <button
            style={styles.pageButton}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft size={16} />
          </button>
          
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              style={{
                ...styles.pageButton,
                ...(currentPage === i + 1 ? styles.activePage : {})
              }}
              onClick={() => setCurrentPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}
          
          <button
            style={styles.pageButton}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div style={styles.modal} onClick={() => setShowAddModal(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Add New User</h2>
              <button style={styles.closeButton} onClick={() => setShowAddModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddUser}>
              <div style={styles.formGrid}>
                <div style={styles.fullWidth}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Full Name *</label>
                    <input
                      type="text"
                      value={userForm.name}
                      onChange={(e) => setUserForm({...userForm, name: e.target.value})}
                      style={styles.input}
                      required
                    />
                  </div>
                </div>

                <div style={styles.fullWidth}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Email *</label>
                    <input
                      type="email"
                      value={userForm.email}
                      onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                      style={styles.input}
                      required
                    />
                  </div>
                </div>

                <div style={styles.fullWidth}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Password *</label>
                    <input
                      type="password"
                      value={userForm.password}
                      onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                      style={styles.input}
                      required
                    />
                  </div>
                </div>

                <div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Phone</label>
                    <input
                      type="tel"
                      value={userForm.phone}
                      onChange={(e) => setUserForm({...userForm, phone: e.target.value})}
                      style={styles.input}
                    />
                  </div>
                </div>

                <div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Role</label>
                    <select
                      value={userForm.role}
                      onChange={(e) => setUserForm({...userForm, role: e.target.value})}
                      style={styles.input}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>

                <div style={styles.fullWidth}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Address</label>
                    <input
                      type="text"
                      value={userForm.address}
                      onChange={(e) => setUserForm({...userForm, address: e.target.value})}
                      style={styles.input}
                      placeholder="Street address"
                    />
                  </div>
                </div>

                <div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>City</label>
                    <input
                      type="text"
                      value={userForm.city}
                      onChange={(e) => setUserForm({...userForm, city: e.target.value})}
                      style={styles.input}
                    />
                  </div>
                </div>

                <div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>State</label>
                    <input
                      type="text"
                      value={userForm.state}
                      onChange={(e) => setUserForm({...userForm, state: e.target.value})}
                      style={styles.input}
                    />
                  </div>
                </div>

                <div style={styles.fullWidth}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Pincode</label>
                    <input
                      type="text"
                      value={userForm.pincode}
                      onChange={(e) => setUserForm({...userForm, pincode: e.target.value})}
                      style={styles.input}
                    />
                  </div>
                </div>
              </div>

              <button type="submit" style={styles.submitButton}>
                Create User
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div style={styles.modal} onClick={() => setShowEditModal(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Edit User</h2>
              <button style={styles.closeButton} onClick={() => setShowEditModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateUser}>
              <div style={styles.formGrid}>
                <div style={styles.fullWidth}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Full Name</label>
                    <input
                      type="text"
                      value={userForm.name}
                      onChange={(e) => setUserForm({...userForm, name: e.target.value})}
                      style={styles.input}
                    />
                  </div>
                </div>

                <div style={styles.fullWidth}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Email</label>
                    <input
                      type="email"
                      value={userForm.email}
                      onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                      style={styles.input}
                      disabled
                    />
                  </div>
                </div>

                <div style={styles.fullWidth}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>New Password (leave blank to keep current)</label>
                    <input
                      type="password"
                      value={userForm.password}
                      onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                      style={styles.input}
                      placeholder="Enter new password"
                    />
                  </div>
                </div>

                <div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Phone</label>
                    <input
                      type="tel"
                      value={userForm.phone}
                      onChange={(e) => setUserForm({...userForm, phone: e.target.value})}
                      style={styles.input}
                    />
                  </div>
                </div>

                <div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Role</label>
                    <select
                      value={userForm.role}
                      onChange={(e) => setUserForm({...userForm, role: e.target.value})}
                      style={styles.input}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>

                <div style={styles.fullWidth}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Address</label>
                    <input
                      type="text"
                      value={userForm.address}
                      onChange={(e) => setUserForm({...userForm, address: e.target.value})}
                      style={styles.input}
                    />
                  </div>
                </div>

                <div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>City</label>
                    <input
                      type="text"
                      value={userForm.city}
                      onChange={(e) => setUserForm({...userForm, city: e.target.value})}
                      style={styles.input}
                    />
                  </div>
                </div>

                <div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>State</label>
                    <input
                      type="text"
                      value={userForm.state}
                      onChange={(e) => setUserForm({...userForm, state: e.target.value})}
                      style={styles.input}
                    />
                  </div>
                </div>

                <div style={styles.fullWidth}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Pincode</label>
                    <input
                      type="text"
                      value={userForm.pincode}
                      onChange={(e) => setUserForm({...userForm, pincode: e.target.value})}
                      style={styles.input}
                    />
                  </div>
                </div>
              </div>

              <button type="submit" style={styles.submitButton}>
                Update User
              </button>
            </form>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {showDetailsModal && selectedUser && (
        <div style={styles.modal} onClick={() => setShowDetailsModal(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>User Details</h2>
              <button style={styles.closeButton} onClick={() => setShowDetailsModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: colors.white,
                fontSize: '2rem',
                fontWeight: '600',
                margin: '0 auto 10px'
              }}>
                {selectedUser.name?.charAt(0).toUpperCase()}
              </div>
              <h3 style={{ fontSize: '1.3rem', marginBottom: '5px' }}>{selectedUser.name}</h3>
              <span style={{
                ...styles.statusBadge,
                background: selectedUser.role === 'admin' ? `${colors.primary}15` : `${colors.info}15`,
                color: selectedUser.role === 'admin' ? colors.primary : colors.info
              }}>
                <Shield size={12} />
                {selectedUser.role}
              </span>
            </div>

            <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Mail size={18} color={colors.primary} />
                  <span>{selectedUser.email}</span>
                </div>
                {selectedUser.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Phone size={18} color={colors.primary} />
                    <span>{selectedUser.phone}</span>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Calendar size={18} color={colors.primary} />
                  <span>Joined: {formatDate(selectedUser.createdAt)}</span>
                </div>
                {selectedUser.address && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <MapPin size={18} color={colors.primary} />
                    <span>
                      {selectedUser.address}
                      {selectedUser.city && `, ${selectedUser.city}`}
                      {selectedUser.state && `, ${selectedUser.state}`}
                      {selectedUser.pincode && ` - ${selectedUser.pincode}`}
                    </span>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ShoppingBag size={18} color={colors.primary} />
                  <span>Total Orders: {selectedUser.orderCount || 0}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{
                    ...styles.statusBadge,
                    background: selectedUser.isActive ? `${colors.success}15` : `${colors.error}15`,
                    color: selectedUser.isActive ? colors.success : colors.error
                  }}>
                    {selectedUser.isActive ? <UserCheck size={12} /> : <UserX size={12} />}
                    {selectedUser.isActive ? 'Active Account' : 'Inactive Account'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ManageUsers;