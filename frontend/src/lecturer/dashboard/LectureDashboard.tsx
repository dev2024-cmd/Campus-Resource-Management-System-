import { useState, useEffect, JSX } from "react";
import { Calendar } from "react-calendar";
import "react-calendar/dist/Calendar.css";
import {
  LayoutDashboard,
  User,
  BookOpen,
  FolderOpen,
  Bell,
  Pencil,
  Eye,
  Trash2,
  Plus,
  X,
  Clock,
  MapPin,
  Calendar as CalendarIcon,
  CheckCircle2,
  LogOut,
  FileText,
  Building,
  RefreshCw,
} from "lucide-react";
import AddAssignmentPopup from "../components/AddAssignment";
import AddResourcePopup, { RESOURCE_CATEGORIES, TIME_SLOTS } from "../components/AddResources";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

// Types
interface MenuItem {
  name: string;
  icon: JSX.Element;
}

interface Assignment {
  _id: string;
  name: string;
  module: string;
  course: string;
  dueDate: string;
  description?: string;
  status: string;
}

interface Resource {
  _id: string;
  category: string;
  name: string;
  reservationDate: string;
  reservationTime: string;
  description?: string;
  status: string;
}

const menuItems: MenuItem[] = [
  { name: "Dashboard", icon: <LayoutDashboard size={18} /> },
  { name: "Resources", icon: <FolderOpen size={18} /> },
  { name: "Assignment", icon: <BookOpen size={18} /> },
];

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onLogout }) => {
  return (
    <aside className="w-64 bg-slate-900 text-white p-5 min-h-screen flex flex-col justify-between shrink-0 shadow-xl">
      <div>
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="p-2 bg-sky-500 rounded-lg">
            <Building className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-lg leading-tight">Smart Campus</h2>
            <span className="text-xs text-sky-400 font-medium">Lecturer Portal</span>
          </div>
        </div>

        <nav className="space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.name}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all text-left
              ${
                activeTab === item.name
                  ? "bg-sky-600 text-white shadow-md shadow-sky-600/30"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
              onClick={() => setActiveTab(item.name)}
            >
              {item.icon}
              <span>{item.name}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="pt-6 border-t border-slate-800">
        <button
          onClick={onLogout}
          className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-colors"
        >
          <LogOut size={18} />
          <span>Log out</span>
        </button>
      </div>
    </aside>
  );
};

interface TopNavbarProps {
  notifications: number;
  onRefresh: () => void;
}

const TopNavbar: React.FC<TopNavbarProps> = ({ notifications, onRefresh }) => {
  return (
    <header className="h-16 bg-white border-b border-gray-200 fixed top-0 right-0 left-64 z-20 flex justify-between items-center px-6">
      <div className="text-sm text-gray-500 font-medium">
        Smart Campus Management System &bull; <span className="text-gray-800">Spring Term 2026</span>
      </div>

      <div className="flex items-center space-x-4">
        <button
          onClick={onRefresh}
          title="Refresh Data"
          className="p-2 text-gray-600 hover:text-sky-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <RefreshCw size={18} />
        </button>

        <div className="relative cursor-pointer p-2 text-gray-600 hover:text-sky-600 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell size={20} />
          {notifications > 0 && (
            <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {notifications}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-3 pl-3 border-l border-gray-200">
          <div className="w-9 h-9 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-sm">
            VL
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-sm font-semibold text-gray-800 leading-tight">Vidusha Lakshan</div>
            <div className="text-xs text-gray-500">Senior Lecturer</div>
          </div>
        </div>
      </div>
    </header>
  );
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState<string>("");
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 5;

  // Modals for adding
  const [isAddAssignmentOpen, setIsAddAssignmentOpen] = useState<boolean>(false);
  const [isAddResourceOpen, setIsAddResourceOpen] = useState<boolean>(false);

  // Modals for View & Edit
  const [viewingResource, setViewingResource] = useState<Resource | null>(null);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [viewingAssignment, setViewingAssignment] = useState<Assignment | null>(null);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);

  // Edit form states
  const [resourceEditForm, setResourceEditForm] = useState({
    category: "",
    name: "",
    reservationDate: "",
    reservationTime: "",
    description: "",
  });

  const [assignmentEditForm, setAssignmentEditForm] = useState({
    assignmentName: "",
    courseName: "",
    moduleDate: "",
    dueDate: "",
    description: "",
  });

  const [date, setDate] = useState<Date>(new Date());
  const [notifications] = useState<number>(3);
  const [activeTab, setActiveTab] = useState<string>("Dashboard");
  const [activeButton, setActiveButton] = useState<string>("Resources");

  const fetchData = async () => {
    try {
      const [assignmentsResponse, resourcesResponse] = await Promise.all([
        axios.get("http://localhost:5000/api/assignment"),
        axios.get("http://localhost:5000/api/resources"),
      ]);

      if (assignmentsResponse.data?.data) {
        setAssignments(
          assignmentsResponse.data.data.map((item: any) => ({
            _id: item._id,
            name: item.assignmentName,
            module: item.moduleDate ? new Date(item.moduleDate).toISOString().split("T")[0] : "",
            course: item.courseName,
            dueDate: item.dueDate,
            description: item.description || "",
            status: "Active",
          }))
        );
      }

      if (resourcesResponse.data?.data) {
        setResources(
          resourcesResponse.data.data.map((item: any) => ({
            _id: item._id,
            category: item.category,
            name: item.name,
            reservationDate: item.reservationDate,
            reservationTime: item.reservationTime,
            description: item.description || "",
            status: "Confirmed",
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Could not load data from backend server.");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    toast.info("Logged out successfully");
    navigate("/login");
  };

  // In-app delete confirmation state
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    type: "resource" | "assignment";
    id: string;
    title: string;
  }>({
    isOpen: false,
    type: "resource",
    id: "",
    title: "",
  });

  const handleConfirmDelete = async () => {
    const { type, id, title } = deleteConfirmation;
    setDeleteConfirmation((prev) => ({ ...prev, isOpen: false }));
    try {
      if (type === "resource") {
        await axios.delete(`http://localhost:5000/api/resources/${id}`);
        toast.success(`"${title}" deleted successfully!`);
        setResources((prev) => prev.filter((r) => r._id !== id));
      } else {
        await axios.delete(`http://localhost:5000/api/assignment/${id}`);
        toast.success(`"${title}" deleted successfully!`);
        setAssignments((prev) => prev.filter((a) => a._id !== id));
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(`Failed to delete ${type}. Please try again.`);
    }
  };

  const handleDeleteResource = (resource: Resource | string) => {
    if (typeof resource === "string") {
      const found = resources.find((r) => r._id === resource);
      setDeleteConfirmation({
        isOpen: true,
        type: "resource",
        id: resource,
        title: found?.name || "Resource",
      });
    } else {
      setDeleteConfirmation({
        isOpen: true,
        type: "resource",
        id: resource._id,
        title: resource.name,
      });
    }
  };

  const handleOpenEditResource = (resource: Resource) => {
    setEditingResource(resource);
    setResourceEditForm({
      category: resource.category,
      name: resource.name,
      reservationDate: resource.reservationDate,
      reservationTime: resource.reservationTime,
      description: resource.description || "",
    });
  };

  const handleSaveResourceEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingResource) return;
    try {
      await axios.put(`http://localhost:5000/api/resources/${editingResource._id}`, resourceEditForm);
      toast.success("Resource updated successfully!");
      setEditingResource(null);
      fetchData();
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Failed to update resource.");
    }
  };

  // ----------------- Actions for Assignments -----------------
  const handleDeleteAssignment = (assignment: Assignment | string) => {
    if (typeof assignment === "string") {
      const found = assignments.find((a) => a._id === assignment);
      setDeleteConfirmation({
        isOpen: true,
        type: "assignment",
        id: assignment,
        title: found?.name || "Assignment",
      });
    } else {
      setDeleteConfirmation({
        isOpen: true,
        type: "assignment",
        id: assignment._id,
        title: assignment.name,
      });
    }
  };

  const handleOpenEditAssignment = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setAssignmentEditForm({
      assignmentName: assignment.name,
      courseName: assignment.course,
      moduleDate: assignment.module,
      dueDate: assignment.dueDate,
      description: assignment.description || "",
    });
  };

  const handleSaveAssignmentEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAssignment) return;
    try {
      await axios.put(`http://localhost:5000/api/assignment/${editingAssignment._id}`, assignmentEditForm);
      toast.success("Assignment updated successfully!");
      setEditingAssignment(null);
      fetchData();
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Failed to update assignment.");
    }
  };

  // Filtered lists
  const filteredAssignments = assignments.filter((a) =>
    a.name.toLowerCase().includes(searchText.toLowerCase()) ||
    a.course.toLowerCase().includes(searchText.toLowerCase())
  );

  const filteredResources = resources.filter((r) =>
    r.name.toLowerCase().includes(searchText.toLowerCase()) ||
    r.category.toLowerCase().includes(searchText.toLowerCase())
  );

  const displayedAssignments = filteredAssignments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const displayedResources = filteredResources.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPagesAssignments = Math.ceil(filteredAssignments.length / itemsPerPage) || 1;
  const totalPagesResources = Math.ceil(filteredResources.length / itemsPerPage) || 1;

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />

      <div className="flex-1 ml-64 flex flex-col">
        <TopNavbar notifications={notifications} onRefresh={fetchData} />

        <main className="p-8 pt-24 max-w-7xl w-full mx-auto flex-1">
          {/* ===================== TAB 1: DASHBOARD ===================== */}
          {activeTab === "Dashboard" && (
            <div className="space-y-8">
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Good Morning, Vidusha</h1>
                  <p className="text-gray-500 mt-1">
                    Welcome to your Smart Campus overview. Manage venues, lectures, and course assignments.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsAddResourceOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
                  >
                    <Plus size={16} />
                    Book Place
                  </button>
                  <button
                    onClick={() => setIsAddAssignmentOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
                  >
                    <Plus size={16} />
                    New Assignment
                  </button>
                </div>
              </div>

              {/* Metric Overview Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-gray-400">Booked Places</div>
                    <div className="text-3xl font-extrabold text-sky-600 mt-1">{resources.length}</div>
                    <div className="text-xs text-gray-500 mt-1">Halls, Labs & Auditoriums</div>
                  </div>
                  <div className="p-3 bg-sky-50 text-sky-600 rounded-xl">
                    <Building size={28} />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Assignments</div>
                    <div className="text-3xl font-extrabold text-indigo-600 mt-1">{assignments.length}</div>
                    <div className="text-xs text-gray-500 mt-1">Published coursework</div>
                  </div>
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                    <BookOpen size={28} />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-gray-400">Upcoming Sessions</div>
                    <div className="text-3xl font-extrabold text-emerald-600 mt-1">{resources.length > 0 ? resources.length : 3}</div>
                    <div className="text-xs text-gray-500 mt-1">Scheduled reservations</div>
                  </div>
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                    <CalendarIcon size={28} />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-gray-400">Status</div>
                    <div className="text-lg font-bold text-emerald-600 mt-2 flex items-center gap-1.5">
                      <CheckCircle2 size={18} /> Online & Synced
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Local MongoDB connected</div>
                  </div>
                  <div className="p-3 bg-gray-50 text-gray-600 rounded-xl">
                    <Clock size={28} />
                  </div>
                </div>
              </div>

              {/* Main Content Grid: Left side category tabs, Right side Calendar */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left 2 Columns: Dynamic Category Content */}
                <div className="lg:col-span-2 space-y-5">
                  {/* Category Buttons */}
                  <div className="flex flex-wrap gap-2 p-1.5 bg-gray-200/70 rounded-xl">
                    {["Resources", "Schedule", "Event", "Announcement"].map((item) => (
                      <button
                        key={item}
                        onClick={() => setActiveButton(item)}
                        className={`flex-1 min-w-[120px] py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
                          activeButton === item
                            ? "bg-white text-gray-900 shadow-sm"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/50"
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>

                  {/* Content for "Resources" */}
                  {activeButton === "Resources" && (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                      <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                        <div>
                          <h2 className="text-base font-bold text-gray-900">Current Reserved Campus Places</h2>
                          <p className="text-xs text-gray-500">Seminar Halls, Auditoriums, Labs and rooms</p>
                        </div>
                        <button
                          onClick={() => setIsAddResourceOpen(true)}
                          className="text-xs font-semibold text-sky-600 hover:text-sky-700 inline-flex items-center gap-1"
                        >
                          <Plus size={14} /> Add Resource
                        </button>
                      </div>

                      {resources.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 space-y-3">
                          <Building className="w-12 h-12 mx-auto text-gray-300" />
                          <p className="text-sm">No campus resources booked yet.</p>
                          <button
                            onClick={() => setIsAddResourceOpen(true)}
                            className="px-4 py-2 bg-sky-600 text-white rounded-lg text-xs font-semibold"
                          >
                            Book First Place
                          </button>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-100">
                          {resources.slice(0, 5).map((r) => (
                            <div key={r._id} className="p-4 hover:bg-gray-50 flex items-center justify-between gap-4 transition-colors">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-gray-800 text-sm">{r.name}</span>
                                  <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-sky-100 text-sky-800">
                                    {r.category}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-500 flex items-center gap-3">
                                  <span className="flex items-center gap-1">
                                    <CalendarIcon size={12} /> {r.reservationDate}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock size={12} /> {r.reservationTime}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center space-x-1 shrink-0">
                                <button
                                  onClick={() => setViewingResource(r)}
                                  className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded"
                                  title="View Details"
                                >
                                  <Eye size={16} />
                                </button>
                                <button
                                  onClick={() => handleOpenEditResource(r)}
                                  className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded"
                                  title="Edit"
                                >
                                  <Pencil size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeleteResource(r)}
                                  className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                                  title="Delete"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Content for "Schedule" */}
                  {activeButton === "Schedule" && (
                    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
                      <h2 className="text-base font-bold text-gray-900">Today's Academic Schedule</h2>
                      <div className="space-y-3">
                        <div className="p-3.5 rounded-lg border border-gray-100 bg-sky-50/50 flex justify-between items-center">
                          <div>
                            <div className="text-sm font-semibold text-gray-900">CS204: Database Systems Lecture</div>
                            <div className="text-xs text-gray-500">09:00 AM - 11:00 AM &bull; Seminar Hall A</div>
                          </div>
                          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-sky-100 text-sky-800">In Progress</span>
                        </div>
                        <div className="p-3.5 rounded-lg border border-gray-100 hover:bg-gray-50 flex justify-between items-center">
                          <div>
                            <div className="text-sm font-semibold text-gray-900">IT301: Full Stack Web Development Lab</div>
                            <div className="text-xs text-gray-500">01:00 PM - 03:00 PM &bull; Computer Lab 1</div>
                          </div>
                          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700">Upcoming</span>
                        </div>
                        <div className="p-3.5 rounded-lg border border-gray-100 hover:bg-gray-50 flex justify-between items-center">
                          <div>
                            <div className="text-sm font-semibold text-gray-900">SE402: Software Engineering Seminar</div>
                            <div className="text-xs text-gray-500">03:30 PM - 05:00 PM &bull; Main Auditorium</div>
                          </div>
                          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700">Scheduled</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Content for "Event" */}
                  {activeButton === "Event" && (
                    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
                      <h2 className="text-base font-bold text-gray-900">Upcoming Campus Events</h2>
                      <div className="space-y-3">
                        <div className="p-4 rounded-lg border border-gray-100 bg-purple-50/40 flex justify-between items-center">
                          <div>
                            <div className="text-sm font-semibold text-purple-950">Annual Hackathon 2026</div>
                            <div className="text-xs text-gray-500 mt-0.5">Venue: Auditorium &bull; Date: Next Friday</div>
                          </div>
                          <span className="px-2 py-0.5 text-xs font-semibold rounded bg-purple-100 text-purple-700">Campus Wide</span>
                        </div>
                        <div className="p-4 rounded-lg border border-gray-100 hover:bg-gray-50 flex justify-between items-center">
                          <div>
                            <div className="text-sm font-semibold text-gray-900">Industry Expert Guest Lecture: Cloud AI</div>
                            <div className="text-xs text-gray-500 mt-0.5">Venue: Seminar Hall &bull; Date: Oct 22, 2026</div>
                          </div>
                          <span className="px-2 py-0.5 text-xs font-semibold rounded bg-gray-100 text-gray-700">Tech Club</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Content for "Announcement" */}
                  {activeButton === "Announcement" && (
                    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
                      <h2 className="text-base font-bold text-gray-900">Campus Announcements</h2>
                      <div className="space-y-3">
                        <div className="p-4 rounded-lg border-l-4 border-l-blue-500 border border-gray-100 bg-white">
                          <div className="font-semibold text-sm text-gray-900">Mid-Term Assignment Submissions Open</div>
                          <p className="text-xs text-gray-600 mt-1">
                            Lecturers can post assignments in the Assignment tab. Students can upload their project files directly.
                          </p>
                          <div className="text-[11px] text-gray-400 mt-2">Posted by Academic Office &bull; 2 hours ago</div>
                        </div>
                        <div className="p-4 rounded-lg border-l-4 border-l-emerald-500 border border-gray-100 bg-white">
                          <div className="font-semibold text-sm text-gray-900">Lab & Hall Reservation System Active</div>
                          <p className="text-xs text-gray-600 mt-1">
                            Auditorium, Seminar Hall, and Computer Labs are open for faculty booking up to 30 days in advance.
                          </p>
                          <div className="text-[11px] text-gray-400 mt-2">Posted by Campus Administrator &bull; Yesterday</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column: Interactive Calendar & Quick Access */}
                <div className="space-y-6">
                  <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
                      <CalendarIcon size={16} className="text-sky-600" />
                      Academic Calendar
                    </h3>
                    <Calendar
                      value={date}
                      onChange={(newDate) => setDate(newDate as Date)}
                      className="border-none w-full"
                    />
                  </div>

                  <div className="bg-gradient-to-br from-sky-900 to-indigo-950 p-5 rounded-xl text-white shadow-lg space-y-3">
                    <h3 className="font-bold text-base">Quick Shortcuts</h3>
                    <p className="text-xs text-sky-200">
                      Instantly jump to coursework or venue management modules.
                    </p>
                    <div className="pt-2 flex flex-col gap-2">
                      <button
                        onClick={() => setActiveTab("Resources")}
                        className="w-full text-left px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-semibold transition-colors flex items-center justify-between"
                      >
                        <span>Manage Campus Places</span>
                        <Building size={14} />
                      </button>
                      <button
                        onClick={() => setActiveTab("Assignment")}
                        className="w-full text-left px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-semibold transition-colors flex items-center justify-between"
                      >
                        <span>Manage Course Assignments</span>
                        <BookOpen size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===================== TAB 2: RESOURCES ===================== */}
          {activeTab === "Resources" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Campus Places & Resources</h1>
                  <p className="text-sm text-gray-500">Book, manage, and view campus halls, labs, and venues</p>
                </div>
                <button
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors cursor-pointer"
                  onClick={() => setIsAddResourceOpen(true)}
                >
                  <Plus size={16} />
                  Book Place / Resource
                </button>
              </div>

              {/* Search bar */}
              <div className="flex gap-2 max-w-md">
                <input
                  type="text"
                  placeholder="Search by venue or place name..."
                  className="p-2.5 px-3.5 border border-gray-300 rounded-lg w-full text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white shadow-sm"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </div>

              {/* Table */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-gray-100/75 border-b border-gray-200 text-xs font-semibold uppercase tracking-wider text-gray-600">
                      <th className="p-3.5 pl-6">Venue Category</th>
                      <th className="p-3.5">Place / Room Name</th>
                      <th className="p-3.5">Reservation Date</th>
                      <th className="p-3.5">Time Slot</th>
                      <th className="p-3.5 pr-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-sm">
                    {displayedResources.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-gray-500">
                          No matching campus resources found. Click "Book Place / Resource" to create one.
                        </td>
                      </tr>
                    ) : (
                      displayedResources.map((resource) => (
                        <tr key={resource._id} className="hover:bg-gray-50/75 transition-colors">
                          <td className="p-3.5 pl-6">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-100 text-sky-800">
                              {resource.category}
                            </span>
                          </td>
                          <td className="p-3.5 font-semibold text-gray-800">{resource.name}</td>
                          <td className="p-3.5 text-gray-600">{resource.reservationDate}</td>
                          <td className="p-3.5 text-gray-600">{resource.reservationTime}</td>
                          <td className="p-3.5 pr-6 text-right">
                            <div className="inline-flex items-center space-x-2">
                              <button
                                onClick={() => setViewingResource(resource)}
                                className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                                title="View Details"
                              >
                                <Eye size={17} />
                              </button>
                              <button
                                onClick={() => handleOpenEditResource(resource)}
                                className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Update Resource"
                              >
                                <Pencil size={17} />
                              </button>
                              <button
                                onClick={() => handleDeleteResource(resource)}
                                className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete Resource"
                              >
                                <Trash2 size={17} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPagesResources > 1 && (
                <div className="flex justify-end items-center gap-1.5">
                  <button
                    className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-md bg-white disabled:opacity-40"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPagesResources }, (_, i) => (
                    <button
                      key={i + 1}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md ${
                        currentPage === i + 1
                          ? "bg-sky-600 text-white"
                          : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                      onClick={() => setCurrentPage(i + 1)}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-md bg-white disabled:opacity-40"
                    disabled={currentPage === totalPagesResources}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ===================== TAB 3: ASSIGNMENT ===================== */}
          {activeTab === "Assignment" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Coursework Assignments</h1>
                  <p className="text-sm text-gray-500">
                    Publish assignment briefs, project requirements, and deadlines for students
                  </p>
                </div>
                <button
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors cursor-pointer"
                  onClick={() => setIsAddAssignmentOpen(true)}
                >
                  <Plus size={16} />
                  Add Assignment
                </button>
              </div>

              {/* Search bar */}
              <div className="flex gap-2 max-w-md">
                <input
                  type="text"
                  placeholder="Search by assignment title or course..."
                  className="p-2.5 px-3.5 border border-gray-300 rounded-lg w-full text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white shadow-sm"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </div>

              {/* Table */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-gray-100/75 border-b border-gray-200 text-xs font-semibold uppercase tracking-wider text-gray-600">
                      <th className="p-3.5 pl-6">Assignment Title</th>
                      <th className="p-3.5">Course / Program</th>
                      <th className="p-3.5">Start Date</th>
                      <th className="p-3.5">Due Date</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 pr-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-sm">
                    {displayedAssignments.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-gray-500">
                          No assignments published yet. Click "Add Assignment" to create one.
                        </td>
                      </tr>
                    ) : (
                      displayedAssignments.map((assignment) => (
                        <tr key={assignment._id} className="hover:bg-gray-50/75 transition-colors">
                          <td className="p-3.5 pl-6 font-semibold text-gray-900">{assignment.name}</td>
                          <td className="p-3.5 text-gray-600">{assignment.course}</td>
                          <td className="p-3.5 text-gray-600">{assignment.module}</td>
                          <td className="p-3.5 text-gray-600 font-medium text-red-600">{assignment.dueDate}</td>
                          <td className="p-3.5">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                              {assignment.status}
                            </span>
                          </td>
                          <td className="p-3.5 pr-6 text-right">
                            <div className="inline-flex items-center space-x-2">
                              <button
                                onClick={() => setViewingAssignment(assignment)}
                                className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                                title="View Details"
                              >
                                <Eye size={17} />
                              </button>
                              <button
                                onClick={() => handleOpenEditAssignment(assignment)}
                                className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit Assignment"
                              >
                                <Pencil size={17} />
                              </button>
                              <button
                                onClick={() => handleDeleteAssignment(assignment)}
                                className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete Assignment"
                              >
                                <Trash2 size={17} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPagesAssignments > 1 && (
                <div className="flex justify-end items-center gap-1.5">
                  <button
                    className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-md bg-white disabled:opacity-40"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPagesAssignments }, (_, i) => (
                    <button
                      key={i + 1}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md ${
                        currentPage === i + 1
                          ? "bg-indigo-600 text-white"
                          : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                      onClick={() => setCurrentPage(i + 1)}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-md bg-white disabled:opacity-40"
                    disabled={currentPage === totalPagesAssignments}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* ===================== POPUPS & MODALS ===================== */}

      {/* 1. Add Resource Popup */}
      <AddResourcePopup
        isOpen={isAddResourceOpen}
        onClose={() => setIsAddResourceOpen(false)}
        onSuccess={fetchData}
      />

      {/* 2. Add Assignment Popup */}
      <AddAssignmentPopup
        isOpen={isAddAssignmentOpen}
        onClose={() => setIsAddAssignmentOpen(false)}
        onSuccess={fetchData}
      />

      {/* 3. View Resource Modal */}
      {viewingResource && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 space-y-5 animate-in fade-in duration-200">
            <div className="flex justify-between items-start border-b pb-3">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-100 text-sky-800">
                  {viewingResource.category}
                </span>
                <h3 className="text-xl font-bold text-gray-900 mt-1">{viewingResource.name}</h3>
              </div>
              <button
                onClick={() => setViewingResource(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-gray-50 rounded-xl space-y-1">
                <div className="text-xs text-gray-400 font-medium">Reservation Date</div>
                <div className="font-semibold text-gray-800 flex items-center gap-1.5">
                  <CalendarIcon size={14} className="text-sky-600" />
                  {viewingResource.reservationDate}
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl space-y-1">
                <div className="text-xs text-gray-400 font-medium">Time Slot</div>
                <div className="font-semibold text-gray-800 flex items-center gap-1.5">
                  <Clock size={14} className="text-sky-600" />
                  {viewingResource.reservationTime}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Description / Purpose</div>
              <div className="p-3.5 bg-gray-50 rounded-xl text-sm text-gray-700 leading-relaxed min-h-[80px]">
                {viewingResource.description || "No specific details provided."}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t">
              <button
                onClick={() => setViewingResource(null)}
                className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-xl text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Edit Resource Modal */}
      {editingResource && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold text-gray-900">Update Campus Resource / Venue</h3>
              <button onClick={() => setEditingResource(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveResourceEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Venue Category</label>
                  <select
                    value={resourceEditForm.category}
                    onChange={(e) => setResourceEditForm({ ...resourceEditForm, category: e.target.value })}
                    className="w-full p-2.5 border rounded-lg text-sm"
                    required
                  >
                    {RESOURCE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Place Name</label>
                  <input
                    type="text"
                    value={resourceEditForm.name}
                    onChange={(e) => setResourceEditForm({ ...resourceEditForm, name: e.target.value })}
                    className="w-full p-2.5 border rounded-lg text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={resourceEditForm.reservationDate}
                    onChange={(e) => setResourceEditForm({ ...resourceEditForm, reservationDate: e.target.value })}
                    className="w-full p-2.5 border rounded-lg text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Time Slot</label>
                  <select
                    value={resourceEditForm.reservationTime}
                    onChange={(e) => setResourceEditForm({ ...resourceEditForm, reservationTime: e.target.value })}
                    className="w-full p-2.5 border rounded-lg text-sm"
                    required
                  >
                    {TIME_SLOTS.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                <textarea
                  value={resourceEditForm.description}
                  onChange={(e) => setResourceEditForm({ ...resourceEditForm, description: e.target.value })}
                  className="w-full p-2.5 border rounded-lg text-sm h-24"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setEditingResource(null)}
                  className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. View Assignment Modal */}
      {viewingAssignment && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 space-y-5 animate-in fade-in duration-200">
            <div className="flex justify-between items-start border-b pb-3">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
                  Course: {viewingAssignment.course}
                </span>
                <h3 className="text-xl font-bold text-gray-900 mt-1">{viewingAssignment.name}</h3>
              </div>
              <button
                onClick={() => setViewingAssignment(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-gray-50 rounded-xl space-y-1">
                <div className="text-xs text-gray-400 font-medium">Start Date</div>
                <div className="font-semibold text-gray-800">{viewingAssignment.module}</div>
              </div>
              <div className="p-3 bg-red-50 rounded-xl space-y-1">
                <div className="text-xs text-red-500 font-medium">Submission Deadline</div>
                <div className="font-semibold text-red-700">{viewingAssignment.dueDate}</div>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Assignment Instructions</div>
              <div className="p-3.5 bg-gray-50 rounded-xl text-sm text-gray-700 leading-relaxed min-h-[80px]">
                {viewingAssignment.description || "No specific instructions provided."}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t">
              <button
                onClick={() => setViewingAssignment(null)}
                className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-xl text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Edit Assignment Modal */}
      {editingAssignment && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold text-gray-900">Update Course Assignment</h3>
              <button onClick={() => setEditingAssignment(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveAssignmentEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={assignmentEditForm.assignmentName}
                    onChange={(e) => setAssignmentEditForm({ ...assignmentEditForm, assignmentName: e.target.value })}
                    className="w-full p-2.5 border rounded-lg text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Course</label>
                  <select
                    value={assignmentEditForm.courseName}
                    onChange={(e) => setAssignmentEditForm({ ...assignmentEditForm, courseName: e.target.value })}
                    className="w-full p-2.5 border rounded-lg text-sm"
                    required
                  >
                    <option value="CS">Computer Science (CS)</option>
                    <option value="IT">Information Technology (IT)</option>
                    <option value="SE">Software Engineering (SE)</option>
                    <option value="DS">Data Science & AI</option>
                    <option value="KU Topup">KU Topup Degree</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={assignmentEditForm.moduleDate}
                    onChange={(e) => setAssignmentEditForm({ ...assignmentEditForm, moduleDate: e.target.value })}
                    className="w-full p-2.5 border rounded-lg text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={assignmentEditForm.dueDate}
                    onChange={(e) => setAssignmentEditForm({ ...assignmentEditForm, dueDate: e.target.value })}
                    className="w-full p-2.5 border rounded-lg text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Instructions / Description</label>
                <textarea
                  value={assignmentEditForm.description}
                  onChange={(e) => setAssignmentEditForm({ ...assignmentEditForm, description: e.target.value })}
                  className="w-full p-2.5 border rounded-lg text-sm h-24"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setEditingAssignment(null)}
                  className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Delete Confirmation Modal */}
      {deleteConfirmation.isOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4 animate-in fade-in duration-200">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold text-gray-900">Confirm Deletion</h3>
              <button
                onClick={() => setDeleteConfirmation((prev) => ({ ...prev, isOpen: false }))}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-gray-600">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-gray-900">"{deleteConfirmation.title}"</span>?
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 pt-3 border-t">
              <button
                type="button"
                onClick={() => setDeleteConfirmation((prev) => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50 text-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold shadow"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
