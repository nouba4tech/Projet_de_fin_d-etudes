
import React from 'react';
import { RoomStatus, RoomType, Room } from './types';

export const INITIAL_ROOMS: Room[] = [
  // Étage 1 - Chambres Standard (20 chambres)
  { id: '1', number: '101', type: RoomType.SINGLE, price: 45000, status: RoomStatus.AVAILABLE },
  { id: '2', number: '102', type: RoomType.SINGLE, price: 45000, status: RoomStatus.OCCUPIED },
  { id: '3', number: '103', type: RoomType.DOUBLE, price: 65000, status: RoomStatus.AVAILABLE },
  { id: '4', number: '104', type: RoomType.DOUBLE, price: 65000, status: RoomStatus.CLEANING },
  { id: '5', number: '105', type: RoomType.SINGLE, price: 45000, status: RoomStatus.AVAILABLE },
  { id: '6', number: '106', type: RoomType.DOUBLE, price: 65000, status: RoomStatus.OCCUPIED },
  { id: '7', number: '107', type: RoomType.SINGLE, price: 45000, status: RoomStatus.MAINTENANCE },
  { id: '8', number: '108', type: RoomType.DOUBLE, price: 65000, status: RoomStatus.AVAILABLE },
  { id: '9', number: '109', type: RoomType.SINGLE, price: 45000, status: RoomStatus.AVAILABLE },
  { id: '10', number: '110', type: RoomType.DOUBLE, price: 65000, status: RoomStatus.OCCUPIED },
  { id: '11', number: '111', type: RoomType.SINGLE, price: 45000, status: RoomStatus.CLEANING },
  { id: '12', number: '112', type: RoomType.DOUBLE, price: 65000, status: RoomStatus.AVAILABLE },
  { id: '13', number: '113', type: RoomType.SINGLE, price: 45000, status: RoomStatus.AVAILABLE },
  { id: '14', number: '114', type: RoomType.DOUBLE, price: 65000, status: RoomStatus.OCCUPIED },
  { id: '15', number: '115', type: RoomType.SINGLE, price: 45000, status: RoomStatus.AVAILABLE },
  { id: '16', number: '116', type: RoomType.DOUBLE, price: 65000, status: RoomStatus.CLEANING },
  { id: '17', number: '117', type: RoomType.SINGLE, price: 45000, status: RoomStatus.AVAILABLE },
  { id: '18', number: '118', type: RoomType.DOUBLE, price: 65000, status: RoomStatus.OCCUPIED },
  { id: '19', number: '119', type: RoomType.SINGLE, price: 45000, status: RoomStatus.AVAILABLE },
  { id: '20', number: '120', type: RoomType.DOUBLE, price: 65000, status: RoomStatus.MAINTENANCE },

  // Étage 2 - Chambres Deluxe (20 chambres)
  { id: '21', number: '201', type: RoomType.DELUXE, price: 85000, status: RoomStatus.AVAILABLE },
  { id: '22', number: '202', type: RoomType.DELUXE, price: 85000, status: RoomStatus.OCCUPIED },
  { id: '23', number: '203', type: RoomType.DELUXE, price: 85000, status: RoomStatus.AVAILABLE },
  { id: '24', number: '204', type: RoomType.DELUXE, price: 85000, status: RoomStatus.CLEANING },
  { id: '25', number: '205', type: RoomType.DELUXE, price: 85000, status: RoomStatus.OCCUPIED },
  { id: '26', number: '206', type: RoomType.DELUXE, price: 85000, status: RoomStatus.AVAILABLE },
  { id: '27', number: '207', type: RoomType.DELUXE, price: 85000, status: RoomStatus.MAINTENANCE },
  { id: '28', number: '208', type: RoomType.DELUXE, price: 85000, status: RoomStatus.AVAILABLE },
  { id: '29', number: '209', type: RoomType.DELUXE, price: 85000, status: RoomStatus.OCCUPIED },
  { id: '30', number: '210', type: RoomType.DELUXE, price: 85000, status: RoomStatus.AVAILABLE },
  { id: '31', number: '211', type: RoomType.DELUXE, price: 85000, status: RoomStatus.CLEANING },
  { id: '32', number: '212', type: RoomType.DELUXE, price: 85000, status: RoomStatus.AVAILABLE },
  { id: '33', number: '213', type: RoomType.DELUXE, price: 85000, status: RoomStatus.OCCUPIED },
  { id: '34', number: '214', type: RoomType.DELUXE, price: 85000, status: RoomStatus.AVAILABLE },
  { id: '35', number: '215', type: RoomType.DELUXE, price: 85000, status: RoomStatus.MAINTENANCE },
  { id: '36', number: '216', type: RoomType.DELUXE, price: 85000, status: RoomStatus.AVAILABLE },
  { id: '37', number: '217', type: RoomType.DELUXE, price: 85000, status: RoomStatus.OCCUPIED },
  { id: '38', number: '218', type: RoomType.DELUXE, price: 85000, status: RoomStatus.AVAILABLE },
  { id: '39', number: '219', type: RoomType.DELUXE, price: 85000, status: RoomStatus.CLEANING },
  { id: '40', number: '220', type: RoomType.DELUXE, price: 85000, status: RoomStatus.OCCUPIED },

  // Étage 3 - Suites Junior (20 chambres)
  { id: '41', number: '301', type: RoomType.SUITE, price: 125000, status: RoomStatus.AVAILABLE },
  { id: '42', number: '302', type: RoomType.SUITE, price: 125000, status: RoomStatus.OCCUPIED },
  { id: '43', number: '303', type: RoomType.SUITE, price: 125000, status: RoomStatus.AVAILABLE },
  { id: '44', number: '304', type: RoomType.SUITE, price: 125000, status: RoomStatus.CLEANING },
  { id: '45', number: '305', type: RoomType.SUITE, price: 125000, status: RoomStatus.AVAILABLE },
  { id: '46', number: '306', type: RoomType.SUITE, price: 125000, status: RoomStatus.OCCUPIED },
  { id: '47', number: '307', type: RoomType.SUITE, price: 125000, status: RoomStatus.MAINTENANCE },
  { id: '48', number: '308', type: RoomType.SUITE, price: 125000, status: RoomStatus.AVAILABLE },
  { id: '49', number: '309', type: RoomType.SUITE, price: 125000, status: RoomStatus.OCCUPIED },
  { id: '50', number: '310', type: RoomType.SUITE, price: 125000, status: RoomStatus.AVAILABLE },
  { id: '51', number: '311', type: RoomType.SUITE, price: 125000, status: RoomStatus.CLEANING },
  { id: '52', number: '312', type: RoomType.SUITE, price: 125000, status: RoomStatus.AVAILABLE },
  { id: '53', number: '313', type: RoomType.SUITE, price: 125000, status: RoomStatus.OCCUPIED },
  { id: '54', number: '314', type: RoomType.SUITE, price: 125000, status: RoomStatus.AVAILABLE },
  { id: '55', number: '315', type: RoomType.SUITE, price: 125000, status: RoomStatus.MAINTENANCE },
  { id: '56', number: '316', type: RoomType.SUITE, price: 125000, status: RoomStatus.AVAILABLE },
  { id: '57', number: '317', type: RoomType.SUITE, price: 125000, status: RoomStatus.OCCUPIED },
  { id: '58', number: '318', type: RoomType.SUITE, price: 125000, status: RoomStatus.AVAILABLE },
  { id: '59', number: '319', type: RoomType.SUITE, price: 125000, status: RoomStatus.CLEANING },
  { id: '60', number: '320', type: RoomType.SUITE, price: 125000, status: RoomStatus.OCCUPIED },

  // Étage 4 - Suites Présidentielles (20 chambres)
  { id: '61', number: '401', type: RoomType.SUITE, price: 185000, status: RoomStatus.AVAILABLE },
  { id: '62', number: '402', type: RoomType.SUITE, price: 185000, status: RoomStatus.OCCUPIED },
  { id: '63', number: '403', type: RoomType.SUITE, price: 185000, status: RoomStatus.AVAILABLE },
  { id: '64', number: '404', type: RoomType.SUITE, price: 185000, status: RoomStatus.CLEANING },
  { id: '65', number: '405', type: RoomType.SUITE, price: 185000, status: RoomStatus.MAINTENANCE },
  { id: '66', number: '406', type: RoomType.SUITE, price: 185000, status: RoomStatus.AVAILABLE },
  { id: '67', number: '407', type: RoomType.SUITE, price: 185000, status: RoomStatus.OCCUPIED },
  { id: '68', number: '408', type: RoomType.SUITE, price: 185000, status: RoomStatus.AVAILABLE },
  { id: '69', number: '409', type: RoomType.SUITE, price: 185000, status: RoomStatus.CLEANING },
  { id: '70', number: '410', type: RoomType.SUITE, price: 185000, status: RoomStatus.AVAILABLE },
  { id: '71', number: '411', type: RoomType.SUITE, price: 185000, status: RoomStatus.OCCUPIED },
  { id: '72', number: '412', type: RoomType.SUITE, price: 185000, status: RoomStatus.AVAILABLE },
  { id: '73', number: '413', type: RoomType.SUITE, price: 185000, status: RoomStatus.MAINTENANCE },
  { id: '74', number: '414', type: RoomType.SUITE, price: 185000, status: RoomStatus.AVAILABLE },
  { id: '75', number: '415', type: RoomType.SUITE, price: 185000, status: RoomStatus.OCCUPIED },
  { id: '76', number: '416', type: RoomType.SUITE, price: 185000, status: RoomStatus.AVAILABLE },
  { id: '77', number: '417', type: RoomType.SUITE, price: 185000, status: RoomStatus.CLEANING },
  { id: '78', number: '418', type: RoomType.SUITE, price: 185000, status: RoomStatus.AVAILABLE },
  { id: '79', number: '419', type: RoomType.SUITE, price: 185000, status: RoomStatus.OCCUPIED },
  { id: '80', number: '420', type: RoomType.SUITE, price: 185000, status: RoomStatus.MAINTENANCE },

  // Étage 5 - Suites Executive et Penthouses (20 chambres)
  { id: '81', number: '501', type: RoomType.SUITE, price: 250000, status: RoomStatus.AVAILABLE },
  { id: '82', number: '502', type: RoomType.SUITE, price: 250000, status: RoomStatus.OCCUPIED },
  { id: '83', number: '503', type: RoomType.SUITE, price: 250000, status: RoomStatus.AVAILABLE },
  { id: '84', number: '504', type: RoomType.SUITE, price: 250000, status: RoomStatus.CLEANING },
  { id: '85', number: '505', type: RoomType.SUITE, price: 250000, status: RoomStatus.AVAILABLE },
  { id: '86', number: '506', type: RoomType.SUITE, price: 250000, status: RoomStatus.MAINTENANCE },
  { id: '87', number: '507', type: RoomType.SUITE, price: 250000, status: RoomStatus.AVAILABLE },
  { id: '88', number: '508', type: RoomType.SUITE, price: 250000, status: RoomStatus.OCCUPIED },
  { id: '89', number: '509', type: RoomType.SUITE, price: 250000, status: RoomStatus.AVAILABLE },
  { id: '90', number: '510', type: RoomType.SUITE, price: 250000, status: RoomStatus.CLEANING },
  { id: '91', number: '511', type: RoomType.SUITE, price: 350000, status: RoomStatus.AVAILABLE },
  { id: '92', number: '512', type: RoomType.SUITE, price: 350000, status: RoomStatus.OCCUPIED },
  { id: '93', number: '513', type: RoomType.SUITE, price: 350000, status: RoomStatus.AVAILABLE },
  { id: '94', number: '514', type: RoomType.SUITE, price: 350000, status: RoomStatus.MAINTENANCE },
  { id: '95', number: '515', type: RoomType.SUITE, price: 350000, status: RoomStatus.AVAILABLE },
  { id: '96', number: '516', type: RoomType.SUITE, price: 350000, status: RoomStatus.OCCUPIED },
  { id: '97', number: '517', type: RoomType.SUITE, price: 350000, status: RoomStatus.AVAILABLE },
  { id: '98', number: '518', type: RoomType.SUITE, price: 350000, status: RoomStatus.CLEANING },
  { id: '99', number: '519', type: RoomType.SUITE, price: 350000, status: RoomStatus.AVAILABLE },
  { id: '100', number: '520', type: RoomType.SUITE, price: 500000, status: RoomStatus.OCCUPIED }
];

