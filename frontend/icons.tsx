import React from 'react';
import { FaSave, FaRecycle, FaTrash, FaPlus, FaEdit, FaTimes, FaEye, FaPrint, FaEnvelope, FaCheck } from 'react-icons/fa';

export const ICONS_MAP = {
  save: FaSave,
  restore: FaRecycle,
  delete: FaTrash,
  add: FaPlus,
  edit: FaEdit,
  close: FaTimes,
  view: FaEye,
  print: FaPrint,
  email: FaEnvelope,
  validate: FaCheck,
} as const;

export type IconKey = keyof typeof ICONS_MAP;

export const Icon: React.FC<{ name: IconKey; className?: string }> = ({ name, className }) => {
  const C = ICONS_MAP[name];
  return <C className={className ?? 'w-4 h-4'} />;
};

export default ICONS_MAP;
