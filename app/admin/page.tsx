"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Download,
  Search,
  RefreshCw,
  Scale,
  BarChart3,
  Users,
  ShieldCheck,
  LogOut,
  X,
  Eye,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface FeedbackResponse {
  id: string;
  email: string;
  name: string;
  overall_usefulness: string | number | null;
  client_communication_impact: string | number | null;
  reliability: string | number | null;
  value_perception: string | number | null;
  next_tools: string[];
  firm_profile: string;
  early_access_invitation: string;
  created_at: string;
  updated_at: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  referrer: string | null;
  landing_page: string | null;
}

export default function AdminPage() {
  const [feedbackData, setFeedbackData] = useState<FeedbackResponse[]>([]);
  const [filteredData, setFilteredData] = useState<FeedbackResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [firmFilter, setFirmFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [stats, setStats] = useState({
    total: 0,
    avgUsefulness: 0,
    avgReliability: 0,
    earlyAccessCount: 0,
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<FeedbackResponse | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchFeedbackData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  useEffect(() => {
    filterData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedbackData, searchTerm, firmFilter]);

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/admin/login");
      if (response.ok) {
        setIsAuthenticated(true);
      } else {
        router.push("/admin/login");
      }
    } catch (error) {
      console.error("Error checking authentication:", error);
      router.push("/admin/login");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/login", { method: "DELETE" });
      router.push("/admin/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const openUserModal = (user: FeedbackResponse) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const closeUserModal = () => {
    setSelectedUser(null);
    setIsModalOpen(false);
  };

  const fetchFeedbackData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("feedback_responses")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching data:", error);
        return;
      }

      setFeedbackData(data || []);
      calculateStats(data || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: FeedbackResponse[]) => {
    const total = data.length;
    if (total === 0) {
      setStats({
        total: 0,
        avgUsefulness: 0,
        avgReliability: 0,
        earlyAccessCount: 0,
      });
      return;
    }

    const avgUsefulness =
      data.reduce(
        (sum, item) => sum + extractRating(item.overall_usefulness),
        0
      ) / total;

    const avgReliability =
      data.reduce((sum, item) => sum + extractRating(item.reliability), 0) /
      total;

    const earlyAccessCount = data.filter(
      (item) => item.early_access_invitation === "yes"
    ).length;

    setStats({
      total,
      avgUsefulness: Math.round(avgUsefulness * 10) / 10,
      avgReliability: Math.round(avgReliability * 10) / 10,
      earlyAccessCount,
    });
  };

  // Extrai número de strings como "10 yes_noticeably" ou aceita number direto
  const extractRating = (
    ratingValue: string | number | null | undefined
  ): number => {
    if (ratingValue == null) return 0;
    if (typeof ratingValue === "number") return ratingValue;

    const match = String(ratingValue).match(/^(\d+)/);
    if (match) {
      const num = parseInt(match[1]);
      return isNaN(num) ? 0 : num;
    }
    return 0;
  };

  const filterData = () => {
    let filtered = feedbackData;

    // Busca por nome, email ou perfil
    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          (item.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.firm_profile || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    // Filtro de firma
    if (firmFilter !== "all") {
      filtered = filtered.filter((item) => item.firm_profile === firmFilter);
    }

    setFilteredData(filtered);
    setCurrentPage(1);
  };

  const exportToCSV = () => {
    const headers = [
      "ID",
      "Email",
      "Name",
      "Overall Usefulness",
      "Client Communication Impact",
      "Reliability",
      "Value Perception",
      "Next Tools",
      "Firm Profile",
      "Early Access Invitation",
      "Created At",
      "UTM Source",
      "UTM Medium",
      "UTM Campaign",
      "UTM Term",
      "UTM Content",
      "Referrer",
      "Landing Page",
    ];

    const csvContent = [
      headers.join(","),
      ...filteredData.map((item) =>
        [
          item.id,
          item.email,
          `"${item.name || ""}"`,
          `"${item.overall_usefulness ?? ""}"`,
          `"${item.client_communication_impact ?? ""}"`,
          `"${item.reliability ?? ""}"`,
          `"${item.value_perception ?? ""}"`,
          `"${(item.next_tools || []).join("; ")}"`,
          item.firm_profile || "",
          item.early_access_invitation || "",
          item.created_at || "",
          item.utm_source || "",
          item.utm_medium || "",
          item.utm_campaign || "",
          item.utm_term || "",
          item.utm_content || "",
          item.referrer || "",
          item.landing_page || "",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `feedback_responses_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Cores de badges de rating
  const getRatingColor = (rating: string | number | null | undefined) => {
    const num = extractRating(rating);
    if (num >= 8) return "bg-green-100 text-green-800 border border-green-200";
    if (num >= 6)
      return "bg-yellow-100 text-yellow-800 border border-yellow-200";
    return "bg-red-100 text-red-800 border border-red-200";
  };

  // Cores de badges para firm profile
  const getFirmProfileColor = (profile: string | null | undefined) => {
    switch (profile) {
      case "solo":
        return "bg-blue-100 text-blue-800 border border-blue-200";
      case "2_10_lawyers":
        return "bg-purple-100 text-purple-800 border border-purple-200";
      case "11_50_lawyers":
        return "bg-orange-100 text-orange-800 border border-orange-200";
      case "50_plus_lawyers":
        return "bg-rose-100 text-rose-800 border border-rose-200";
      default:
        return "bg-gray-100 text-gray-800 border border-gray-200";
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "-";
    }
  };

  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Modern User Details Modal Component
  const UserDetailsModal = () => {
    if (!selectedUser) return null;

    return (
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-xl border border-white/30 shadow-2xl">
          <DialogHeader className="pb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                Feedback Details - {selectedUser.name}
              </DialogTitle>
            </div>
            <DialogDescription className="text-slate-600 text-base">
              Complete user information and feedback analysis
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-8">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  Name
                </label>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
                  <p className="text-slate-900 font-medium">
                    {selectedUser.name || "-"}
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                  Email
                </label>
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-4 rounded-xl border border-indigo-100">
                  <p className="text-slate-900 font-medium break-all">
                    {selectedUser.email || "-"}
                  </p>
                </div>
              </div>
            </div>

            {/* Modern Ratings */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  Ratings
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Overall Usefulness
                  </label>
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-100">
                    <Badge
                      className={`rounded-xl px-3 py-1.5 text-sm font-semibold shadow-sm ${getRatingColor(
                        selectedUser.overall_usefulness
                      )}`}
                    >
                      {selectedUser.overall_usefulness ?? "-"}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    Communication Impact
                  </label>
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
                    <Badge
                      className={`rounded-xl px-3 py-1.5 text-sm font-semibold shadow-sm ${getRatingColor(
                        selectedUser.client_communication_impact
                      )}`}
                    >
                      {selectedUser.client_communication_impact ?? "-"}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                    Reliability
                  </label>
                  <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-4 rounded-xl border border-purple-100">
                    <Badge
                      className={`rounded-xl px-3 py-1.5 text-sm font-semibold shadow-sm ${getRatingColor(
                        selectedUser.reliability
                      )}`}
                    >
                      {selectedUser.reliability ?? "-"}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Firm Profile and Value Perception */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Firm Type
                </label>
                <div className="bg-gray-50 p-3 rounded-md">
                  <Badge
                    className={`${getFirmProfileColor(
                      selectedUser.firm_profile
                    )}`}
                  >
                    {selectedUser.firm_profile
                      ? selectedUser.firm_profile.replaceAll("_", " ")
                      : "-"}
                  </Badge>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Value Perception
                </label>
                <div className="bg-gray-50 p-3 rounded-md">
                  <Badge
                    className={`${getRatingColor(
                      selectedUser.value_perception
                    )}`}
                  >
                    {selectedUser.value_perception ?? "-"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Tools of Interest */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Tools of Interest
              </label>
              <div className="bg-gray-50 p-3 rounded-md">
                {selectedUser.next_tools &&
                selectedUser.next_tools.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedUser.next_tools.map((tool, i) => (
                      <Badge
                        key={i}
                        className="bg-purple-100 text-purple-800 border border-purple-200"
                      >
                        {tool.replaceAll("_", " ")}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <span className="text-gray-500">-</span>
                )}
              </div>
            </div>

            {/* Early Access */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Early Access
              </label>
              <div className="bg-gray-50 p-3 rounded-md">
                <Badge
                  className={`${getRatingColor(
                    selectedUser.early_access_invitation
                  )}`}
                >
                  {selectedUser.early_access_invitation ?? "-"}
                </Badge>
              </div>
            </div>

            {/* Submission Date */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Submission Date
              </label>
              <div className="bg-gray-50 p-3 rounded-md">
                <span className="text-gray-900">
                  {selectedUser.created_at
                    ? new Date(selectedUser.created_at).toLocaleString("en-US")
                    : "-"}
                </span>
              </div>
            </div>

            {/* UTM Parameters */}
            {(selectedUser.utm_source ||
              selectedUser.utm_medium ||
              selectedUser.utm_campaign) && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  UTM Parameters
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedUser.utm_source && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        UTM Source
                      </label>
                      <p className="text-gray-900 bg-gray-50 p-3 rounded-md">
                        {selectedUser.utm_source}
                      </p>
                    </div>
                  )}
                  {selectedUser.utm_medium && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        UTM Medium
                      </label>
                      <p className="text-gray-900 bg-gray-50 p-3 rounded-md">
                        {selectedUser.utm_medium}
                      </p>
                    </div>
                  )}
                  {selectedUser.utm_campaign && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        UTM Campaign
                      </label>
                      <p className="text-gray-900 bg-gray-50 p-3 rounded-md">
                        {selectedUser.utm_campaign}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-400/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute top-1/2 right-1/3 w-64 h-64 bg-purple-400/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "4s" }}
        ></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        {/* Modern Header */}
        <header className="text-center mb-12">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full blur-2xl opacity-20 scale-150"></div>
            <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/30 max-w-4xl mx-auto">
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Scale className="w-7 h-7 text-white" />
                </div>
                <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                  Admin Dashboard
                </h1>
              </div>
              <p className="text-lg text-slate-600 mb-6 max-w-2xl mx-auto">
                Manage and visualize user feedback data with modern analytics
              </p>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="bg-white/60 backdrop-blur-sm border-2 border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-700 px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </header>

        {/* Modern Stats */}
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4 mb-12">
          <Card className="bg-white/80 backdrop-blur-xl border border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50"></div>
            <CardHeader className="pb-3 relative z-10">
              <CardTitle className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Total Responses
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-end justify-between relative z-10">
              <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {stats.total}
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-xl border border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-emerald-50/50"></div>
            <CardHeader className="pb-3 relative z-10">
              <CardTitle className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Average Usefulness
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-end justify-between relative z-10">
              <div className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                {stats.avgUsefulness}/10
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-xl border border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 to-orange-50/50"></div>
            <CardHeader className="pb-3 relative z-10">
              <CardTitle className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                Average Reliability
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-end justify-between relative z-10">
              <div className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                {stats.avgReliability}/10
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-xl border border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-violet-50/50"></div>
            <CardHeader className="pb-3 relative z-10">
              <CardTitle className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                Early Access
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-end justify-between relative z-10">
              <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                {stats.earlyAccessCount}
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-violet-500 rounded-xl flex items-center justify-center shadow-lg">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Modern Filters & Actions */}
        <Card className="mb-12 bg-white/80 backdrop-blur-xl border border-white/30 shadow-xl">
          <CardHeader className="pb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
                <Search className="w-4 h-4 text-white" />
              </div>
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                Filters & Actions
              </CardTitle>
            </div>
            <CardDescription className="text-slate-600 text-base">
              Narrow down your results and manage exports with modern tools
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 md:flex-row md:items-end">
              <div className="relative w-full md:flex-1">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    placeholder="Search by name, email, or firm profile..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 h-12 bg-white/80 backdrop-blur-sm border-2 border-slate-200 text-slate-900 placeholder:text-slate-500 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200"
                  />
                </div>
              </div>

              <Select value={firmFilter} onValueChange={setFirmFilter}>
                <SelectTrigger className="min-w-[220px] h-12 bg-white/80 backdrop-blur-sm border-2 border-slate-200 text-slate-900 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200">
                  <SelectValue placeholder="Filter by firm type" />
                </SelectTrigger>
                <SelectContent className="bg-white/95 backdrop-blur-xl border border-slate-200 text-slate-900 rounded-xl shadow-xl">
                  <SelectItem value="all" className="rounded-lg">
                    All firms
                  </SelectItem>
                  <SelectItem value="solo" className="rounded-lg">
                    Solo Practice
                  </SelectItem>
                  <SelectItem value="2_10_lawyers" className="rounded-lg">
                    Small Firm (2–10 lawyers)
                  </SelectItem>
                  <SelectItem value="11_50_lawyers" className="rounded-lg">
                    Medium Firm (11–50 lawyers)
                  </SelectItem>
                  <SelectItem value="50_plus_lawyers" className="rounded-lg">
                    Large Firm (50+ lawyers)
                  </SelectItem>
                </SelectContent>
              </Select>

              <Button
                onClick={fetchFeedbackData}
                variant="outline"
                className="h-12 bg-white/80 backdrop-blur-sm border-2 border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-700 px-6 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>

              <Button
                onClick={exportToCSV}
                className="h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Modern Data Table */}
        <Card className="bg-white/80 backdrop-blur-xl border border-white/30 shadow-xl">
          <CardHeader className="pb-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                    Feedback Data
                  </CardTitle>
                </div>
                <CardDescription className="text-slate-600 text-base">
                  <span className="font-semibold text-emerald-600">
                    {filteredData.length}
                  </span>{" "}
                  records found
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center gap-3 text-slate-600">
                  <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                  <span className="text-lg font-medium">Loading data...</span>
                </div>
              </div>
            ) : (
              <>
                {/* Modern Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-200 bg-slate-50/50">
                        <TableHead className="text-slate-700 font-semibold py-4">
                          Name
                        </TableHead>
                        <TableHead className="text-slate-700 font-semibold py-4">
                          Email
                        </TableHead>
                        <TableHead className="text-slate-700 font-semibold py-4">
                          Firm
                        </TableHead>
                        <TableHead className="text-slate-700 font-semibold py-4">
                          Usefulness
                        </TableHead>
                        <TableHead className="text-slate-700 font-semibold py-4">
                          Communication
                        </TableHead>
                        <TableHead className="text-slate-700 font-semibold py-4">
                          Reliability
                        </TableHead>
                        <TableHead className="text-slate-700 font-semibold py-4">
                          Value
                        </TableHead>
                        <TableHead className="text-slate-700 font-semibold py-4">
                          Tools
                        </TableHead>
                        <TableHead className="text-slate-700 font-semibold py-4">
                          Early Access
                        </TableHead>
                        <TableHead className="text-slate-700 font-semibold py-4">
                          Date
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedData.map((item, index) => (
                        <TableRow
                          key={item.id}
                          className="border-slate-200 hover:bg-slate-50/50 transition-all duration-200 cursor-pointer group"
                          onClick={() => openUserModal(item)}
                        >
                          <TableCell className="text-slate-900 font-medium py-4 group-hover:text-slate-700">
                            {item.name || "-"}
                          </TableCell>
                          <TableCell className="text-slate-900 py-4 group-hover:text-slate-700">
                            {item.email || "-"}
                          </TableCell>
                          <TableCell className="py-4">
                            <Badge
                              className={`rounded-xl px-3 py-1.5 text-xs font-semibold shadow-sm ${getFirmProfileColor(
                                item.firm_profile
                              )}`}
                            >
                              {item.firm_profile
                                ? item.firm_profile.replaceAll("_", " ")
                                : "-"}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-4">
                            <Badge
                              className={`rounded-xl px-3 py-1.5 text-xs font-semibold shadow-sm ${getRatingColor(
                                item.overall_usefulness
                              )}`}
                            >
                              {item.overall_usefulness ?? "-"}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-4">
                            <Badge
                              className={`rounded-xl px-3 py-1.5 text-xs font-semibold shadow-sm ${getRatingColor(
                                item.client_communication_impact
                              )}`}
                            >
                              {item.client_communication_impact ?? "-"}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-4">
                            <Badge
                              className={`rounded-xl px-3 py-1.5 text-xs font-semibold shadow-sm ${getRatingColor(
                                item.reliability
                              )}`}
                            >
                              {item.reliability ?? "-"}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-4">
                            <Badge
                              className={`rounded-xl px-3 py-1.5 text-xs font-semibold shadow-sm ${getRatingColor(
                                item.value_perception
                              )}`}
                            >
                              {item.value_perception ?? "-"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-700 py-4">
                            {item.next_tools && item.next_tools.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {item.next_tools.slice(0, 2).map((tool, i) => (
                                  <Badge
                                    key={i}
                                    className="rounded-xl px-2 py-1 bg-gradient-to-r from-purple-100 to-violet-100 text-purple-800 border border-purple-200 text-xs font-semibold shadow-sm"
                                  >
                                    {tool.replaceAll("_", " ")}
                                  </Badge>
                                ))}
                                {item.next_tools.length > 2 && (
                                  <Badge className="rounded-xl px-2 py-1 bg-gradient-to-r from-slate-100 to-gray-100 text-slate-800 border border-slate-200 text-xs font-semibold shadow-sm">
                                    +{item.next_tools.length - 2}
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-500">-</span>
                            )}
                          </TableCell>
                          <TableCell className="py-4">
                            <Badge
                              className={`rounded-xl px-3 py-1.5 text-xs font-semibold shadow-sm ${
                                item.early_access_invitation === "yes"
                                  ? "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200"
                                  : "bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border border-red-200"
                              }`}
                            >
                              {item.early_access_invitation === "yes"
                                ? "Yes"
                                : "No"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-700 py-4 group-hover:text-slate-600">
                            {formatDate(item.created_at)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Modern Mobile List View */}
                <div className="md:hidden space-y-4">
                  {paginatedData.map((item, index) => (
                    <div
                      key={item.id}
                      onClick={() => openUserModal(item)}
                      className="bg-white/80 backdrop-blur-sm border border-white/40 rounded-2xl p-6 cursor-pointer hover:bg-white/90 hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] overflow-hidden shadow-md"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-slate-900 text-lg truncate">
                            {item.name || "Name not provided"}
                          </h3>
                          <p className="text-sm text-slate-600 mt-1 truncate">
                            {item.email || "Email not provided"}
                          </p>
                          <div className="flex items-center gap-2 mt-3 flex-wrap">
                            <Badge
                              className={`rounded-xl px-3 py-1.5 text-xs font-semibold shadow-sm ${getFirmProfileColor(
                                item.firm_profile
                              )}`}
                            >
                              {item.firm_profile
                                ? item.firm_profile.replaceAll("_", " ")
                                : "Type not provided"}
                            </Badge>
                            <Badge
                              className={`rounded-xl px-3 py-1.5 text-xs font-semibold shadow-sm ${
                                item.early_access_invitation === "yes"
                                  ? "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200"
                                  : "bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border border-red-200"
                              }`}
                            >
                              {item.early_access_invitation === "yes"
                                ? "Early Access"
                                : "No"}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center text-slate-400 ml-2 flex-shrink-0">
                          <Eye className="w-6 h-6" />
                        </div>
                      </div>
                      <div className="mt-4 text-xs text-slate-500 flex items-center gap-2">
                        <span>📅</span>
                        <span>Submitted: {formatDate(item.created_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Modern Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-4 mt-8">
                    <Button
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                      variant="outline"
                      className="bg-white/80 backdrop-blur-sm border-2 border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-700 px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-xl px-4 py-3 shadow-lg">
                      <span className="text-slate-700 font-semibold">
                        Page {currentPage} of {totalPages}
                      </span>
                    </div>
                    <Button
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                      variant="outline"
                      className="bg-white/80 backdrop-blur-sm border-2 border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-700 px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* User Details Modal */}
      <UserDetailsModal />
    </div>
  );
}
