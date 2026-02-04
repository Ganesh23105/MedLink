import React from "react";

export const Sidebar = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'patients', label: 'Patients', icon: '👥' },
    { id: 'requests', label: 'Access Requests', icon: '🔑' },
    { id: 'appointments', label: 'Appointments', icon: '📅' },
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ];

  return (
    <div className="w-64 h-screen bg-white border-r border-gray-200 flex flex-col sticky top-0">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center text-xl">
            🩺
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">MedLink AI</h1>
            <p className="text-xs font-medium text-primary-600 uppercase tracking-wider">Doctor Portal</p>
          </div>
        </div>

        <nav className="space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === item.id
                  ? "bg-primary-50 text-primary-600 shadow-sm"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
              {activeTab === item.id && (
                <div className="ml-auto w-1.5 h-1.5 bg-primary-500 rounded-full"></div>
              )}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-6 border-t border-gray-100">
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-2">System Status</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-success-500 rounded-full"></div>
            <span className="text-xs font-semibold text-gray-700">Blockchain Connected</span>
          </div>
        </div>
      </div>
    </div>
  );
};
