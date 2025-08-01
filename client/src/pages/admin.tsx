import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Calendar, User, MessageSquare, Search, Filter, Image, ExternalLink, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import type { Inquiry, Advertisement, Business, Franchise } from "@shared/schema";

export default function Admin() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  // No authentication required - admin page is open access

  const { data: inquiries = [], isLoading: inquiriesLoading } = useQuery<Inquiry[]>({
    queryKey: ['/api/inquiries'],
  });

  const { data: advertisements = [], isLoading: adsLoading, refetch: refetchAds } = useQuery<Advertisement[]>({
    queryKey: ['/api/admin/advertisements'],
  });

  const { data: businesses = [], isLoading: businessesLoading, refetch: refetchBusinesses } = useQuery<Business[]>({
    queryKey: ['/api/admin/businesses'],
  });

  const { data: franchises = [], isLoading: franchisesLoading, refetch: refetchFranchises } = useQuery<Franchise[]>({
    queryKey: ['/api/admin/franchises'],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await fetch(`/api/inquiries/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to update status');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Status Updated",
        description: "Inquiry status has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/inquiries'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update inquiry status.",
        variant: "destructive",
      });
    },
  });

  const updateAdStatusMutation = useMutation({
    mutationFn: async ({ id, status, isActive }: { id: number; status: string; isActive: boolean }) => {
      const response = await fetch(`/api/advertisements/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, isActive }),
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to update advertisement status');
      return response.json();
    },
    onSuccess: () => {
      refetchAds();
      toast({
        title: "Advertisement Updated",
        description: "Advertisement status has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update advertisement status.",
        variant: "destructive",
      });
    },
  });

  const updateBusinessStatusMutation = useMutation({
    mutationFn: async ({ id, status, isActive }: { id: number; status: string; isActive: boolean }) => {
      const response = await fetch(`/api/businesses/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, isActive }),
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to update business status');
      return response.json();
    },
    onSuccess: () => {
      refetchBusinesses();
      toast({
        title: "Business Updated",
        description: "Business status has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update business status.",
        variant: "destructive",
      });
    },
  });

  const updateFranchiseStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const response = await fetch(`/api/franchises/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive }),
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to update franchise status');
      return response.json();
    },
    onSuccess: () => {
      refetchFranchises();
      toast({
        title: "Franchise Updated",
        description: "Franchise status has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update franchise status.",
        variant: "destructive",
      });
    },
  });

  const filteredInquiries = inquiries.filter(inquiry => {
    const matchesSearch = inquiry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         inquiry.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         inquiry.subject.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || inquiry.status === statusFilter;
    
    const matchesType = typeFilter === "all" || 
                       (typeFilter === "franchise" && inquiry.franchiseId) ||
                       (typeFilter === "business" && inquiry.businessId) ||
                       (typeFilter === "general" && !inquiry.franchiseId && !inquiry.businessId);
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getInquiryType = (inquiry: Inquiry) => {
    if (inquiry.franchiseId) return "Franchise";
    if (inquiry.businessId) return "Business";
    return "General";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "replied": return "bg-green-100 text-green-800";
      case "closed": return "bg-gray-100 text-gray-800";
      default: return "bg-blue-100 text-blue-800";
    }
  };

  // No authentication checks - open access admin page

  if (inquiriesLoading || adsLoading || businessesLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading dashboard...</div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage business inquiries and customer messages</p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search name, email, or subject..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="replied">Replied</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Type</label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="franchise">Franchise</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-8 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-[hsl(var(--b2b-blue))]">{inquiries.length}</div>
              <div className="text-sm text-gray-600">Total Inquiries</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-600">
                {inquiries.filter(i => i.status === "pending").length}
              </div>
              <div className="text-sm text-gray-600">Pending Inquiries</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-[hsl(var(--b2b-orange))]">{advertisements.length}</div>
              <div className="text-sm text-gray-600">Total Ads</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">
                {advertisements.filter(ad => ad.isActive).length}
              </div>
              <div className="text-sm text-gray-600">Active Ads</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-600">{businesses.length}</div>
              <div className="text-sm text-gray-600">Total Businesses</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">
                {businesses.filter(b => b.isActive).length}
              </div>
              <div className="text-sm text-gray-600">Active Businesses</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-indigo-600">{franchises.length}</div>
              <div className="text-sm text-gray-600">Total Franchises</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-cyan-600">
                {franchises.filter(f => f.isActive).length}
              </div>
              <div className="text-sm text-gray-600">Active Franchises</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Inquiries, Advertisements, Businesses, and Franchises */}
        <Tabs defaultValue="inquiries" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="inquiries">Business Inquiries</TabsTrigger>
            <TabsTrigger value="advertisements">Submitted Ads</TabsTrigger>
            <TabsTrigger value="businesses">Business Listings</TabsTrigger>
            <TabsTrigger value="franchises">Franchise Opportunities</TabsTrigger>
          </TabsList>

          <TabsContent value="inquiries" className="space-y-4">
            {filteredInquiries.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No inquiries found</h3>
                <p className="text-gray-500">No inquiries match your current filters.</p>
              </CardContent>
            </Card>
          ) : (
            filteredInquiries.map((inquiry) => (
              <Card key={inquiry.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{inquiry.subject}</CardTitle>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {inquiry.name}
                        </div>
                        <div className="flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          {inquiry.email}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(inquiry.createdAt!).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getStatusColor(inquiry.status || "pending")}>
                        {inquiry.status || "pending"}
                      </Badge>
                      <Badge variant="outline">
                        {getInquiryType(inquiry)}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <p className="text-gray-700 whitespace-pre-wrap">{inquiry.message}</p>
                  </div>
                  
                  {inquiry.phone && (
                    <div className="text-sm text-gray-600 mb-2">
                      <strong>Phone:</strong> {inquiry.phone}
                    </div>
                  )}
                  
                  {(inquiry.franchiseId || inquiry.businessId) && (
                    <div className="text-sm text-gray-600 mb-4">
                      <strong>Reference ID:</strong> {inquiry.franchiseId ? `Franchise #${inquiry.franchiseId}` : `Business #${inquiry.businessId}`}
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      className="bg-[hsl(var(--b2b-blue))] hover:bg-[hsl(var(--b2b-blue-dark))]"
                      onClick={() => window.open(`mailto:${inquiry.email}?subject=Re: ${inquiry.subject}`)}
                    >
                      Reply via Email
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => updateStatusMutation.mutate({ id: inquiry.id, status: 'replied' })}
                      disabled={updateStatusMutation.isPending}
                    >
                      Mark as Replied
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => updateStatusMutation.mutate({ id: inquiry.id, status: 'closed' })}
                      disabled={updateStatusMutation.isPending}
                    >
                      Mark as Closed
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
          </TabsContent>

          <TabsContent value="advertisements" className="space-y-4">
            {advertisements.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Image className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No advertisements found</h3>
                  <p className="text-gray-500">No ads have been submitted yet.</p>
                </CardContent>
              </Card>
            ) : (
              advertisements.map((ad) => (
                <Card key={ad.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{ad.title}</CardTitle>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(ad.createdAt!).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={ad.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                          {ad.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {ad.imageUrl && (
                      <div className="mb-4">
                        <img 
                          src={ad.imageUrl} 
                          alt={ad.title}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                      </div>
                    )}
                    
                    <div className="space-y-4">
                      {ad.targetUrl && (
                        <div className="text-sm text-gray-600">
                          <strong>Target URL:</strong>{" "}
                          <a 
                            href={ad.targetUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[hsl(var(--b2b-blue))] hover:underline inline-flex items-center gap-1"
                          >
                            {ad.targetUrl} <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                      
                      {(ad as any).package && (
                        <div className="text-sm text-gray-600">
                          <strong>Package:</strong> {(ad as any).package} 
                          {(ad as any).package === 'basic' && ' ($100/month)'}
                          {(ad as any).package === 'premium' && ' ($250/month)'}
                          {(ad as any).package === 'enterprise' && ' ($500/month)'}
                        </div>
                      )}
                      
                      {(ad as any).company && (
                        <div className="text-sm text-gray-600">
                          <strong>Company:</strong> {(ad as any).company}
                        </div>
                      )}
                      
                      {(ad as any).contactEmail && (
                        <div className="text-sm text-gray-600">
                          <strong>Contact:</strong> {(ad as any).contactEmail}
                        </div>
                      )}
                      
                      {(ad as any).description && (
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <strong className="text-sm text-gray-800">Description:</strong>
                          <p className="text-sm text-gray-600 mt-1">{(ad as any).description}</p>
                        </div>
                      )}

                      {/* Status and Payment Information */}
                      <div className="bg-blue-50 p-3 rounded-lg space-y-2">
                        <div className="flex items-center gap-2">
                          <strong className="text-sm text-gray-800">Status:</strong>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            (ad as any).status === 'active' ? 'bg-green-100 text-green-800' :
                            (ad as any).status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {(ad as any).status || 'pending'}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <strong className="text-sm text-gray-800">Payment:</strong>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            (ad as any).paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {(ad as any).paymentStatus || 'unpaid'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <strong className="text-sm text-gray-800">Active:</strong>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            ad.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {ad.isActive ? 'Yes' : 'No'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 flex-wrap">
                        <Button 
                          size="sm" 
                          className="bg-[hsl(var(--b2b-blue))] hover:bg-[hsl(var(--b2b-blue-dark))]"
                          onClick={() => window.open(ad.targetUrl || '#', '_blank')}
                          disabled={!ad.targetUrl}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Preview
                        </Button>
                        
                        {!ad.isActive && (
                          <Button 
                            size="sm" 
                            className="text-xs bg-green-600 hover:bg-green-700"
                            onClick={() => updateAdStatusMutation.mutate({ 
                              id: ad.id, 
                              status: 'active', 
                              isActive: true 
                            })}
                            disabled={updateAdStatusMutation.isPending}
                          >
                            Activate
                          </Button>
                        )}
                        
                        {ad.isActive && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-xs border-red-300 text-red-600 hover:bg-red-50"
                            onClick={() => updateAdStatusMutation.mutate({ 
                              id: ad.id, 
                              status: 'inactive', 
                              isActive: false 
                            })}
                            disabled={updateAdStatusMutation.isPending}
                          >
                            Deactivate
                          </Button>
                        )}
                        
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-xs"
                          onClick={() => updateAdStatusMutation.mutate({ 
                            id: ad.id, 
                            status: 'pending', 
                            isActive: false 
                          })}
                          disabled={updateAdStatusMutation.isPending}
                        >
                          Set Pending
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="businesses" className="space-y-4">
            {businessesLoading ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                  <p className="text-gray-600">Loading business listings...</p>
                </CardContent>
              </Card>
            ) : businesses.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No business listings found</h3>
                  <p className="text-gray-500">No business listings have been submitted yet.</p>
                </CardContent>
              </Card>
            ) : (
              businesses.map((business) => (
                <Card key={business.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg font-semibold text-gray-800">
                          {business.name}
                        </CardTitle>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {business.contactEmail}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {business.createdAt ? new Date(business.createdAt as string | Date).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge 
                          variant={
                            business.status === 'active' ? 'default' : 
                            business.status === 'pending' ? 'secondary' : 
                            'destructive'
                          }
                          className={
                            business.status === 'active' ? 'bg-green-100 text-green-800' :
                            business.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }
                        >
                          {(business.status || 'pending').charAt(0).toUpperCase() + (business.status || 'pending').slice(1)}
                        </Badge>
                        {business.package && (
                          <Badge variant="outline" className="text-xs">
                            {business.package} Package
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Category:</span>
                          <span className="ml-2 text-gray-600">{business.category}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Location:</span>
                          <span className="ml-2 text-gray-600">{business.country}{business.state ? `, ${business.state}` : ''}</span>
                        </div>
                        {business.price && (
                          <div>
                            <span className="font-medium text-gray-700">Price:</span>
                            <span className="ml-2 text-gray-600">${business.price.toLocaleString()}</span>
                          </div>
                        )}
                        {business.yearEstablished && (
                          <div>
                            <span className="font-medium text-gray-700">Established:</span>
                            <span className="ml-2 text-gray-600">{business.yearEstablished}</span>
                          </div>
                        )}
                        {business.employees && (
                          <div>
                            <span className="font-medium text-gray-700">Employees:</span>
                            <span className="ml-2 text-gray-600">{business.employees}</span>
                          </div>
                        )}
                        {business.revenue && (
                          <div>
                            <span className="font-medium text-gray-700">Revenue:</span>
                            <span className="ml-2 text-gray-600">{business.revenue}</span>
                          </div>
                        )}
                      </div>
                      
                      {business.description && (
                        <div>
                          <span className="font-medium text-gray-700">Description:</span>
                          <p className="mt-1 text-gray-600">{business.description}</p>
                        </div>
                      )}
                      
                      {business.reason && (
                        <div>
                          <span className="font-medium text-gray-700">Reason for Sale:</span>
                          <p className="mt-1 text-gray-600">{business.reason}</p>
                        </div>
                      )}
                      
                      {business.assets && (
                        <div>
                          <span className="font-medium text-gray-700">Assets Included:</span>
                          <p className="mt-1 text-gray-600">{business.assets}</p>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2 pt-2 border-t">
                        {!business.isActive && (
                          <Button 
                            size="sm" 
                            className="text-xs bg-green-600 hover:bg-green-700"
                            onClick={() => updateBusinessStatusMutation.mutate({ 
                              id: business.id, 
                              status: 'active', 
                              isActive: true 
                            })}
                            disabled={updateBusinessStatusMutation.isPending}
                          >
                            Activate
                          </Button>
                        )}
                        
                        {business.isActive && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-xs border-red-300 text-red-600 hover:bg-red-50"
                            onClick={() => updateBusinessStatusMutation.mutate({ 
                              id: business.id, 
                              status: 'inactive', 
                              isActive: false 
                            })}
                            disabled={updateBusinessStatusMutation.isPending}
                          >
                            Deactivate
                          </Button>
                        )}
                        
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-xs"
                          onClick={() => updateBusinessStatusMutation.mutate({ 
                            id: business.id, 
                            status: 'pending', 
                            isActive: false 
                          })}
                          disabled={updateBusinessStatusMutation.isPending}
                        >
                          Set Pending
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="franchises" className="space-y-4">
            {franchisesLoading ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                  <p className="text-gray-600">Loading franchise opportunities...</p>
                </CardContent>
              </Card>
            ) : franchises.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No franchise opportunities found</h3>
                  <p className="text-gray-500">No franchise opportunities have been added yet.</p>
                </CardContent>
              </Card>
            ) : (
              franchises.map((franchise) => (
                <Card key={franchise.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg font-semibold text-gray-800">
                          {franchise.name}
                        </CardTitle>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {franchise.contactEmail || 'No contact email'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {franchise.createdAt ? new Date(franchise.createdAt as string | Date).toLocaleDateString() : 'N/A'}
                          </span>
                          <span className="flex items-center gap-1">
                            💰 {franchise.investmentRange || 'Investment range not specified'}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge 
                          variant={franchise.isActive ? 'default' : 'secondary'}
                          className={franchise.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                        >
                          {franchise.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                      <p className="text-gray-700 mb-2">
                        <strong>Category:</strong> {franchise.category}
                      </p>
                      <p className="text-gray-700 mb-2">
                        <strong>Location:</strong> {franchise.country}{franchise.state ? `, ${franchise.state}` : ''}
                      </p>
                      <p className="text-gray-700 whitespace-pre-wrap">{franchise.description}</p>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {franchise.imageUrl && (
                          <Button size="sm" variant="outline" className="text-xs" asChild>
                            <a href={franchise.imageUrl} target="_blank" rel="noopener noreferrer">
                              <Image className="w-3 h-3 mr-1" />
                              View Image
                            </a>
                          </Button>
                        )}
                        <Button size="sm" variant="outline" className="text-xs" asChild>
                          <a href={`/franchise/${franchise.id}`} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-3 h-3 mr-1" />
                            View Page
                          </a>
                        </Button>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {!franchise.isActive && (
                          <Button 
                            size="sm" 
                            className="text-xs bg-green-600 hover:bg-green-700"
                            onClick={() => updateFranchiseStatusMutation.mutate({ 
                              id: franchise.id, 
                              isActive: true 
                            })}
                            disabled={updateFranchiseStatusMutation.isPending}
                          >
                            Activate
                          </Button>
                        )}
                        
                        {franchise.isActive && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-xs border-red-300 text-red-600 hover:bg-red-50"
                            onClick={() => updateFranchiseStatusMutation.mutate({ 
                              id: franchise.id, 
                              isActive: false 
                            })}
                            disabled={updateFranchiseStatusMutation.isPending}
                          >
                            Deactivate
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      <Footer />
    </div>
  );
}