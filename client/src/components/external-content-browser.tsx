import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ExternalContentBrowserProps {
  onSelect: (content: any) => void;
}

export function ExternalContentBrowser({ onSelect }: ExternalContentBrowserProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("videos");
  const [open, setOpen] = useState(false);

  // Search YouTube videos using YouTube Data API v3 (free tier)
  const { data: videos, isLoading: videosLoading } = useQuery({
    queryKey: ["youtube-videos", searchQuery],
    queryFn: async () => {
      if (!searchQuery) return [];
      
      // Using YouTube Data API v3
      const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY || "demo";
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
          searchQuery + " educational"
        )}&type=video&maxResults=10&key=${API_KEY}`
      );
      
      if (!response.ok) {
        // Return mock data if API key not configured
        return getMockVideos(searchQuery);
      }
      
      const data = await response.json();
      return data.items || [];
    },
    enabled: searchQuery.length > 2 && activeTab === "videos",
  });

  // Search Open Library for books
  const { data: books, isLoading: booksLoading } = useQuery({
    queryKey: ["openlibrary-books", searchQuery],
    queryFn: async () => {
      if (!searchQuery) return [];
      
      const response = await fetch(
        `https://openlibrary.org/search.json?q=${encodeURIComponent(
          searchQuery
        )}&limit=10`
      );
      
      if (!response.ok) {
        return getMockBooks(searchQuery);
      }
      
      const data = await response.json();
      return data.docs || [];
    },
    enabled: searchQuery.length > 2 && activeTab === "books",
  });

  // Search Khan Academy API (free educational resources)
  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ["khan-academy", searchQuery],
    queryFn: async () => {
      if (!searchQuery) return [];
      
      // Khan Academy API
      const response = await fetch(
        `https://www.khanacademy.org/api/v1/search?q=${encodeURIComponent(
          searchQuery
        )}&limit=10`
      );
      
      if (!response.ok) {
        return getMockCourses(searchQuery);
      }
      
      const data = await response.json();
      return data.results || [];
    },
    enabled: searchQuery.length > 2 && activeTab === "courses",
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const handleSelectContent = (content: any, type: string) => {
    onSelect({ ...content, contentType: type });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" type="button">
          <span className="material-icons mr-2">add_circle</span>
          Add External Content
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Browse Educational Content</DialogTitle>
          <DialogDescription>
            Search for videos, books, and courses to enhance your lesson
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Bar */}
          <form onSubmit={handleSearch}>
            <div className="flex gap-2">
              <Input
                placeholder="Search for educational content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button type="submit">
                <span className="material-icons">search</span>
              </Button>
            </div>
          </form>

          {/* Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="videos">Videos</TabsTrigger>
              <TabsTrigger value="books">Books</TabsTrigger>
              <TabsTrigger value="courses">Courses</TabsTrigger>
            </TabsList>

            {/* Videos Tab */}
            <TabsContent value="videos">
              <ScrollArea className="h-[400px]">
                {videosLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-24" />
                    <Skeleton className="h-24" />
                    <Skeleton className="h-24" />
                  </div>
                ) : videos && videos.length > 0 ? (
                  <div className="space-y-3">
                    {videos.map((video: any) => (
                      <Card key={video.id?.videoId || video.id} className="hover-elevate">
                        <CardContent className="py-4">
                          <div className="flex gap-4">
                            <img
                              src={video.snippet?.thumbnails?.default?.url || "/placeholder-video.jpg"}
                              alt={video.snippet?.title}
                              className="w-32 h-20 object-cover rounded"
                            />
                            <div className="flex-1">
                              <h4 className="font-semibold text-sm line-clamp-2">
                                {video.snippet?.title}
                              </h4>
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {video.snippet?.description}
                              </p>
                              <Badge variant="outline" className="mt-2">
                                <span className="material-icons text-xs mr-1">play_circle</span>
                                Video
                              </Badge>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleSelectContent(video, "video")}
                            >
                              Add
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <span className="material-icons text-muted-foreground text-5xl">video_library</span>
                    <p className="text-muted-foreground mt-2">
                      {searchQuery ? "No videos found" : "Search for videos to get started"}
                    </p>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            {/* Books Tab */}
            <TabsContent value="books">
              <ScrollArea className="h-[400px]">
                {booksLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-24" />
                    <Skeleton className="h-24" />
                    <Skeleton className="h-24" />
                  </div>
                ) : books && books.length > 0 ? (
                  <div className="space-y-3">
                    {books.map((book: any) => (
                      <Card key={book.key} className="hover-elevate">
                        <CardContent className="py-4">
                          <div className="flex gap-4">
                            <div className="w-16 h-20 bg-muted rounded flex items-center justify-center">
                              <span className="material-icons text-muted-foreground">menu_book</span>
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-sm line-clamp-2">{book.title}</h4>
                              <p className="text-xs text-muted-foreground mt-1">
                                {book.author_name?.[0] || "Unknown Author"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Published: {book.first_publish_year || "N/A"}
                              </p>
                              <Badge variant="outline" className="mt-2">
                                <span className="material-icons text-xs mr-1">menu_book</span>
                                Book
                              </Badge>
                            </div>
                            <Button size="sm" onClick={() => handleSelectContent(book, "book")}>
                              Add
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <span className="material-icons text-muted-foreground text-5xl">menu_book</span>
                    <p className="text-muted-foreground mt-2">
                      {searchQuery ? "No books found" : "Search for books to get started"}
                    </p>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            {/* Courses Tab */}
            <TabsContent value="courses">
              <ScrollArea className="h-[400px]">
                {coursesLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-24" />
                    <Skeleton className="h-24" />
                    <Skeleton className="h-24" />
                  </div>
                ) : courses && courses.length > 0 ? (
                  <div className="space-y-3">
                    {courses.map((course: any, index: number) => (
                      <Card key={course.id || index} className="hover-elevate">
                        <CardContent className="py-4">
                          <div className="flex gap-4">
                            <div className="w-16 h-16 bg-primary/10 rounded flex items-center justify-center">
                              <span className="material-icons text-primary">school</span>
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-sm line-clamp-2">{course.title}</h4>
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {course.description || "Educational course material"}
                              </p>
                              <Badge variant="outline" className="mt-2">
                                <span className="material-icons text-xs mr-1">school</span>
                                Course
                              </Badge>
                            </div>
                            <Button size="sm" onClick={() => handleSelectContent(course, "course")}>
                              Add
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <span className="material-icons text-muted-foreground text-5xl">school</span>
                    <p className="text-muted-foreground mt-2">
                      {searchQuery ? "No courses found" : "Search for courses to get started"}
                    </p>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Mock data for when API keys are not configured
function getMockVideos(query: string) {
  return [
    {
      id: { videoId: "mock1" },
      snippet: {
        title: `${query} - Introduction Tutorial`,
        description: "Learn the fundamentals and key concepts in this comprehensive guide.",
        thumbnails: { default: { url: "https://via.placeholder.com/120x90?text=Video" } },
      },
    },
    {
      id: { videoId: "mock2" },
      snippet: {
        title: `${query} - Advanced Concepts`,
        description: "Deep dive into advanced topics and practical applications.",
        thumbnails: { default: { url: "https://via.placeholder.com/120x90?text=Video" } },
      },
    },
    {
      id: { videoId: "mock3" },
      snippet: {
        title: `${query} - Complete Course`,
        description: "A full course covering everything from basics to expert level.",
        thumbnails: { default: { url: "https://via.placeholder.com/120x90?text=Video" } },
      },
    },
  ];
}

function getMockBooks(query: string) {
  return [
    {
      key: "mock1",
      title: `Introduction to ${query}`,
      author_name: ["Education Expert"],
      first_publish_year: 2020,
    },
    {
      key: "mock2",
      title: `${query}: A Comprehensive Guide`,
      author_name: ["Academic Press"],
      first_publish_year: 2021,
    },
    {
      key: "mock3",
      title: `Mastering ${query}`,
      author_name: ["Learning Institute"],
      first_publish_year: 2022,
    },
  ];
}

function getMockCourses(query: string) {
  return [
    {
      id: "mock1",
      title: `${query} Fundamentals`,
      description: "Build a strong foundation in core concepts and principles.",
    },
    {
      id: "mock2",
      title: `${query} for Beginners`,
      description: "Start your learning journey with step-by-step lessons.",
    },
    {
      id: "mock3",
      title: `Advanced ${query}`,
      description: "Take your skills to the next level with expert techniques.",
    },
  ];
}
