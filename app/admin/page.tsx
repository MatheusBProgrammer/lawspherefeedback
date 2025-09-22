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
} from "lucide-react";

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
    if (num >= 6) return "bg-yellow-100 text-yellow-800 border border-yellow-200";
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="flex flex-col items-center text-center mb-8">
          <div className="flex items-center gap-3 mb-3">
            <Scale className="w-9 h-9 text-blue-600" />
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              Admin Dashboard
            </h1>
          </div>
          <p className="text-gray-600 mb-4">
            Manage and visualize user feedback data
          </p>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="text-gray-600 border-gray-300 hover:bg-gray-50"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </header>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 mb-8">
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Responses
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-end justify-between">
              <div className="text-3xl font-bold text-blue-600">
                {stats.total}
              </div>
              <Users className="w-6 h-6 text-gray-400" />
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Average Usefulness
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-end justify-between">
              <div className="text-3xl font-bold text-green-600">
                {stats.avgUsefulness}/10
              </div>
              <BarChart3 className="w-6 h-6 text-gray-400" />
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Average Reliability
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-end justify-between">
              <div className="text-3xl font-bold text-yellow-600">
                {stats.avgReliability}/10
              </div>
              <BarChart3 className="w-6 h-6 text-gray-400" />
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Early Access
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-end justify-between">
              <div className="text-3xl font-bold text-purple-600">
                {stats.earlyAccessCount}
              </div>
              <ShieldCheck className="w-6 h-6 text-gray-400" />
            </CardContent>
          </Card>
        </div>

        {/* Filtros e Ações */}
        <Card className="mb-8 bg-white border border-gray-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-gray-900">Filters & Actions</CardTitle>
            <CardDescription className="text-gray-600">
              Narrow down your results and manage exports
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="relative w-full md:flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by name, email, or firm profile..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
                />
              </div>

              <Select value={firmFilter} onValueChange={setFirmFilter}>
                <SelectTrigger className="min-w-[200px] bg-white border-gray-300 text-gray-900">
                  <SelectValue placeholder="Filter by firm" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200 text-gray-900">
                  <SelectItem value="all">All firms</SelectItem>
                  <SelectItem value="solo">Solo</SelectItem>
                  <SelectItem value="2_10_lawyers">2–10 lawyers</SelectItem>
                  <SelectItem value="11_50_lawyers">11–50 lawyers</SelectItem>
                  <SelectItem value="50_plus_lawyers">50+ lawyers</SelectItem>
                </SelectContent>
              </Select>

              <Button
                onClick={fetchFeedbackData}
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>

              <Button
                onClick={exportToCSV}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabela */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-gray-900">Feedback Data</CardTitle>
                <CardDescription className="text-gray-600">
                  {filteredData.length} records
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12 text-gray-600">
                Loading data...
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-200">
                        <TableHead className="text-gray-700">Name</TableHead>
                        <TableHead className="text-gray-700">Email</TableHead>
                        <TableHead className="text-gray-700">Firm</TableHead>
                        <TableHead className="text-gray-700">Usefulness</TableHead>
                        <TableHead className="text-gray-700">Communication</TableHead>
                        <TableHead className="text-gray-700">Reliability</TableHead>
                        <TableHead className="text-gray-700">Value</TableHead>
                        <TableHead className="text-gray-700">Tools</TableHead>
                        <TableHead className="text-gray-700">Early Access</TableHead>
                        <TableHead className="text-gray-700">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedData.map((item) => (
                        <TableRow key={item.id} className="border-gray-200">
                          <TableCell className="text-gray-900">
                            {item.name || "-"}
                          </TableCell>
                          <TableCell className="text-gray-900">
                            {item.email || "-"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={`rounded-md px-2 py-1 ${getFirmProfileColor(
                                item.firm_profile
                              )}`}
                            >
                              {item.firm_profile
                                ? item.firm_profile.replaceAll("_", " ")
                                : "-"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={`rounded-md px-2 py-1 ${getRatingColor(
                                item.overall_usefulness
                              )}`}
                            >
                              {item.overall_usefulness ?? "-"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={`rounded-md px-2 py-1 ${getRatingColor(
                                item.client_communication_impact
                              )}`}
                            >
                              {item.client_communication_impact ?? "-"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={`rounded-md px-2 py-1 ${getRatingColor(
                                item.reliability
                              )}`}
                            >
                              {item.reliability ?? "-"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={`rounded-md px-2 py-1 ${getRatingColor(
                                item.value_perception
                              )}`}
                            >
                              {item.value_perception ?? "-"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-700">
                            {item.next_tools && item.next_tools.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {item.next_tools.slice(0, 2).map((tool, i) => (
                                  <Badge
                                    key={i}
                                    className="rounded-md px-2 py-1 bg-purple-100 text-purple-800 border border-purple-200 text-xs"
                                  >
                                    {tool.replaceAll("_", " ")}
                                  </Badge>
                                ))}
                                {item.next_tools.length > 2 && (
                                  <Badge className="rounded-md px-2 py-1 bg-gray-100 text-gray-800 border border-gray-200 text-xs">
                                    +{item.next_tools.length - 2}
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={`rounded-md px-2 py-1 ${
                                item.early_access_invitation === "yes"
                                  ? "bg-green-100 text-green-800 border border-green-200"
                                  : "bg-red-100 text-red-800 border border-red-200"
                              }`}
                            >
                              {item.early_access_invitation === "yes" ? "Yes" : "No"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-700">
                            {formatDate(item.created_at)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Paginação */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-3 mt-6">
                    <Button
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                      variant="outline"
                      className="border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </Button>
                    <span className="text-gray-700">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                      variant="outline"
                      className="border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
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
    </div>
  );
}
