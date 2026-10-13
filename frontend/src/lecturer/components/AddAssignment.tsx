import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface AddAssignmentProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const AddAssignmentPopup: React.FC<AddAssignmentProps> = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    assignmentName: "",
    courseName: "",
    moduleDate: "",
    dueDate: "",
    description: "",
  });

  const handleOnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/api/assignment", formData);
      toast.success("Assignment created successfully!");
      setFormData({
        assignmentName: "",
        courseName: "",
        moduleDate: "",
        dueDate: "",
        description: "",
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      toast.error("Failed to add assignment. Please try again.");
      console.error("Error adding assignment:", error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
      <div className="bg-white w-full max-w-lg p-6 rounded-xl shadow-2xl">
        <div className="flex justify-between items-center border-b pb-3">
          <h2 className="text-xl font-bold text-gray-800">Create New Assignment</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none">&times;</button>
        </div>

        <form onSubmit={handleOnSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Assignment Title</label>
              <input
                type="text"
                name="assignmentName"
                placeholder="e.g. DBMS Mini Project"
                value={formData.assignmentName}
                onChange={handleChange}
                className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Course / Department</label>
              <select
                name="courseName"
                value={formData.courseName}
                onChange={handleChange}
                className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              >
                <option value="">Select Course</option>
                <option value="CS">Computer Science (CS)</option>
                <option value="IT">Information Technology (IT)</option>
                <option value="SE">Software Engineering (SE)</option>
                <option value="DS">Data Science & AI</option>
                <option value="KU Topup">KU Topup Degree</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Module / Start Date</label>
              <input
                type="date"
                name="moduleDate"
                value={formData.moduleDate}
                onChange={handleChange}
                className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Submission Due Date</label>
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Assignment Instructions / Description</label>
            <textarea
              name="description"
              placeholder="Provide instructions, project requirements, evaluation criteria..."
              value={formData.description}
              onChange={handleChange}
              className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none h-24"
              required
            />
          </div>

          <div className="flex justify-end space-x-3 pt-2 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 font-medium">
              Cancel
            </button>
            <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium shadow">
              Publish Assignment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAssignmentPopup;
