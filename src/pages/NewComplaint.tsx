import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, ArrowRight, Sparkles, Save, ImagePlus, X, Wand2 } from "lucide-react";
import { ComplaintTemplates } from "@/components/ComplaintTemplates";
import { useAutoDraft } from "@/hooks/useAutoDraft";
import { useAICategory } from "@/hooks/useAICategory";
import { useMultiPhotoUpload } from "@/hooks/useMultiPhotoUpload";
import { MultiPhotoUpload } from "@/components/MultiPhotoUpload";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { MoodSelector } from "@/components/MoodSelector";
import { SeveritySlider } from "@/components/SeveritySlider";
import { ImportanceBadgeSelector } from "@/components/ImportanceBadgeSelector";
import { AITitleGenerator } from "@/components/AITitleGenerator";
import { AIDescriptionGenerator } from "@/components/AIDescriptionGenerator";
import { LocationSelector } from "@/components/LocationSelector";
import { AIComplaintHelper } from "@/components/AIComplaintHelper";
import { RecentCategories } from "@/components/RecentCategories";
import { UrgencyReasonInput } from "@/components/UrgencyReasonInput";
import { PhotoProblemDetector } from "@/components/PhotoProblemDetector";
import { CloudFileAttachment } from "@/components/CloudFileAttachment";

