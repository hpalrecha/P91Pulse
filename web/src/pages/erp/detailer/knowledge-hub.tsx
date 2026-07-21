import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Search, BookOpen, FileText, Video, Download, Eye, Calendar, User, Tag } from 'lucide-react';
import { InfoDot } from '@/components/dev/InfoDot';

interface KnowledgeItem {
  id: number;
  title: string;
  description: string;
  type: 'document' | 'video' | 'guide' | 'faq' | 'manual';
  category: 'installation' | 'maintenance' | 'troubleshooting' | 'product-info' | 'training';
  author: string;
  createdDate: string;
  lastUpdated: string;
  downloadCount: number;
  fileSize?: string;
  duration?: string;
  tags: string[];
  status: 'published' | 'draft' | 'archived';
  fileUrl?: string;
}

const typeColors = {
  'document': 'bg-blue-100 text-blue-800',
  'video': 'bg-red-100 text-red-800',
  'guide': 'bg-green-100 text-green-800',
  'faq': 'bg-yellow-100 text-yellow-800',
  'manual': 'bg-purple-100 text-purple-800'
};

const categoryColors = {
  'installation': 'bg-orange-50 text-orange-700 border border-orange-200',
  'maintenance': 'bg-blue-50 text-blue-700 border border-blue-200',
  'troubleshooting': 'bg-red-50 text-red-700 border border-red-200',
  'product-info': 'bg-green-50 text-green-700 border border-green-200',
  'training': 'bg-purple-50 text-purple-700 border border-purple-200'
};

const DetailerKnowledgeHubPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<KnowledgeItem | null>(null);
  const [showItemDetail, setShowItemDetail] = useState(false);
  const { toast } = useToast();

  const dummyKnowledge: KnowledgeItem[] = [
    {
      id: 1,
      title: 'P91 PPF Installation Guide',
      description: 'Complete step-by-step guide for installing P91 paint protection film on various vehicle surfaces',
      type: 'guide',
      category: 'installation',
      author: 'P91 Technical Team',
      createdDate: '2025-08-01',
      lastUpdated: '2025-08-15',
      downloadCount: 245,
      fileSize: '2.3 MB',
      tags: ['ppf', 'installation', 'guide', 'step-by-step'],
      status: 'published',
      fileUrl: '/docs/ppf-installation-guide.pdf'
    },
    {
      id: 2,
      title: 'PPF Installation Training Video Series',
      description: 'Professional training video series covering advanced PPF installation techniques and troubleshooting',
      type: 'video',
      category: 'training',
      author: 'Master Installer John Doe',
      createdDate: '2025-07-20',
      lastUpdated: '2025-08-10',
      downloadCount: 189,
      duration: '45 min',
      tags: ['ppf', 'training', 'video', 'advanced'],
      status: 'published',
      fileUrl: '/videos/ppf-training-series.mp4'
    },
    {
      id: 3,
      title: 'Common Installation Issues FAQ',
      description: 'Frequently asked questions and solutions for common problems encountered during PPF installation',
      type: 'faq',
      category: 'troubleshooting',
      author: 'Support Team',
      createdDate: '2025-07-15',
      lastUpdated: '2025-08-20',
      downloadCount: 312,
      tags: ['faq', 'troubleshooting', 'common-issues'],
      status: 'published'
    },
    {
      id: 5,
      title: 'Ceramic Coating Maintenance Manual',
      description: 'Comprehensive manual for maintaining ceramic coatings, including cleaning procedures and longevity tips',
      type: 'manual',
      category: 'maintenance',
      author: 'Ceramic Pro Team',
      createdDate: '2025-06-10',
      lastUpdated: '2025-08-18',
      downloadCount: 156,
      fileSize: '1.8 MB',
      tags: ['ceramic', 'maintenance', 'manual', 'cleaning'],
      status: 'published',
      fileUrl: '/docs/ceramic-maintenance-manual.pdf'
    },
    {
      id: 6,
      title: 'Advanced PPF Cutting Techniques',
      description: 'Professional techniques for cutting and trimming PPF for complex vehicle contours and edges',
      type: 'guide',
      category: 'installation',
      author: 'Expert Installer Team',
      createdDate: '2025-08-05',
      lastUpdated: '2025-08-22',
      downloadCount: 98,
      fileSize: '3.1 MB',
      tags: ['ppf', 'cutting', 'advanced', 'techniques'],
      status: 'published',
      fileUrl: '/docs/advanced-ppf-cutting.pdf'
    }
  ];

  const filteredKnowledge = dummyKnowledge.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = typeFilter === 'all' || item.type === typeFilter;
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    
    return matchesSearch && matchesType && matchesCategory;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'document': return <FileText className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      case 'guide': return <BookOpen className="h-4 w-4" />;
      case 'faq': return <FileText className="h-4 w-4" />;
      case 'manual': return <BookOpen className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getKnowledgeStats = () => {
    const totalItems = dummyKnowledge.length;
    const totalDownloads = dummyKnowledge.reduce((sum, item) => sum + item.downloadCount, 0);
    const publishedItems = dummyKnowledge.filter(item => item.status === 'published').length;
    const videoCount = dummyKnowledge.filter(item => item.type === 'video').length;
    
    return { totalItems, totalDownloads, publishedItems, videoCount };
  };

  const stats = getKnowledgeStats();

  const handleViewItem = (item: KnowledgeItem) => {
    setSelectedItem(item);
    setShowItemDetail(true);
  };

  const handleDownload = (item: KnowledgeItem) => {
    if (item.fileUrl) {
      const link = document.createElement('a');
      link.href = item.fileUrl;
      link.download = `${item.title.replace(/\s+/g, '-').toLowerCase()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Download Started",
        description: `Downloading ${item.title}...`
      });
    } else {
      toast({
        title: "Download Unavailable",
        description: "This file is not available for download yet.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Knowledge Hub</h1>
        <p className="text-gray-600 mt-1">Access training materials, guides, and documentation</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center justify-between gap-2">
              <span className="flex items-center">Total Items</span>
              <InfoDot widgetId="detailer.knowledge.totalItems" fallbackLabel="Total Items" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalItems}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-600 flex items-center justify-between gap-2">
              <span className="flex items-center">Published</span>
              <InfoDot widgetId="detailer.knowledge.published" fallbackLabel="Published" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.publishedItems}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600 flex items-center justify-between gap-2">
              <span className="flex items-center">Total Downloads</span>
              <InfoDot widgetId="detailer.knowledge.totalDownloads" fallbackLabel="Total Downloads" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.totalDownloads}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600 flex items-center justify-between gap-2">
              <span className="flex items-center">Videos</span>
              <InfoDot widgetId="detailer.knowledge.videos" fallbackLabel="Videos" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.videoCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between gap-2">
            <span className="flex items-center">Search &amp; Filters</span>
            <InfoDot widgetId="detailer.knowledge.filters" fallbackLabel="Search & Filters" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by title, description, or tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="document">Documents</SelectItem>
                <SelectItem value="video">Videos</SelectItem>
                <SelectItem value="guide">Guides</SelectItem>
                <SelectItem value="faq">FAQs</SelectItem>
                <SelectItem value="manual">Manuals</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="installation">Installation</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="troubleshooting">Troubleshooting</SelectItem>
                <SelectItem value="product-info">Product Info</SelectItem>
                <SelectItem value="training">Training</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2">
            <span className="flex items-center">Knowledge Base</span>
            <InfoDot widgetId="detailer.knowledge.table" fallbackLabel="Knowledge Base" />
          </CardTitle>
          <CardDescription>
            Showing {filteredKnowledge.length} of {dummyKnowledge.length} items
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredKnowledge.map((item) => (
              <Card key={item.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className={typeColors[item.type]}>
                        {getTypeIcon(item.type)}
                        <span className="ml-1 capitalize">{item.type}</span>
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-500 flex items-center gap-1">
                      <Download className="h-3 w-3" />
                      {item.downloadCount}
                    </div>
                  </div>
                  <CardTitle className="text-lg leading-tight">{item.title}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                    {item.description}
                  </p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge className={categoryColors[item.category]}>
                        <Tag className="h-3 w-3 mr-1" />
                        <span className="capitalize">{item.category.replace('-', ' ')}</span>
                      </Badge>
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      {item.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {item.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{item.tags.length - 3} more
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500 pt-2">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {item.author}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(item.lastUpdated).toLocaleDateString()}
                      </div>
                    </div>
                    
                    {(item.fileSize || item.duration) && (
                      <div className="text-xs text-gray-500">
                        {item.fileSize && <span>Size: {item.fileSize}</span>}
                        {item.duration && <span>Duration: {item.duration}</span>}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleViewItem(item)}
                      data-testid={`button-view-knowledge-${item.id}`}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => handleDownload(item)}
                      data-testid={`button-download-knowledge-${item.id}`}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredKnowledge.length === 0 && (
              <div className="col-span-full text-center py-8 text-gray-500">
                No knowledge items found matching your search criteria.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showItemDetail} onOpenChange={setShowItemDetail}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedItem?.title}</DialogTitle>
            <DialogDescription>
              {selectedItem?.type && (
                <Badge className={typeColors[selectedItem.type]}>
                  {getTypeIcon(selectedItem.type)}
                  <span className="ml-1 capitalize">{selectedItem.type}</span>
                </Badge>
              )}
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-6">
              <div>
                <Label className="text-sm font-medium">Description</Label>
                <div className="mt-1 p-3 bg-gray-50 rounded-md">
                  {selectedItem.description}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Content Details</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-md space-y-1">
                    <div><strong>Category:</strong> <span className="capitalize">{selectedItem.category.replace('-', ' ')}</span></div>
                    <div><strong>Author:</strong> {selectedItem.author}</div>
                    <div><strong>Downloads:</strong> {selectedItem.downloadCount}</div>
                    {selectedItem.fileSize && <div><strong>File Size:</strong> {selectedItem.fileSize}</div>}
                    {selectedItem.duration && <div><strong>Duration:</strong> {selectedItem.duration}</div>}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Timeline</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-md space-y-1">
                    <div><strong>Created:</strong> {new Date(selectedItem.createdDate).toLocaleDateString()}</div>
                    <div><strong>Last Updated:</strong> {new Date(selectedItem.lastUpdated).toLocaleDateString()}</div>
                    <div><strong>Status:</strong> <span className="capitalize">{selectedItem.status}</span></div>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Tags</Label>
                <div className="mt-1 flex flex-wrap gap-2">
                  {selectedItem.tags.map((tag, index) => (
                    <Badge key={index} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button className="flex-1" onClick={() => handleDownload(selectedItem)}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button variant="outline" className="flex-1">
                  Share
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DetailerKnowledgeHubPage;
