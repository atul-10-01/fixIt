/**
 * Controller handling Google Gemini vision analysis and formal grievance letter generation.
 */
import { Request, Response } from "express";
import { ai } from "../config/ai";

export const aiController = {
  // AI Image Analysis via Gemini
  analyzeImage: async (req: Request, res: Response) => {
    const { imageBase64, imageDataUrl, mimeType } = req.body;
    const sourceImage = imageBase64 || imageDataUrl;
    const resolvedMimeType =
      mimeType ||
      (typeof sourceImage === "string" ? sourceImage.match(/^data:([^;]+);base64,/)?.[1] : undefined) ||
      "image/jpeg";

    if (!sourceImage) {
      res.status(400).json({ error: "Missing imageBase64 or imageDataUrl parameter." });
      return;
    }

    const resolvedBase64 =
      typeof sourceImage === "string"
        ? sourceImage.includes(",")
          ? sourceImage.split(",")[1] || ""
          : sourceImage
        : "";

    if (!resolvedBase64) {
      res.status(400).json({ error: "Missing imageBase64 payload." });
      return;
    }

    // Server-side real EXIF detection
    let hasExif = false;
    try {
      const buffer = Buffer.from(resolvedBase64, 'base64');
      if (buffer.length >= 4 && buffer[0] === 0xFF && buffer[1] === 0xD8) {
        const scanLimit = Math.min(buffer.length - 8, 2048);
        for (let i = 2; i < scanLimit; i++) {
          if (buffer[i] === 0xFF && buffer[i + 1] === 0xE1) {
            const offset = i + 4;
            if (
              buffer[offset] === 0x45 && // 'E'
              buffer[offset + 1] === 0x78 && // 'x'
              buffer[offset + 2] === 0x69 && // 'i'
              buffer[offset + 3] === 0x66 && // 'f'
              buffer[offset + 4] === 0x00 &&
              buffer[offset + 5] === 0x00
            ) {
              hasExif = true;
              break;
            }
          }
        }
      }
    } catch (err) {
      console.error("Error parsing EXIF on server:", err);
    }

    const promptText = `Analyze this image of a community/civic issue. Note that the uploaded image file ${
      hasExif 
        ? "contains valid camera EXIF metadata headers (strongly suggesting it is a direct camera capture)." 
        : "does not contain standard camera EXIF metadata headers (suggesting it is a screenshot, download, or edited image)."
    }
Respond in valid JSON only with this exact structure:
{
  "title": "Brief descriptive title (max 60 chars)",
  "description": "Detailed description of what you see (2-3 sentences)",
  "category": "one of: pothole|water_leakage|streetlight|garbage|graffiti|road_damage|flooding|encroachment|other",
  "severityScore": <integer 1-10, where 1=minor aesthetic, 10=immediate safety hazard>,
  "severityReasoning": "One sentence explaining the severity score",
  "estimatedImpactRadius": <integer meters, typically 10-500>,
  "suggestedAuthority": "Name of the municipal department that should handle this",
  "estimatedResolutionDays": <integer>,
  "urgencyKeywords": ["array", "of", "relevant", "tags"],
  "confidence": <float 0-1>,
  "authenticityReasoning": "One sentence explaining if this is a genuine camera-captured photograph, or if it is a screenshot (look for phone status bars, time/battery icons, browser controls, crop/UI elements, black borders) or AI-generated/modified",
  "authenticityScore": <float 0-1, where 1.0 is definitely a direct camera-captured photo and less than 0.5 if it is a screenshot, AI-generated, or heavily modified>
}`;

    // Pre-validate base64 payload format to prevent API errors on dummy/test inputs
    const isValidBase64 = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(resolvedBase64) && resolvedBase64 !== "dummy_base64_data";

    if (ai && isValidBase64) {
      try {
        console.log("Calling Gemini API for image analysis...");
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [
            {
              role: "user",
              parts: [
                { text: promptText },
                {
                  inlineData: {
                    mimeType: resolvedMimeType,
                    data: resolvedBase64
                  }
                }
              ]
            }
          ]
        });

        const responseText = response.text;
        console.log("Gemini response text:", responseText);

        let jsonString = responseText || "";
        if (jsonString.includes("```")) {
          const matches = jsonString.match(/```json\s*([\s\S]*?)\s*```/) || jsonString.match(/```\s*([\s\S]*?)\s*```/);
          if (matches && matches[1]) {
            jsonString = matches[1];
          }
        }

        const parsedResult = JSON.parse(jsonString.trim());
        res.json(parsedResult);
        return;
      } catch (apiError) {
        console.error("Gemini API call failed, using high-fidelity fallback generator:", apiError);
      }
    }

    console.log("Invoking fallback local AI visual simulator...");
    const simulatedResponses = [
      {
        title: "Active Road Pothole and Cracking",
        description: "Severe pavement deterioration and cratering along the primary traffic lane. Poses immediate risk to light vehicles and commuters.",
        category: "pothole",
        severityScore: 7,
        severityReasoning: "Deep crater forcing vehicles to swerve abruptly into oncoming lanes.",
        estimatedImpactRadius: 150,
        suggestedAuthority: "Public Works Department (PWD)",
        estimatedResolutionDays: 4,
        urgencyKeywords: ["road_hazard", "pothole", "active_damage"],
        confidence: 0.92,
        authenticityReasoning: "Standard camera lens distortion and noise patterns. Authentic metadata found.",
        authenticityScore: 0.98
      },
      {
        title: "Broken Streetlight & Dark Passage",
        description: "Defunct lighting overhead along the pedestrian corridor. Creates an insecure walkway after dark.",
        category: "streetlight",
        severityScore: 6,
        severityReasoning: "Lack of visibility increases hazard risks and petty security incidents at night.",
        estimatedImpactRadius: 80,
        suggestedAuthority: "Municipal Corporation Electrical Dept",
        estimatedResolutionDays: 3,
        urgencyKeywords: ["streetlight_broken", "insecurity", "dark_passage"],
        confidence: 0.89,
        authenticityReasoning: "Clean image with proper high-ISO noise typical of smartphone low-light capture.",
        authenticityScore: 0.95
      },
      {
        title: "Overflowing Garbage Container and Litter",
        description: "Solid waste piled around the public dumpster container, spilling onto the footpath. Bad odour and hygienic concerns.",
        category: "garbage",
        severityScore: 5,
        severityReasoning: "Attracting stray animals and creating health hazards for the nearby residents.",
        estimatedImpactRadius: 120,
        suggestedAuthority: "Solid Waste Management Division",
        estimatedResolutionDays: 2,
        urgencyKeywords: ["waste_spill", "sanitation_risk", "clogged_footpath"],
        confidence: 0.95,
        authenticityReasoning: "No sign of generative editing. Realistic textures, shadows match ambient light source.",
        authenticityScore: 0.99
      },
      {
        title: "Water Mains Leakage and Road Flooding",
        description: "Pressurized clean water leaking through crack in pavement, accumulating on the side of the street.",
        category: "water_leakage",
        severityScore: 6,
        severityReasoning: "Constant wasting of municipal water and potential soil erosion beneath the road bed.",
        estimatedImpactRadius: 200,
        suggestedAuthority: "Water Supply & Sewerage Board",
        estimatedResolutionDays: 3,
        urgencyKeywords: ["water_wastage", "leakage", "flooding_threat"],
        confidence: 0.91,
        authenticityReasoning: "Real-time water reflection lines are physically consistent. Genuine photo.",
        authenticityScore: 0.97
      }
    ];

    const result = simulatedResponses[Math.floor(Math.random() * simulatedResponses.length)];
    res.json({
      ...result,
      isSimulated: true,
      simulationReason: "api_error"
    });
  },

  // Formal complaint letter formulation
  generateComplaint: async (req: Request, res: Response) => {
    const { title, description, category, severity, verificationCount, location, daysUnresolved, reporterName, generatedDate } = req.body;
    const letterDate = generatedDate || new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
    const complainantName = reporterName || "Anonymous Citizen";
    const unresolvedDays = daysUnresolved || 3;

    const promptText = `Write an official municipal complaint letter to the ward commissioner or city magistrate regarding a civic issue with the following details:
- Date of Letter: ${letterDate}
- Complainant Name: ${complainantName}
- Issue Title: ${title}
- Description: ${description}
- Category: ${category}
- Severity: ${severity}
- Verification Count: ${verificationCount} citizens verified this
- Location Address: ${location?.address}, Area: ${location?.area}, City: ${location?.city}
- Days Unresolved: ${unresolvedDays} days since report

Provide a professional, serious, and legally formatted complaint letter in plain text.
The tone should be respectful but demanding urgent structural repair. Reference public safety mandates where appropriate.
Use the exact Date of Letter and Complainant Name above; do not leave placeholders for date or signature.
Include a clear subject, salutation, evidence summary, requested action, and signature line.
Do not use Markdown syntax, asterisks, bullet characters, tables, or code fences.
Return ONLY the plain-text letter.`;

    if (ai) {
      try {
        console.log("Calling Gemini API for complaint letter generation...");
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: promptText
        });
        res.json({ text: response.text });
        return;
      } catch (apiError) {
        console.error("Gemini API call failed for letter generation, using local generator fallback:", apiError);
      }
    }

    const letterText = `
FORMAL CIVIC GRIEVANCE COMPLAINT

Date: ${letterDate}
To,
The Joint Ward Commissioner / Chief Municipal Engineer,  
Municipal Corporation Division,  
${location?.city || "City Municipal Ward"}, India.

Subject: URGENT CITIZEN DEMAND - Immediate remediation of ${category?.toUpperCase()} hazard at ${location?.area || "Local Area"}

Respected Sir/Madam,

This is an official grievance registered under the FixIt Community Security Network. We write to direct your immediate attention to a critical public hazard that poses severe threats to the safety, health, and mobility of residents in this quadrant.

Grievance Specifications:
Incident Title: ${title || "Public Safety Risk"}
Detailed Description: ${description || "No description provided."}
Location Address: ${location?.address || "Unknown Road"}
Assessed Severity Category: ${severity?.toUpperCase() || "HIGH"}
Duration Outstanding: Unresolved for ${unresolvedDays} days since official report.

Community Verification & Evidence:
This report is not an isolated complaint. It has been actively geofenced-verified on-site by ${verificationCount || 5} registered local citizens who have attested to its ongoing threat level. Photographic evidence has been verified and registered on our civic ledger.

The persistence of this hazard represents a direct failure of standard ward maintenance guidelines and creates a high-risk liability for the municipal office under public security safety mandates. 

Required Action:
We respectfully demand that a field engineer inspect the site and coordinate an active repair squad within 48 hours of receiving this grievance. 

Failure to act will result in this complaint being escalated directly to the state grievance division and shared with local media and resident welfare associations to ensure institutional accountability.

Thank you for your prompt attention to public safety.

Sincerely,
Civic Hero Advocate: ${complainantName}
On behalf of the ${location?.area || "Koramangala"} Resident Collective
CC: Ward Sanitation & Infrastructure Council
    `;

    res.json({
      text: letterText.trim(),
      isSimulated: true,
      simulationReason: "api_error"
    });
  }
};
