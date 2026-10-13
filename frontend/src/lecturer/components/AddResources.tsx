import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface AddResourceProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const RESOURCE_CATEGORIES = [
  "Seminar Hall",
  "Auditorium",
  "Computer Lab",
  "Conference Room",
  "Lecture Hall",
  "Smart Classroom",
  "Library Discussion Room",
  "Science & Engineering Lab",
];

export const TIME_SLOTS = [
  "08:30 AM - 10:30 AM",
  "10:30 AM - 12:30 PM",
  "12:30 PM - 02:30 PM",
  "02:30 PM - 04:30 PM",
  "04:30 PM - 06:30 PM",
];

const AddResourcePopup: React.FC<AddResourceProps> = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    category: "",
    name: "",
    reservationDate: "",
    reservationTime: "",
    description: "",
  });

  const handleOnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/api/resources", formData);
      toast.success("Resource booked successfully!");
      setFormData({
        category: "",
        name: "",
        reservationDate: "",
        reservationTime: "",
        description: "",
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      toast.error("Failed to add resource. Please try again.");
      console.error("Error adding resource:", error);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
      <div className="bg-white w-full max-w-lg p-6 rounded-xl shadow-2xl">
        <div className="flex justify-between items-center border-b pb-3">
          <h2 className="text-xl font-bold text-gray-800">Book Campus Resource / Place</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleOnSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Resource Category (Place)
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              >
                <option value="">Select Place / Venue</option>
                {RESOURCE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Resource Name / Title
              </label>
              <input
                type="text"
                name="name"
                placeholder="e.g. Main Hall A, Lab 3"
                value={formData.name}
                onChange={handleChange}
                className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Reservation Date
              </label>
              <input
                type="date"
                name="reservationDate"
                value={formData.reservationDate}
                onChange={handleChange}
                className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Reservation Time Slot
              </label>
              <select
                name="reservationTime"
                value={formData.reservationTime}
                onChange={handleChange}
                className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              >
                <option value="">Select Time Slot</option>
                {TIME_SLOTS.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Description / Purpose of Booking
            </label>
            <textarea
              name="description"
              placeholder="e.g. Semester Exam, Robotics Workshop, Guest Lecture"
              value={formData.description}
              onChange={handleChange}
              className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none h-24"
              required
            />
          </div>

          <div className="flex justify-end space-x-3 pt-2 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium shadow"
            >
              Confirm Booking
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddResourcePopup;