const NewComplaint = () => {
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [urgency, setUrgency] = useState("medium");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [showTemplates, setShowTemplates] = useState(true);
  const [showAIHelper, setShowAIHelper] = useState(false);
  const [mood, setMood] = useState<string>("");
  const [severity, setSeverity] = useState<number>(5);
  const [importance, setImportance] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [urgencyReason, setUrgencyReason] = useState<string>("");
  const [cloudFiles, setCloudFiles] = useState<{ url: string; name: string }[]>([]);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Auto-draft saving
  const { clearDraft } = useAutoDraft(
    { title, description, category, urgency, is_anonymous: isAnonymous },
    step > 0 // Only enable after templates
  );

  // AI category detection
  const { suggestedCategory, confidence } = useAICategory(title + " " + description);

  // Multi-photo upload
  const { photos, uploading, handlePhotoSelect, removePhoto, uploadPhotos, clearPhotos } = useMultiPhotoUpload();

  // Load existing draft on mount
  useEffect(() => {
    loadDraft();
  }, []);

  const loadDraft = async () => {
    const { data } = await supabase
      .from("complaint_drafts")
      .select("*")
      .eq("student_id", user?.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      const shouldLoad = window.confirm("You have a saved draft. Would you like to continue from where you left off?");
      if (shouldLoad) {
        setTitle(data.title || "");
        setDescription(data.description || "");
        setCategory(data.category || "");
        setUrgency(data.urgency || "medium");
        setIsAnonymous(data.is_anonymous || false);
        setShowTemplates(false);
        setStep(1);
      }
    }
  };

  const handleTemplateSelect = (template: any) => {
    setTitle(template.title);
    setDescription(template.description);
    setCategory(template.category);
    setUrgency(template.urgency);
    setShowTemplates(false);
    setShowAIHelper(false);
    setStep(1);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim() || !category) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    const { data, error } = await supabase
      .from("complaints")
      .insert([{
        student_id: user?.id as string,
        title: title.trim(),
        description: description.trim(),
        category: category as any,
        urgency: urgency as any,
        is_anonymous: isAnonymous,
        mood: mood || null,
        severity_score: severity,
        importance_type: importance || null,
        location: location || null,
      }])
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to submit complaint",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Upload photos if exist
    if (photos.length > 0 && data) {
      await uploadPhotos(data.id, user?.id as string);
    }

    await clearDraft();
    toast({
      title: "Success",
      description: "Your complaint has been submitted",
    });
    navigate("/dashboard");

    setIsLoading(false);
  };

  const handleNext = () => {
    if (step === 1 && !category) {
      toast({
        title: "Select Category",
        description: "Please select a category to continue",
        variant: "destructive",
      });
      return;
    }
    if (step === 2 && (!title.trim() || !description.trim())) {
      toast({
        title: "Missing Information",
        description: "Please provide both title and description",
        variant: "destructive",
      });
      return;
    }
    setStep(step + 1);
  };

  const steps = ["Templates", "Category", "Details", "Review"];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Progress indicator */}
        {!showTemplates && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              {steps.slice(1).map((label, idx) => (
                <div key={label} className="flex items-center flex-1">
                  <div
                    className={`h-2 flex-1 rounded ${
                      idx < step ? "bg-primary" : "bg-muted"
                    }`}
                  />
                  {idx < steps.length - 2 && <div className="w-2" />}
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              {steps.slice(1).map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>
          </div>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  {showTemplates ? "Choose a Template" : steps[step]}
                </CardTitle>
                <CardDescription>
                  {showTemplates
                    ? "Start with a template or skip to create from scratch"
                    : step === 1
                    ? "Select the category that best describes your issue"
                    : step === 2
                    ? "Provide details about your complaint"
                    : "Review your complaint before submitting"}
                </CardDescription>
              </div>
              {!showTemplates && step > 0 && (
                <Badge variant="outline" className="gap-1">
                  <Save className="h-3 w-3" />
                  Auto-saving
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {showTemplates ? (
              <div className="space-y-4">
                {showAIHelper ? (
                  <>
                    <AIComplaintHelper 
                      onComplaintGenerated={(data) => {
                        setTitle(data.title);
                        setDescription(data.description);
                        setCategory(data.category);
                        setUrgency(data.urgency);
                        if (data.mood) setMood(data.mood);
                        setShowTemplates(false);
                        setShowAIHelper(false);
                        setStep(1);
                      }}
                    />
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setShowAIHelper(false)}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Templates
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                      <Button
                        variant="neon"
                        className="gap-2 h-auto py-4"
                        onClick={() => setShowAIHelper(true)}
                      >
                        <Wand2 className="h-5 w-5" />
                        <div className="text-left">
                          <div className="font-semibold">AI Helper</div>
                          <div className="text-xs opacity-80">Type rough text, AI formats it</div>
                        </div>
                      </Button>
                      <Button
                        variant="outline"
                        className="gap-2 h-auto py-4"
                        onClick={() => {
                          setShowTemplates(false);
                          setStep(1);
                        }}
                      >
                        <ArrowRight className="h-5 w-5" />
                        <div className="text-left">
                          <div className="font-semibold">Manual Entry</div>
                          <div className="text-xs opacity-80">Fill form step by step</div>
                        </div>
                      </Button>
                    </div>
                    <ComplaintTemplates onSelectTemplate={handleTemplateSelect} />
                  </>
                )}
              </div>
            ) : step === 1 ? (
              <div className="space-y-4">
                {/* Recent Categories */}
                <RecentCategories 
                  onSelect={setCategory} 
                  currentCategory={category}
                />

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="facilities">Facilities</SelectItem>
                      <SelectItem value="curriculum">Curriculum</SelectItem>
                      <SelectItem value="mentorship">Mentorship</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="urgency">Urgency *</Label>
                  <Select value={urgency} onValueChange={setUrgency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Urgency Reason Input */}
                <UrgencyReasonInput
                  urgency={urgency}
                  value={urgencyReason}
                  onChange={setUrgencyReason}
                />

                <Button onClick={handleNext} className="w-full">
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            ) : step === 2 ? (
              <div className="space-y-4">
                {/* AI Photo Problem Detection */}
                <PhotoProblemDetector
                  onProblemDetected={(data) => {
                    setTitle(data.problemType);
                    setDescription(data.description);
                    if (data.category) setCategory(data.category);
                  }}
                />

                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="Brief summary of your complaint"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={100}
                  />
                  <AITitleGenerator 
                    description={description}
                    onTitleGenerated={setTitle}
                    disabled={!description.trim()}
                  />
                </div>

                {suggestedCategory && confidence > 50 && suggestedCategory !== category && (
                  <div className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <p className="text-sm flex-1">
                      AI suggests <span className="font-medium capitalize">{suggestedCategory}</span> category ({confidence}% confidence)
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCategory(suggestedCategory)}
                    >
                      Apply
                    </Button>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="description">Description *</Label>
                    <div className="flex items-center gap-2">
                      <AIDescriptionGenerator
                        title={title}
                        category={category}
                        onDescriptionGenerated={setDescription}
                        disabled={!title.trim()}
                      />
                      <VoiceRecorder 
                        onTranscription={(text) => setDescription(prev => prev ? `${prev}\n${text}` : text)}
                      />
                    </div>
                  </div>
                  <Textarea
                    id="description"
                    placeholder="Provide detailed information about your complaint (or use AI generation/voice recording)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={6}
                    maxLength={1000}
                  />
                  <p className="text-sm text-muted-foreground">
                    {description.length}/1000 characters
                  </p>
                </div>

                {/* Multi-Photo Upload Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Attachments</Label>
                    <CloudFileAttachment
                      onFileAttached={(url, name) => {
                        setCloudFiles(prev => [...prev, { url, name }]);
                      }}
                    />
                  </div>
                  <MultiPhotoUpload
                    photos={photos}
                    onPhotoSelect={handlePhotoSelect}
                    onRemovePhoto={removePhoto}
                    uploading={uploading}
                  />
                  {cloudFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {cloudFiles.map((file, idx) => (
                        <Badge key={idx} variant="secondary" className="gap-1">
                          {file.name}
                          <button
                            type="button"
                            onClick={() => setCloudFiles(prev => prev.filter((_, i) => i !== idx))}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <LocationSelector value={location} onChange={setLocation} />

                <MoodSelector value={mood} onChange={setMood} />

                <SeveritySlider value={severity} onChange={setSeverity} />

                <ImportanceBadgeSelector value={importance} onChange={setImportance} />

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button onClick={handleNext} className="flex-1">
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-muted-foreground">Title</Label>
                    <p className="font-medium">{title}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Category</Label>
                    <p className="font-medium capitalize">{category}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Urgency</Label>
                    <p className="font-medium capitalize">{urgency}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Description</Label>
                    <p className="whitespace-pre-wrap">{description}</p>
                  </div>
                  {location && (
                    <div>
                      <Label className="text-muted-foreground">Location</Label>
                      <p className="font-medium capitalize">{location.replace('-', ' ')}</p>
                    </div>
                  )}
                  {photos.length > 0 && (
                    <div>
                      <Label className="text-muted-foreground">Attached Photos</Label>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        {photos.map((photo, index) => (
                          <img
                            key={index}
                            src={photo.preview}
                            alt={`Attachment ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="anonymous"
                    checked={isAnonymous}
                    onCheckedChange={(checked) => setIsAnonymous(checked as boolean)}
                  />
                  <Label htmlFor="anonymous" className="text-sm font-normal cursor-pointer">
                    Submit anonymously
                  </Label>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button onClick={handleSubmit} disabled={isLoading || uploading} className="flex-1">
                    {(isLoading || uploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {uploading ? "Uploading..." : "Submit Complaint"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default NewComplaint;