export const ICONS = {
  Dashboard: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  Bookings: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  Guests: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  Rooms: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3" />
    </svg>
  ),
  Employees: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  Services: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  ),
  Finances: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Restaurant: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  Stock: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  AI: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  Bar: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 2h-3L4 11l7 7L22 7l-4-5zM11 18v3m4-3v3m-8-3v3M5 11l7 7" />
    </svg>
  ),
  Reports: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 3h6l5 5v11a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 3v5h5" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-6 4h6" />
    </svg>
  ),
  Settings: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.25 4.205a1.5 1.5 0 011.5 0l1.057.61a1.5 1.5 0 001.5 0l.63-.364a1.5 1.5 0 012.121 1.342v.727a1.5 1.5 0 00.75 1.3l.63.364a1.5 1.5 0 010 2.598l-.63.364a1.5 1.5 0 00-.75 1.3v.727a1.5 1.5 0 01-2.121 1.342l-.63-.364a1.5 1.5 0 00-1.5 0l-1.057.61a1.5 1.5 0 01-1.5 0l-1.057-.61a1.5 1.5 0 00-1.5 0l-.63.364A1.5 1.5 0 014 15.842v-.727a1.5 1.5 0 00-.75-1.3l-.63-.364a1.5 1.5 0 010-2.598l.63-.364A1.5 1.5 0 004 9.189v-.727a1.5 1.5 0 012.121-1.342l.63.364a1.5 1.5 0 001.5 0l1.057-.61z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9.75a2.25 2.25 0 110 4.5 2.25 2.25 0 010-4.5z" />
    </svg>
  ),
  Security: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7l8-4z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4" />
    </svg>
  ),
  Reception: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 20h16M6 20v-7a2 2 0 012-2h8a2 2 0 012 2v7M9 10V7a3 3 0 016 0v3" />
    </svg>
  ),
  MainCourante: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 4.5h9a1.5 1.5 0 011.5 1.5v13.5H9a2 2 0 01-2-2V6a1.5 1.5 0 011.5-1.5H9zm0 0V3m0 1.5v15M12.5 9h5m-5 3.5h5m-5 3.5h3" />
    </svg>
  ),
  Accounting: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V7m0 1v8m0 0v1m0-1h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  CashWorkflow: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.25 8.25h19.5M2.25 8.25v10.5A1.5 1.5 0 003.75 20.25h16.5a1.5 1.5 0 001.5-1.5V8.25M2.25 8.25l1.5-3.75a1.5 1.5 0 011.393-.75h13.714a1.5 1.5 0 011.393.75l1.5 3.75M12 12.75a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z" />
    </svg>
  ),
  Economat: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7h18M6 7V5a1 1 0 011-1h10a1 1 0 011 1v2m-1 0v11a2 2 0 01-2 2H8a2 2 0 01-2-2V7m4 4h4m-4 4h7" />
    </svg>
  )
};
