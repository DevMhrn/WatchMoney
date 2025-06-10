import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, Mail, MailOpen, Clock, Eye } from 'lucide-react';

const AlertCard = ({ alert, onMarkAsRead }) => {
  const [isHovered, setIsHovered] = useState(false);

  const getAlertIcon = () => {
    switch (alert.alert_type) {
      case 'exceeded':
        return <AlertTriangle className="text-red-500" size={20} />;
      case 'warning':
        return <AlertTriangle className="text-yellow-500" size={20} />;
      case 'info':
        return <CheckCircle className="text-blue-500" size={20} />;
      default:
        return <AlertTriangle className="text-gray-500" size={20} />;
    }
  };

  const getAlertBorderColor = () => {
    switch (alert.alert_type) {
      case 'exceeded':
        return 'border-l-red-500';
      case 'warning':
        return 'border-l-yellow-500';
      case 'info':
        return 'border-l-blue-500';
      default:
        return 'border-l-gray-500';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  const getAlertTypeLabel = () => {
    switch (alert.alert_type) {
      case 'exceeded':
        return 'Budget Exceeded';
      case 'warning':
        return 'Budget Warning';
      case 'info':
        return 'Information';
      default:
        return 'Alert';
    }
  };

  return (
    <div 
      className={`relative bg-white dark:bg-gray-700 rounded-lg shadow-md border-l-4 ${getAlertBorderColor()} ${!alert.is_read ? 'ring-2 ring-blue-200 dark:ring-blue-800' : ''} overflow-hidden`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main Card Content */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <div className="flex-shrink-0 mt-1">
              {getAlertIcon()}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h4 className={`text-sm font-semibold ${!alert.is_read ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                  {getAlertTypeLabel()}
                </h4>
                {!alert.is_read && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    New
                  </span>
                )}
              </div>
              <p className={`text-sm ${!alert.is_read ? 'text-gray-800 dark:text-gray-200' : 'text-gray-600 dark:text-gray-400'}`}>
                {alert.message}
              </p>
              <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center">
                  <Clock size={12} className="mr-1" />
                  {formatDate(alert.created_at)}
                </div>
                <div className="flex items-center">
                  {alert.email_sent ? (
                    <>
                      <MailOpen size={12} className="mr-1 text-green-500" />
                      Email Sent
                    </>
                  ) : (
                    <>
                      <Mail size={12} className="mr-1 text-gray-400" />
                      No Email
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Glassmorphism Overlay for Unread Alerts - 70% Coverage from Right */}
      {!alert.is_read && (
        <>
          {/* Enhanced Glassmorphism Gradient Overlay with Sky Blue Tint - 70% from right side */}
          <div 
            className={`absolute top-0 bottom-0 right-0 w-[70%] transition-all duration-300 ${
              isHovered ? 'opacity-98' : 'opacity-90'
            }`}
            style={{
              background: isHovered 
                ? 'linear-gradient(to left, rgba(59, 130, 246, 0.40) 0%, rgba(96, 165, 250, 0.30) 20%, rgba(147, 197, 253, 0.25) 40%, rgba(255, 255, 255, 0.65) 70%, rgba(255, 255, 255, 0.25) 100%)'
                : 'linear-gradient(to left, rgba(135, 206, 235, 0.25) 0%, rgba(173, 216, 230, 0.20) 20%, rgba(255, 255, 255, 0.75) 40%, rgba(255, 255, 255, 0.60) 70%, rgba(255, 255, 255, 0.20) 100%)',
              backdropFilter: isHovered 
                ? 'blur(20px) saturate(240%) brightness(1.18) contrast(1.18) hue-rotate(20deg)'
                : 'blur(30px) saturate(180%) brightness(1.05) contrast(1.05) hue-rotate(10deg)',
              WebkitBackdropFilter: isHovered 
                ? 'blur(20px) saturate(240%) brightness(1.18) contrast(1.18) hue-rotate(20deg)'
                : 'blur(30px) saturate(180%) brightness(1.05) contrast(1.05) hue-rotate(10deg)',
              borderLeft: isHovered 
                ? '1px solid rgba(59, 130, 246, 0.5)'
                : '1px solid rgba(135, 206, 235, 0.3)',
              boxShadow: isHovered
                ? 'inset 0 1px 0 rgba(147, 197, 253, 0.4), inset 0 -1px 0 rgba(59, 130, 246, 0.15), 0 0 30px rgba(59, 130, 246, 0.2)'
                : 'inset 0 1px 0 rgba(135, 206, 235, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.05), 0 0 20px rgba(135, 206, 235, 0.1)',
            }}
          />
          
          {/* Centered Mark as Read Button with Enhanced Glassmorphism - No Changes */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <button
              onClick={() => onMarkAsRead(alert.id)}
              className={`
                px-5 py-3 
                rounded-xl 
                shadow-2xl 
                flex items-center space-x-3 
                text-sm font-semibold 
                text-gray-900 dark:text-white 
                transition-all duration-300 
                transform pointer-events-auto
                ${isHovered ? 'scale-105 shadow-3xl' : 'scale-100'}
              `}
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.92) 0%, rgba(240, 248, 255, 0.88) 50%, rgba(255, 255, 255, 0.90) 100%)',
                backdropFilter: 'blur(35px) saturate(200%) brightness(1.15) contrast(1.1) hue-rotate(5deg)',
                WebkitBackdropFilter: 'blur(35px) saturate(200%) brightness(1.15) contrast(1.1) hue-rotate(5deg)',
                border: '1px solid rgba(135, 206, 235, 0.3)',
                boxShadow: `0 20px 25px -5px rgba(135, 206, 235, 0.15), 
                           0 10px 10px -5px rgba(135, 206, 235, 0.08), 
                           inset 0 1px 2px rgba(255, 255, 255, 0.2),
                           inset 0 -1px 2px rgba(135, 206, 235, 0.1),
                           0 0 0 1px rgba(135, 206, 235, 0.1),
                           0 0 20px rgba(135, 206, 235, 0.08)`,
              }}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <Eye size={18} className="text-sky-600 dark:text-sky-400" />
              <span>Mark as Read</span>
            </button>
          </div>

          {/* Enhanced Pulsing Indicator with Blue Glow on Hover */}
          <div className="absolute top-3 right-3 z-10">
            <div className="relative">
              <div 
                className="w-3 h-3 bg-red-500 rounded-full animate-pulse"
                style={{
                  boxShadow: isHovered
                    ? '0 0 0 0 rgba(239, 68, 68, 0.7), 0 2px 8px rgba(239, 68, 68, 0.3), 0 0 25px rgba(59, 130, 246, 0.4)'
                    : '0 0 0 0 rgba(239, 68, 68, 0.7), 0 2px 8px rgba(239, 68, 68, 0.3), 0 0 15px rgba(135, 206, 235, 0.2)',
                  animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite, glow 2s ease-in-out infinite alternate'
                }}
              ></div>
              <div 
                className="absolute top-0 left-0 w-3 h-3 bg-red-500 rounded-full animate-ping opacity-75"
                style={{
                  backdropFilter: isHovered ? 'blur(2px) hue-rotate(35deg)' : 'blur(4px) hue-rotate(20deg)',
                  WebkitBackdropFilter: isHovered ? 'blur(2px) hue-rotate(35deg)' : 'blur(4px) hue-rotate(20deg)',
                }}
              ></div>
            </div>
          </div>
        </>
      )}

      {/* Read State Indicator */}
      {alert.is_read && (
        <div className="absolute top-2 right-2">
          <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
            <CheckCircle size={14} className="text-green-600 dark:text-green-400" />
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertCard;
