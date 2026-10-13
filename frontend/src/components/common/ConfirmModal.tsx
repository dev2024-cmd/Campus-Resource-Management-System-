import React from "react";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: "danger" | "primary";
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = "Delete Record",
  cancelText = "Cancel",
  confirmVariant = "danger",
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-xs p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div
              className={`p-3 rounded-full shrink-0 ${
                confirmVariant === "danger" ? "bg-rose-100 text-rose-600" : "bg-violet-100 text-violet-600"
              }`}
            >
              <AlertTriangle size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-800 leading-tight">{title}</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">{message}</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 rounded-lg text-sm font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50 ${
              confirmVariant === "danger"
                ? "bg-rose-200 hover:bg-rose-300 text-rose-900"
                : "bg-violet-200 hover:bg-violet-300 text-violet-900"
            }`}
          >
            {isLoading ? "Processing..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
