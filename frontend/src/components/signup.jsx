import React, { useState } from "react";
import axios from "axios";
import Navbar from "./Navbar.jsx";
import { useNavigate, Link } from "react-router-dom";
import { User, Mail, Lock, Eye, EyeOff, ChevronRight, ChevronLeft, CheckCircle, Shield } from 'lucide-react';

const SignUpForm = ({ onSuccess }) => {
  const [form, setForm] = useState({
    name: "",
    usertype: "",
    gender: "",
    email: "",
    password: "",
    walletAddress:""
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1);
  const navigate = useNavigate(); 

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!window.ethereum) {
      alert("Please install Metamask!");
      return setLoading(false);
    }

    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      const wallet = accounts[0];

      const res = await axios.post("http://localhost:5000/api/auth/signup", {
        ...form,
        walletAddress: wallet,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      if (onSuccess){
        onSuccess(res.data.user);
      } 

      navigate("/login");
    } catch (err) {
      console.error("Signup error:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 1 && form.name && form.usertype && form.gender) {
      setStep(2);
    }
  };

  const prevStep = () => {
    setStep(1);
  };

  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    },
    wrapper: {
      flexGrow: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    },
    card: {
      maxWidth: '900px',
      width: '100%',
      backgroundColor: '#ffffff',
      borderRadius: '2rem',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'row',
      border: '1px solid #f1f5f9'
    },
    sidebar: {
      width: '35%',
      background: 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)',
      padding: '3rem 2rem',
      color: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between'
    },
    main: {
      width: '65%',
      padding: '3rem'
    },
    input: {
      width: '100%',
      padding: '0.875rem 1rem',
      backgroundColor: '#f8fafc',
      border: '1px solid #e2e8f0',
      borderRadius: '0.75rem',
      fontSize: '1rem',
      outline: 'none',
      boxSizing: 'border-box'
    },
    button: {
      padding: '1rem 1.5rem',
      borderRadius: '0.75rem',
      fontWeight: '700',
      cursor: 'pointer',
      border: 'none',
      transition: 'all 0.2s'
    }
  };

  return (
    <div style={styles.container}>
      <Navbar/>
      
      <div style={styles.wrapper}>
        <div style={styles.card}>
          {/* Sidebar */}
          <div style={styles.sidebar}>
            <div>
              <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.5rem'
              }}>
                <CheckCircle size={24} color="white" />
              </div>
              <h1 style={{ color: 'white', fontSize: '2rem', fontWeight: '800', marginBottom: '1rem' }}>Join MedLink</h1>
              <p style={{ color: '#dbeafe', lineHeight: '1.6' }}>Create your account and connect your wallet to access the future of healthcare.</p>
            </div>

            <div style={{ marginTop: '3rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: step === 1 ? '#ffffff' : 'rgba(255, 255, 255, 0.2)',
                  color: step === 1 ? '#1d4ed8' : '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '800'
                }}>1</div>
                <span style={{ fontWeight: step === 1 ? '700' : '400' }}>Personal Info</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: step === 2 ? '#ffffff' : 'rgba(255, 255, 255, 0.2)',
                  color: step === 2 ? '#1d4ed8' : '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '800'
                }}>2</div>
                <span style={{ fontWeight: step === 2 ? '700' : '400' }}>Account & Wallet</span>
              </div>
            </div>

            <div style={{ marginTop: 'auto', paddingTop: '2rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <p style={{ fontSize: '0.875rem', color: '#dbeafe' }}>Already have an account?</p>
              <Link to="/login" style={{ color: '#ffffff', fontWeight: '700', textDecoration: 'none', display: 'block', marginTop: '0.5rem' }}>Sign In Here</Link>
            </div>
          </div>

          {/* Main Content */}
          <div style={styles.main}>
            {error && (
              <div style={{
                padding: '1rem',
                backgroundColor: '#fef2f2',
                color: '#dc2626',
                borderRadius: '0.75rem',
                marginBottom: '2rem',
                fontSize: '0.875rem',
                fontWeight: '600'
              }}>{error}</div>
            )}

            {step === 1 ? (
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.5rem' }}>Personal Information</h2>
                <p style={{ color: '#64748b', marginBottom: '2rem' }}>Tell us about yourself to get started</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '700', marginBottom: '0.5rem' }}>Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      style={styles.input}
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '700', marginBottom: '0.5rem' }}>User Type</label>
                      <select
                        name="usertype"
                        value={form.usertype}
                        onChange={handleChange}
                        style={styles.input}
                      >
                        <option value="">Select Type</option>
                        <option value="Patient">Patient</option>
                        <option value="Doctor">Doctor</option>
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '700', marginBottom: '0.5rem' }}>Gender</label>
                      <select
                        name="gender"
                        value={form.gender}
                        onChange={handleChange}
                        style={styles.input}
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={nextStep}
                    disabled={!form.name || !form.usertype || !form.gender}
                    style={{
                      ...styles.button,
                      backgroundColor: '#2563eb',
                      color: '#ffffff',
                      marginTop: '1rem',
                      opacity: (!form.name || !form.usertype || !form.gender) ? 0.5 : 1
                    }}
                  >
                    Continue to Next Step <ChevronRight size={18} style={{ verticalAlign: 'middle', marginLeft: '0.5rem' }} />
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.5rem' }}>Account & Wallet</h2>
                <p style={{ color: '#64748b', marginBottom: '2rem' }}>Complete your registration details</p>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '700', marginBottom: '0.5rem' }}>Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      style={styles.input}
                      placeholder="name@example.com"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '700', marginBottom: '0.5rem' }}>Password</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        style={styles.input}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <div style={{ padding: '1rem', backgroundColor: '#eff6ff', borderRadius: '0.75rem', border: '1px solid #dbeafe', display: 'flex', gap: '1rem' }}>
                    <Shield size={24} color="#2563eb" />
                    <div>
                      <h4 style={{ fontSize: '0.875rem', fontWeight: '700', color: '#1e40af', margin: 0 }}>Wallet Connection</h4>
                      <p style={{ fontSize: '0.75rem', color: '#1e40af', marginTop: '0.25rem' }}>Your MetaMask wallet will be connected to secure your data on the blockchain.</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <button
                      type="button"
                      onClick={prevStep}
                      style={{ ...styles.button, backgroundColor: '#f1f5f9', color: '#475569', flex: 1 }}
                    >
                      <ChevronLeft size={18} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} /> Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      style={{ ...styles.button, backgroundColor: '#2563eb', color: '#ffffff', flex: 2, opacity: loading ? 0.7 : 1 }}
                    >
                      {loading ? "Registering..." : "Sign Up with Wallet"}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUpForm;
