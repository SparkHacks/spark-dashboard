import { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ChevronDown, ChevronRight, Utensils } from 'lucide-react';

interface User {
  uid: string;
  email: string;
  displayName: string | null;
  customClaims: {
    admin?: boolean;
    qrScanner?: boolean;
    webDev?: boolean;
    director?: boolean;
    exception?: boolean;
  } | null;
}

interface RoleManagerProps {
  users: User[];
  canModifyRoles: boolean;
  canModifyAdminRole: boolean;
}

const ROLE_CONFIG = {
  admin: { label: 'Admin', color: '#BFC3F4' },
  qrScanner: { label: 'QR Scanner', color: '#FFC77E' },
  webDev: { label: 'Web Dev', color: '#A9D796' },
  director: { label: 'Director', color: '#BEE2F5' },
  exception: { label: 'Exception', color: '#F4BDBD' }
};

export default function RoleManager({ users, canModifyRoles, canModifyAdminRole }: RoleManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('with-roles');
  const [exceptionEmail, setExceptionEmail] = useState('');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');

  // Food groups state
  const [foodGroups, setFoodGroups] = useState<Record<number, string[]>>({ 1: [], 2: [], 3: [], 4: [] });
  const [foodGroupsTotal, setFoodGroupsTotal] = useState(0);
  const [expandedGroups, setExpandedGroups] = useState<Record<number, boolean>>({ 1: false, 2: false, 3: false, 4: false });
  const [isAssigningGroups, setIsAssigningGroups] = useState(false);
  const [isClearingGroups, setIsClearingGroups] = useState(false);
  const [foodGroupsLoaded, setFoodGroupsLoaded] = useState(false);

  useEffect(() => {
    const savedFilter = localStorage.getItem('roleManagerFilter');
    if (savedFilter) {
      setFilterRole(savedFilter);
    }
  }, []);

  // Fetch food groups on mount
  useEffect(() => {
    fetchFoodGroups();
  }, []);

  const fetchFoodGroups = async () => {
    try {
      const res = await fetch('/api/auth/assign-food-groups');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setFoodGroups(data.groups);
          setFoodGroupsTotal(data.total);
          setFoodGroupsLoaded(true);
        }
      }
    } catch (err) {
      console.error('Failed to fetch food groups:', err);
    }
  };

  const assignFoodGroups = async () => {
    if (!canModifyAdminRole) {
      toast.error('Only admins can assign food groups');
      return;
    }

    setIsAssigningGroups(true);
    try {
      const res = await fetch('/api/auth/assign-food-groups', {
        method: 'POST'
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(`Error: ${data.error || 'Failed to assign groups'}`);
        return;
      }

      toast.success(data.message);
      await fetchFoodGroups();
    } catch (err) {
      console.error(err);
      toast.error('Failed to assign food groups');
    } finally {
      setIsAssigningGroups(false);
    }
  };

  const toggleGroupExpanded = (group: number) => {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const clearFoodGroups = async () => {
    if (!canModifyAdminRole) {
      toast.error('Only admins can clear food groups');
      return;
    }

    if (!confirm('Are you sure you want to clear ALL food group assignments? This cannot be undone.')) {
      return;
    }

    setIsClearingGroups(true);
    try {
      const res = await fetch('/api/auth/assign-food-groups', {
        method: 'DELETE'
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(`Error: ${data.error || 'Failed to clear groups'}`);
        return;
      }

      toast.success(data.message);
      await fetchFoodGroups();
    } catch (err) {
      console.error(err);
      toast.error('Failed to clear food groups');
    } finally {
      setIsClearingGroups(false);
    }
  };

  const handleFilterChange = (newFilter: string) => {
    setFilterRole(newFilter);
    localStorage.setItem('roleManagerFilter', newFilter);
  };

  const hasRole = (user: User, role: string): boolean => {
    return user.customClaims?.[role as keyof typeof user.customClaims] === true;
  };

  const regularUsers = users.filter(u => !hasRole(u, 'exception'));
  const exceptionUsers = users.filter(u => hasRole(u, 'exception'));

  
  const getRolePriority = (user: User): number => {
    if (hasRole(user, 'admin')) return 1;
    if (hasRole(user, 'director')) return 2;
    if (hasRole(user, 'webDev')) return 3;
    if (hasRole(user, 'qrScanner')) return 4;
    return 5; 
  };

  const toggleRole = async (email: string, role: string, currentlyHas: boolean) => {
    if (!canModifyRoles) {
      toast.error('You do not have permission to modify roles');
      return;
    }

    if (role === 'admin' && !canModifyAdminRole) {
      toast.error('Only admins can modify the admin role');
      return;
    }

    const action = currentlyHas ? 'remove' : 'add';
    const formData = new FormData();
    formData.append('email', email);
    formData.append('role', role);
    formData.append('action', action);

    try {
      const res = await fetch('/api/modify-roles', {
        method: 'POST',
        body: formData
      });

      const msg = await res.text();

      if (!res.ok) {
        toast.error(`Error: ${msg}`);
        return;
      }

      toast.success(msg);
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      console.error(err);
      toast.error('Failed to modify role');
    }
  };

  const toggleException = async (email: string, currentlyHas: boolean) => {
    if (!canModifyAdminRole) {
      toast.error('Only admins can modify exception status');
      return;
    }

    const action = currentlyHas ? 'remove' : 'add';
    const formData = new FormData();
    formData.append('email', email);
    formData.append('action', action);

    try {
      const res = await fetch('/api/modify-exception', {
        method: 'POST',
        body: formData
      });

      const msg = await res.text();

      if (!res.ok) {
        toast.error(`Error: ${msg}`);
        return;
      }

      toast.success(msg);
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      console.error(err);
      toast.error('Failed to modify exception status');
    }
  };

  const getUserRoleCount = (user: User): number => {
    if (!user.customClaims) return 0;
    return Object.values(user.customClaims).filter(v => v === true).length;
  };

  const filteredUsers = regularUsers
    .filter(user => {
      const matchesSearch = !searchQuery ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.displayName?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRole = filterRole === 'all' ||
        (filterRole === 'with-roles' && getUserRoleCount(user) > 0) ||
        (filterRole === 'none' && !user.customClaims) ||
        hasRole(user, filterRole);

      return matchesSearch && matchesRole;
    })
    .sort((a, b) => {
      const priorityA = getRolePriority(a);
      const priorityB = getRolePriority(b);
      if (priorityA !== priorityB) return priorityA - priorityB;
      
      return (a.email || '').localeCompare(b.email || '');
    });

  const addNewUser = async () => {
    if (!newUserEmail.trim()) {
      toast.error('Please enter an email');
      return;
    }

    if (!newUserName.trim()) {
      toast.error('Please enter a name');
      return;
    }

    try {
      const response = await fetch('/api/add-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: newUserEmail.trim(),
          displayName: newUserName.trim()
        }),
      });

      const msg = await response.text();

      if (!response.ok) {
        toast.error(`Error: ${msg}`);
        return;
      }

      toast.success(msg);
      setNewUserEmail('');
      setNewUserName('');
      setShowAddUserModal(false);
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      console.error(err);
      toast.error('Failed to add user');
    }
  };

  const addException = async () => {
    if (!exceptionEmail.trim()) {
      toast.error('Please enter an email');
      return;
    }

    const formData = new FormData();
    formData.append('email', exceptionEmail.trim());
    formData.append('action', 'add');

    try {
      const res = await fetch('/api/modify-exception', {
        method: 'POST',
        body: formData
      });

      const msg = await res.text();

      if (!res.ok) {
        toast.error(`Error: ${msg}`);
        return;
      }

      toast.success(msg);
      setExceptionEmail('');
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      console.error(err);
      toast.error('Failed to add exception user');
    }
  };

  const removeException = async (email: string) => {
    const formData = new FormData();
    formData.append('email', email);
    formData.append('action', 'remove');

    try {
      const res = await fetch('/api/modify-exception', {
        method: 'POST',
        body: formData
      });

      const msg = await res.text();

      if (!res.ok) {
        toast.error(`Error: ${msg}`);
        return;
      }

      toast.success(msg);
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      console.error(err);
      toast.error('Failed to remove exception user');
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Header */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '28px' }}>Role Management</h1>
          <p style={{ margin: 0, color: '#666' }}>
            Manage user roles and permissions. {!canModifyRoles && '⚠️ You have view-only access.'}
          </p>
        </div>
        {canModifyAdminRole && (
          <button
            onClick={() => setShowAddUserModal(true)}
            style={{
              padding: '10px 20px',
              backgroundColor: '#8d6db5',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#7a5da0';
              e.currentTarget.style.transform = 'scale(1.02)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#8d6db5';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            + Add New User
          </button>
        )}
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '20px',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            flex: '1',
            minWidth: '250px',
            padding: '12px 16px',
            border: '2px solid #ddd',
            borderRadius: '8px',
            fontSize: '14px',
            outline: 'none',
            transition: 'border-color 0.2s'
          }}
          onFocus={(e) => e.target.style.borderColor = '#8d6db5'}
          onBlur={(e) => e.target.style.borderColor = '#ddd'}
        />

        <select
          value={filterRole}
          onChange={(e) => handleFilterChange(e.target.value)}
          style={{
            padding: '12px 16px',
            border: '2px solid #ddd',
            borderRadius: '8px',
            fontSize: '14px',
            outline: 'none',
            cursor: 'pointer',
            backgroundColor: 'white'
          }}
        >
          <option value="with-roles">With Roles ({regularUsers.filter(u => getUserRoleCount(u) > 0).length})</option>
          <option value="all">All Users ({regularUsers.length})</option>
          <option value="admin">Admin Only</option>
          <option value="qrScanner">QR Scanner Only</option>
          <option value="webDev">Web Dev Only</option>
          <option value="director">Director Only</option>
          <option value="none">No Roles</option>
        </select>
      </div>

      {/* Roles Section Title */}
      <h2 style={{ fontSize: '20px', marginBottom: '16px', marginTop: '8px' }}>User Roles</h2>

      {/* Users Table */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          gap: '16px',
          padding: '16px 20px',
          backgroundColor: '#f8f9fa',
          fontWeight: '600',
          fontSize: '14px',
          color: '#666',
          borderBottom: '2px solid #e9ecef'
        }}>
          <div>USER</div>
          <div>ROLES</div>
        </div>

        {filteredUsers.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#999' }}>
            No users found
          </div>
        ) : (
          filteredUsers.map((user, index) => (
            <div
              key={user.uid}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                gap: '16px',
                padding: '16px 20px',
                borderBottom: index < filteredUsers.length - 1 ? '1px solid #f0f0f0' : 'none',
                alignItems: 'center',
                transition: 'background-color 0.15s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
            >
              {/* User Info */}
              <div style={{ minWidth: 0, overflow: 'hidden' }}>
                <div style={{ fontWeight: '600', fontSize: '15px', marginBottom: '4px' }}>
                  {user.displayName || 'No Name'}
                </div>
                <div style={{
                  fontSize: '13px',
                  color: '#666',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {user.email}
                </div>
              </div>

              {/* Role Badges */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                {Object.entries(ROLE_CONFIG).map(([roleKey, config]) => {
                  if (roleKey === 'exception') return null;
                  const hasThisRole = hasRole(user, roleKey);
                  const isAdminRole = roleKey === 'admin';
                  const canToggle = canModifyRoles && (!isAdminRole || canModifyAdminRole);

                  return (
                    <button
                      key={roleKey}
                      onClick={() => canToggle && toggleRole(user.email, roleKey, hasThisRole)}
                      disabled={!canToggle}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: hasThisRole ? 'none' : '2px dashed #ddd',
                        backgroundColor: hasThisRole ? config.color : 'transparent',
                        color: hasThisRole ? '#333' : '#999',
                        fontSize: '13px',
                        fontWeight: hasThisRole ? '600' : '400',
                        cursor: canToggle ? 'pointer' : 'not-allowed',
                        opacity: !canToggle ? 0.5 : 1,
                        transition: 'all 0.2s',
                        whiteSpace: 'nowrap'
                      }}
                      onMouseEnter={(e) => {
                        if (canToggle) {
                          e.currentTarget.style.transform = 'scale(1.05)';
                          if (!hasThisRole) {
                            e.currentTarget.style.borderColor = config.color;
                            e.currentTarget.style.color = config.color;
                          }
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        if (!hasThisRole) {
                          e.currentTarget.style.borderColor = '#ddd';
                          e.currentTarget.style.color = '#999';
                        }
                      }}
                    >
                      {config.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Stats */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginTop: '20px',
        flexWrap: 'wrap',
        fontSize: '13px',
        color: '#666'
      }}>
        <span>Total Users: <strong>{regularUsers.length}</strong></span>
        <span>•</span>
        <span>With Roles: <strong>{regularUsers.filter(u => getUserRoleCount(u) > 0).length}</strong></span>
        <span>•</span>
        <span>Showing: <strong>{filteredUsers.length}</strong></span>
      </div>

      {/* Exception Users Section */}
      <div style={{ marginTop: '48px' }}>
        <h2 style={{ fontSize: '20px', marginBottom: '8px' }}>Exception Users</h2>
        <p style={{ margin: '0 0 16px 0', color: '#666', fontSize: '14px' }}>
          For SparkHacks participants who don't have uic.edu emails
        </p>

        {/* Add Exception User */}
        {canModifyAdminRole && (
          <div style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '16px',
            flexWrap: 'wrap'
          }}>
            <input
              type="email"
              placeholder="Enter email to add exception"
              value={exceptionEmail}
              onChange={(e) => setExceptionEmail(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addException()}
              style={{
                flex: '1',
                minWidth: '250px',
                padding: '12px 16px',
                border: '2px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#F4BDBD'}
              onBlur={(e) => e.target.style.borderColor = '#ddd'}
            />
            <button
              onClick={addException}
              style={{
                padding: '12px 24px',
                backgroundColor: '#F4BDBD',
                color: '#333',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f0a9a9';
                e.currentTarget.style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#F4BDBD';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              Add Exception
            </button>
          </div>
        )}

        {/* Exception Users List */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          {exceptionUsers.length === 0 ? (
            <div style={{ padding: '24px 20px', textAlign: 'center', color: '#999' }}>
              No exception users
            </div>
          ) : (
            exceptionUsers.map((user, index) => (
              <div
                key={user.uid}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '14px 20px',
                  borderBottom: index < exceptionUsers.length - 1 ? '1px solid #f0f0f0' : 'none',
                  transition: 'background-color 0.15s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fff5f5'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '2px' }}>
                    {user.displayName || 'No Name'}
                  </div>
                  <div style={{ fontSize: '13px', color: '#666' }}>
                    {user.email}
                  </div>
                </div>
                {canModifyAdminRole && (
                  <button
                    onClick={() => removeException(user.email)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: 'transparent',
                      color: '#dc3545',
                      border: '2px solid #dc3545',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#dc3545';
                      e.currentTarget.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#dc3545';
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        <div style={{ marginTop: '12px', fontSize: '13px', color: '#666' }}>
          Exception Users: <strong>{exceptionUsers.length}</strong>
        </div>
      </div>

      {/* Food Groups Section */}
      <div style={{ marginTop: '48px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '20px', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Utensils size={22} />
              Food Groups
            </h2>
            <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
              Assign applicants to food groups for meal distribution
            </p>
          </div>
          {canModifyAdminRole && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={assignFoodGroups}
                disabled={isAssigningGroups}
                style={{
                  padding: '10px 20px',
                  backgroundColor: isAssigningGroups ? '#ccc' : '#5a9ae8',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: isAssigningGroups ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => {
                  if (!isAssigningGroups) {
                    e.currentTarget.style.backgroundColor = '#4a8ad8';
                    e.currentTarget.style.transform = 'scale(1.02)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isAssigningGroups) {
                    e.currentTarget.style.backgroundColor = '#5a9ae8';
                    e.currentTarget.style.transform = 'scale(1)';
                  }
                }}
              >
                {isAssigningGroups ? 'Assigning...' : 'Assign New Applicants'}
              </button>
              <button
                onClick={clearFoodGroups}
                disabled={isClearingGroups || foodGroupsTotal === 0}
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'transparent',
                  color: isClearingGroups || foodGroupsTotal === 0 ? '#ccc' : '#dc3545',
                  border: `2px solid ${isClearingGroups || foodGroupsTotal === 0 ? '#ccc' : '#dc3545'}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: isClearingGroups || foodGroupsTotal === 0 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => {
                  if (!isClearingGroups && foodGroupsTotal > 0) {
                    e.currentTarget.style.backgroundColor = '#dc3545';
                    e.currentTarget.style.color = 'white';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isClearingGroups && foodGroupsTotal > 0) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#dc3545';
                  }
                }}
              >
                {isClearingGroups ? 'Clearing...' : 'Clear All'}
              </button>
            </div>
          )}
        </div>

        {/* Group Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '12px',
          marginBottom: '16px'
        }}>
          {[1, 2, 3, 4].map(group => (
            <div
              key={group}
              style={{
                backgroundColor: 'white',
                padding: '16px',
                borderRadius: '12px',
                textAlign: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                border: `3px solid ${['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'][group - 1]}`
              }}
            >
              <div style={{ fontSize: '28px', fontWeight: '700', color: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'][group - 1] }}>
                {foodGroups[group]?.length || 0}
              </div>
              <div style={{ fontSize: '14px', color: '#666', fontWeight: '500' }}>Group {group}</div>
            </div>
          ))}
        </div>

        {/* Total */}
        <div style={{ marginBottom: '16px', fontSize: '14px', color: '#666' }}>
          Total Assigned: <strong>{foodGroupsTotal}</strong>
        </div>

        {/* Collapsible Group Lists */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          {[1, 2, 3, 4].map((group, index) => (
            <div key={group}>
              <button
                onClick={() => toggleGroupExpanded(group)}
                style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '14px 20px',
                  border: 'none',
                  borderBottom: index < 3 || expandedGroups[group] ? '1px solid #f0f0f0' : 'none',
                  backgroundColor: expandedGroups[group] ? '#f8f9fa' : 'white',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = expandedGroups[group] ? '#f8f9fa' : 'white'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'][group - 1]
                  }} />
                  <span style={{ fontWeight: '600', fontSize: '15px' }}>Group {group}</span>
                  <span style={{ color: '#666', fontSize: '14px' }}>({foodGroups[group]?.length || 0} members)</span>
                </div>
                {expandedGroups[group] ? <ChevronDown size={20} color="#666" /> : <ChevronRight size={20} color="#666" />}
              </button>

              {expandedGroups[group] && (
                <div style={{
                  maxHeight: '200px',
                  overflowY: 'auto',
                  borderBottom: index < 3 ? '1px solid #f0f0f0' : 'none'
                }}>
                  {foodGroups[group]?.length === 0 ? (
                    <div style={{ padding: '12px 20px', color: '#999', fontSize: '14px' }}>
                      No members assigned
                    </div>
                  ) : (
                    foodGroups[group]?.map((email, emailIndex) => (
                      <div
                        key={email}
                        style={{
                          padding: '8px 20px 8px 44px',
                          fontSize: '13px',
                          color: '#555',
                          borderBottom: emailIndex < foodGroups[group].length - 1 ? '1px solid #f8f8f8' : 'none',
                          backgroundColor: emailIndex % 2 === 0 ? 'white' : '#fafafa'
                        }}
                      >
                        {email}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {!foodGroupsLoaded && (
          <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
            Loading food groups...
          </div>
        )}
      </div>

      {/* Add New User Modal */}
      {showAddUserModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setShowAddUserModal(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '32px',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ margin: '0 0 8px 0', fontSize: '24px' }}>Add New User</h2>
            <p style={{ margin: '0 0 24px 0', color: '#666', fontSize: '14px' }}>
              Add a user to the system who hasn't logged in yet. They'll be able to sign in with Google using this email.
            </p>

            <input
              type="text"
              placeholder="Enter full name"
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addNewUser()}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                marginBottom: '12px',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#8d6db5'}
              onBlur={(e) => e.target.style.borderColor = '#ddd'}
            />

            <input
              type="email"
              placeholder="Enter email address"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addNewUser()}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                marginBottom: '24px',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#8d6db5'}
              onBlur={(e) => e.target.style.borderColor = '#ddd'}
            />

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowAddUserModal(false);
                  setNewUserEmail('');
                  setNewUserName('');
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'transparent',
                  color: '#666',
                  border: '2px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#999';
                  e.currentTarget.style.color = '#333';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#ddd';
                  e.currentTarget.style.color = '#666';
                }}
              >
                Cancel
              </button>
              <button
                onClick={addNewUser}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#8d6db5',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#7a5da0'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#8d6db5'}
              >
                Add User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
