// src/pages/PasswordManager.jsx
import { useState, useEffect } from 'react';
import { AlertCircle, Eye, EyeOff, Lock, Plus, RefreshCw, Search, Trash2, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from "@/components/ui/checkbox";
import authStorage from '../lib/authStorage';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const PasswordManager = () => {
  const [masterPassword, setMasterPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [passwords, setPasswords] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newPassword, setNewPassword] = useState({
    name: '',
    email: '',
    url: '',
    category_id: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  const API_URL = 'http://localhost:8000';

  useEffect(() => {
    if (isAuthenticated) {
      fetchPasswords();
      fetchCategories();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const checkAuth = async () => {
      const authData = authStorage.get();
      if (authData?.masterPassword) {
        try {
          const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ master_password: authData.masterPassword })
          });

          if (response.ok) {
            setMasterPassword(authData.masterPassword);
            setIsAuthenticated(true);
          } else {
            authStorage.clear();
          }
        } catch (err) {
          console.error('Auth check failed:', err);
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async () => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ master_password: masterPassword })
      });

      if (response.ok) {
        authStorage.saveSession(masterPassword, rememberMe);
        setIsAuthenticated(true);
        setError('');
      } else {
        setError('Invalid master password');
      }
    } catch (err) {
      console.error('Login failed:', err);
      setError('Failed to connect to server');
    }
  };

  const handleLogout = () => {
    authStorage.clear();
    setIsAuthenticated(false);
    setMasterPassword('');
    setPasswords([]);
    setCategories([]);
    setNewPassword({
      name: '',
      email: '',
      url: '',
      category_id: '',
      password: ''
    });
    setFilterCategory('all');
    setError('');
  };

  const fetchPasswords = async () => {
    try {
      const response = await fetch(
        `${API_URL}/passwords?master_password=${masterPassword}`
      );
      if (response.ok) {
        const data = await response.json();
        setPasswords(data);
      }
    } catch (err) {
      console.log(err);
      setError('Failed to fetch passwords');
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(
        `${API_URL}/categories?master_password=${masterPassword}`
      );
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (err) {
      console.log(err);
      setError('Failed to fetch categories');
    }
  };

  const generatePassword = async () => {
    try {
      const response = await fetch(`${API_URL}/generate-password`);
      if (response.ok) {
        const data = await response.json();
        setNewPassword({ ...newPassword, password: data.password });
      }
    } catch (err) {
      console.log(err);
      setError('Failed to generate password');
    }
  };

  const deletePassword = async (passwordId) => {
    try {
      const response = await fetch(`${API_URL}/passwords/${passwordId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          master_password: masterPassword
        })
      });
      
      if (response.ok) {
        fetchPasswords(); // Refresh the password list
        // Optional: Show success message
      } else {
        setError('Failed to delete password');
      }
    } catch (err) {
      setError('Failed to delete password');
      console.error('Delete error:', err);
    }
  };

  const addPassword = async () => {
    try {
      const response = await fetch(`${API_URL}/passwords`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newPassword,
          master_password: masterPassword
        })
      });

      if (response.ok) {
        setNewPassword({ name: '', email: '', url: '', category_id: '', password: '' });
        fetchPasswords();
      }
    } catch (err) {
      console.log(err);
      setError('Failed to add password');
    }
  };

  const addCategory = async () => {
    try {
      const response = await fetch(`${API_URL}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCategory,
          master_password: masterPassword
        })
      });

      if (response.ok) {
        setNewCategory('');
        setShowAddCategory(false);
        fetchCategories();
      }
    } catch (err) {
      console.log(err);
      setError('Failed to add category');
    }
  };

  // Filter passwords based on search term and category
  const filteredPasswords = passwords.filter(password => {
    const matchesSearch = searchTerm === '' || 
      password.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      password.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (password.url && password.url.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = filterCategory === 'all' || // Changed from empty string to 'all'
      password.category_id?.toString() === filterCategory;
    
    return matchesSearch && matchesCategory;
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Password Manager
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="masterPassword">Master Password</Label>
                <Input
                  id="masterPassword"
                  type="password"
                  value={masterPassword}
                  onChange={(e) => setMasterPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && login()}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="rememberMe"
                  checked={rememberMe}
                  onCheckedChange={setRememberMe}
                />
                <label
                  htmlFor="rememberMe"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Remember me
                </label>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <Button className="w-full" onClick={login}>
                Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-6xl space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Add New Password</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={newPassword.name}
                    onChange={(e) =>
                      setNewPassword({ ...newPassword, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newPassword.email}
                    onChange={(e) =>
                      setNewPassword({ ...newPassword, email: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="url">URL</Label>
                  <Input
                    id="url"
                    value={newPassword.url}
                    onChange={(e) =>
                      setNewPassword({ ...newPassword, url: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <div className="flex gap-2">
                  <Select
                      value={newPassword.category_id || ""} 
                      onValueChange={(value) =>
                        setNewPassword({ ...newPassword, category_id: value === "" ? "" : value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShowAddCategory(!showAddCategory)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword.password}
                      onChange={(e) =>
                        setNewPassword({
                          ...newPassword,
                          password: e.target.value
                        })
                      }
                    />
                    <button
                      className="absolute right-2 top-2 text-gray-400"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={generatePassword}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Button onClick={addPassword} disabled={!newPassword.name || !newPassword.password}>
                Save Password
              </Button>
            </div>
          </CardContent>
        </Card>

        {showAddCategory && (
          <Card>
            <CardHeader>
              <CardTitle>Add New Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Category name"
                />
                <Button onClick={addCategory} disabled={!newCategory}>
                  Add Category
                </Button>
                <Button variant="outline" onClick={() => setShowAddCategory(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Stored Passwords</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Search and Filter Controls */}
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search passwords..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <Select
                  value={filterCategory || "all"}  // Changed from empty string to "all"
                  onValueChange={setFilterCategory}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>  {/* Changed from empty string to "all" */}
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Results Counter */}
              <div className="text-sm text-gray-500">
                Showing {filteredPasswords.length} of {passwords.length} passwords
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Password</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPasswords.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.email}</TableCell>
                      <TableCell>
                        {item.url && (
                          <a
                            href={item.url.startsWith('http') ? item.url : `https://${item.url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline"
                          >
                            {item.url}
                          </a>
                        )}
                      </TableCell>
                      <TableCell>{item.category_name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Input
                            type={
                              showPassword === `password-${item.id}`
                                ? 'text'
                                : 'password'
                            }
                            value={item.password}
                            readOnly
                            className="w-[200px]"
                          />
                          <button
                            onClick={() =>
                              setShowPassword(
                                showPassword === `password-${item.id}`
                                  ? null
                                  : `password-${item.id}`
                              )
                            }
                            className="text-gray-400 hover:text-gray-600"
                          >
                            {showPassword === `password-${item.id}` ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(item.password);
                              // Optional: Add a toast notification here
                            }}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            Copy
                          </button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => deletePassword(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredPasswords.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        {passwords.length === 0 ? (
                          <div className="space-y-2">
                            <p>No passwords stored yet</p>
                            <p className="text-sm">Add your first password using the form above</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <p>No passwords match your search</p>
                            <p className="text-sm">Try adjusting your search terms or filters</p>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Logout Button */}
        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={() => handleLogout()}
          >
            Logout
          </Button>
        </div>

        {/* Toast Container - if you want to add notifications */}
        {/* <div className="fixed bottom-4 right-4 z-50">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className="mb-2 rounded-md bg-gray-800 text-white px-4 py-2 shadow-lg"
            >
              {notification.message}
            </div>
          ))}
        </div> */}
      </div>
    </div>
  );
};

export default PasswordManager;