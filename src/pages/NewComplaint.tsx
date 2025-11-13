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
import { Loader2, ArrowLeft, ArrowRight, Sparkles, Save, ImagePlus, X } from "lucide-react";
import { ComplaintTemplates } from "@/components/ComplaintTemplates";
import { useAutoDraft } from "@/hooks/useAutoDraft";
import { useAICategory } from "@/hooks/useAICategory";
import { usePhotoUpload } from "@/hooks/usePhotoUpload";

const NewComplaint = () => {
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [urgency, setUrgency] = useState("medium");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [showTemplates, setShowTemplates] = useState(true);
  
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

  // Photo upload
  const { photo, photoPreview, uploading, handlePhotoSelect, uploadPhoto, removePhoto } = usePhotoUpload();

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

    // Upload photo if exists
    if (photo && data) {
      await uploadPhoto(data.id, user?.id as string);
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
                <ComplaintTemplates onSelectTemplate={handleTemplateSelect} />
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setShowTemplates(false);
                    setStep(1);
                  }}
                >
                  Skip Templates
                </Button>
              </div>
            ) : step === 1 ? (
              <div className="space-y-4">
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

                <Button onClick={handleNext} className="w-full">
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            ) : step === 2 ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="Brief summary of your complaint"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={100}
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
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Provide detailed information about your complaint"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={6}
                    maxLength={1000}
                  />
                  <p className="text-sm text-muted-foreground">
                    {description.length}/1000 characters
                  </p>
                </div>

                {/* Photo Upload Section */}
                <div className="space-y-2">
                  <Label>Attach Photo (Optional)</Label>
                  {!photoPreview ? (
                    <div>
                      <input
                        type="file"
                        id="photo-upload"
                        accept="image/jpeg,image/jpg,image/png"
                        className="hidden"
                        onChange={handlePhotoSelect}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => document.getElementById("photo-upload")?.click()}
                      >
                        <ImagePlus className="mr-2 h-4 w-4" />
                        Add Photo
                      </Button>
                      <p className="text-xs text-muted-foreground mt-1">
                        JPG, PNG only. Max 5MB
                      </p>
                    </div>
                  ) : (
                    <div className="relative">
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-lg border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={removePhoto}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

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
                  {photoPreview && (
                    <div>
                      <Label className="text-muted-foreground">Attached Photo</Label>
                      <img
                        src={photoPreview}
                        alt="Complaint attachment"
                        className="mt-2 w-full max-h-64 object-cover rounded-lg border"
                      />
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
