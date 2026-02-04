import React, { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.jsx";
import axios from "axios";
import Navbar from "./Navbar.jsx";
import { Mail, Lock, Eye, EyeOff, AlertCircle, UserCircle } from 'lucide-react';

const SignInForm = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const { login } = useContext(AuthContext);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const res = await axios.post("http://localhost:5000/api/auth/signin", form);
      localStorage.setItem("token", res.data.token);
      login(res.data.user);
      navigate("/");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <Navbar />
      
      <div style={{
        flexGrow: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem'
      }}>
        <div style={{
          maxWidth: '450px',
          width: '100%',
          backgroundColor: '#ffffff',
          borderRadius: '1.5rem',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          overflow: 'hidden',
          border: '1px solid #f1f5f9'
        }}>
          {/* Header Section */}
          <div style={{
            padding: '2.5rem 2rem',
            textAlign: 'center',
            background: 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)',
            color: '#ffffff'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem auto'
            }}>
              <UserCircle size={48} color="white" />
            </div>
            <h1 style={{
              fontSize: '1.875rem',
              fontWeight: '800',
              margin: '0',
              letterSpacing: '-0.025em'
            }}>Welcome Back</h1>
            <p style={{
              fontSize: '1rem',
              color: '#dbeafe',
              marginTop: '0.5rem',
              fontWeight: '500'
            }}>Sign in to your MedLink AI account</p>
          </div>

          {/* Form Section */}
          <div style={{ padding: '2.5rem' }}>
            {error && (
              <div style={{
                marginBottom: '1.5rem',
                padding: '1rem',
                backgroundColor: '#fef2f2',
                border: '1px solid #fee2e2',
                color: '#dc2626',
                borderRadius: '1rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Email Field */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '700',
                  color: '#334155',
                  marginBottom: '0.5rem',
                  marginLeft: '0.25rem'
                }}>Email Address</label>
                <div style={{ position: 'relative' }}>
                  <div style={{
                    position: 'absolute',
                    left: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94a3b8'
                  }}>
                    <Mail size={20} />
                  </div>
                  <input
                    type="email"
                    name="email"
                    required
                    value={form.email}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '1rem 1rem 1rem 3rem',
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '1rem',
                      fontSize: '1rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.5rem',
                  marginLeft: '0.25rem'
                }}>
                  <label style={{
                    fontSize: '0.875rem',
                    fontWeight: '700',
                    color: '#334155',
                    margin: 0
                  }}>Password</label>
                  <a href="#" style={{
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    color: '#2563eb',
                    textDecoration: 'none'
                  }}>Forgot password?</a>
                </div>
                <div style={{ position: 'relative' }}>
                  <div style={{
                    position: 'absolute',
                    left: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94a3b8'
                  }}>
                    <Lock size={20} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    required
                    value={form.password}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '1rem 1rem 1rem 3rem',
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '1rem',
                      fontSize: '1rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '1rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      padding: '0.25rem'
                    }}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                fontSize: '0.875rem',
                marginBottom: '1.5rem'
              }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: '#64748b',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}>
                  <input type="checkbox" style={{ width: '1.25rem', height: '1.25rem' }} />
                  Remember me
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '1rem',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '1rem',
                  fontSize: '1.125rem',
                  fontWeight: '700',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.2)',
                  opacity: isLoading ? 0.7 : 1,
                  transition: 'all 0.2s'
                }}
              >
                {isLoading ? "Authenticating..." : "Sign In to MedLink"}
              </button>
            </form>

            {/* Footer */}
            <div style={{
              marginTop: '2rem',
              paddingTop: '1.5rem',
              borderTop: '1px solid #f1f5f9',
              textAlign: 'center',
              color: '#64748b',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}>
              Don't have an account?{" "}
              <Link to="/register" style={{
                color: '#2563eb',
                fontWeight: '700',
                textDecoration: 'none'
              }}>
                Create an account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignInForm;
