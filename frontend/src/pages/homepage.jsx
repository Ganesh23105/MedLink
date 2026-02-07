import { useState, useContext, useEffect } from "react";
import { CTASection, FeaturesGrid, Footer, HeroSection, StatsSection } from "../components/homepagecompo";
import Navbar from "../components/Navbar";
import { AuthContext } from "../context/AuthContext";
import MedLinkChatbot from "../components/chatbot";
import React from "react";

function Homepage(){
  const [userType, setUserType] = useState('patient');
  const { user } = useContext(AuthContext);
  
  useEffect(() => {
    if (user && user.usertype) {
      setUserType(user.usertype.toLowerCase());
    }
  }, [user]);

  return (
    <div>
      <div className="relative z-[100]"><Navbar /></div>
      <MedLinkChatbot/>
      <HeroSection userType={userType} />
      <FeaturesGrid userType={userType} />
      <StatsSection userType={userType} />
      <CTASection userType={userType} />
      <Footer />
    </div>
  );
}

export default Homepage;