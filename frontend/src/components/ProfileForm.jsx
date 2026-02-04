import React from "react";
import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export const ProfileForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    specialization: '',
    experience: '',
    location: '',
    fee: '',
    nextAvailable: '',
    email: '',
    phone: '',
    bio: '',
    education: '',
    certifications: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const { user } = useContext(AuthContext);

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Authentication token not found. Please log in.");
        return;
      }

      if (!user || !user._id) {
        alert("User information not available. Please log in again.");
        return;
      }

      const requestData = {
        ...formData,
        userId: user._id
      };

      const response = await fetch("http://localhost:5000/api/doctors/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(requestData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      alert("Profile updated successfully!");
      console.log("Server response:", data);
    } catch (error) {
      console.error("Error submitting profile:", error);
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <div>
      <h3>Doctor Profile Information</h3>
      <div>
        <div>
          <div>
            <label>Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter your full name"
            />
          </div>
          
          <div>
            <label>Specialization</label>
            <select
              name="specialization"
              value={formData.specialization}
              onChange={handleInputChange}
            >
              <option value="">Select specialization</option>
              <option value="cardiology">Cardiology</option>
              <option value="neurology">Neurology</option>
              <option value="orthopedics">Orthopedics</option>
              <option value="pediatrics">Pediatrics</option>
              <option value="dermatology">Dermatology</option>
              <option value="psychiatry">Psychiatry</option>
              <option value="general">General Medicine</option>
            </select>
          </div>

          <div>
            <label>Experience (Years)</label>
            <input
              type="number"
              name="experience"
              value={formData.experience}
              onChange={handleInputChange}
              placeholder="Years of experience"
            />
          </div>

          <div>
            <label>Location</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="City, Country"
            />
          </div>

          <div>
            <label>Consultation Fee ($)</label>
            <input
              type="number"
              name="fee"
              value={formData.fee}
              onChange={handleInputChange}
              placeholder="Consultation fee"
            />
          </div>

          <div>
            <label>Next Available</label>
            <input
              type="datetime-local"
              name="nextAvailable"
              value={formData.nextAvailable}
              onChange={handleInputChange}
            />
          </div>

          <div>
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="your.email@example.com"
            />
          </div>

          <div>
            <label>Phone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="+1 (555) 123-4567"
            />
          </div>
        </div>

        <div>
          <label>Bio</label>
          <textarea
            name="bio"
            value={formData.bio}
            onChange={handleInputChange}
            rows={4}
            placeholder="Tell us about yourself, your approach to medicine, and your interests..."
          />
        </div>

        <div>
          <label>Education</label>
          <textarea
            name="education"
            value={formData.education}
            onChange={handleInputChange}
            rows={3}
            placeholder="Medical school, residency, fellowships..."
          />
        </div>

        <div>
          <label>Certifications</label>
          <textarea
            name="certifications"
            value={formData.certifications}
            onChange={handleInputChange}
            rows={3}
            placeholder="Board certifications, licenses, special qualifications..."
          />
        </div>

        <div>
          <button type="button">Cancel</button>
          <button type="button" onClick={handleSubmit}>
            Update Profile
          </button>
        </div>
      </div>
    </div>
  );
};