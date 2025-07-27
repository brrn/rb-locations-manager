const fs = require("fs").promises;
const { geocodeAddress } = require("./google");

const SUBMISSIONS_FILE = "pending-locations.json";
const REJECTED_LOCATIONS_FILE = "rejected-locations.json";

// Load pending submissions
async function loadPendingSubmissions() {
  try {
    await fs.access(SUBMISSIONS_FILE);
    const data = await fs.readFile(SUBMISSIONS_FILE, "utf8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Save pending submissions
async function savePendingSubmissions(submissions) {
  await fs.writeFile(SUBMISSIONS_FILE, JSON.stringify(submissions, null, 2));
}

// Load rejected locations
async function loadRejectedLocations() {
  try {
    await fs.access(REJECTED_LOCATIONS_FILE);
    const data = await fs.readFile(REJECTED_LOCATIONS_FILE, "utf8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Save rejected locations
async function saveRejectedLocations(locations) {
  await fs.writeFile(REJECTED_LOCATIONS_FILE, JSON.stringify(locations, null, 2));
}

// Process approved and rejected submissions and convert them to manual locations
async function processApprovedSubmissions() {
  const submissions = await loadPendingSubmissions();
  const approvedSubmissions = submissions.filter(s => s.status === "approved");
  const rejectedSubmissions = submissions.filter(s => s.status === "rejected");
  const pendingSubmissions = submissions.filter(s => s.status === "pending");
  
  // Convert approved submissions to manual location format
  const newManualLocations = approvedSubmissions.map(submission => {
    // Generate a unique ID for the manual location
    const manualId = `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      id: manualId,
      name: submission.businessName,
      address: submission.fullAddress,
      lat: submission.coordinates?.lat || null,
      lng: submission.coordinates?.lng || null,
      contact: submission.contactName || null,
      email: submission.email || null,
      phone: submission.phone || null,
      channel: submission.channel,
      submittedAt: submission.submittedAt,
      approvedAt: submission.approvedAt,
      skus: submission.carriedProducts || [],
      isManual: true,
      status: "active"
    };
  });

  // Convert rejected submissions to manual location format and save locally
  const rejectedManualLocations = rejectedSubmissions.map(submission => {
    // Generate a unique ID for the manual location
    const manualId = `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      id: manualId,
      name: submission.businessName,
      address: submission.fullAddress,
      lat: submission.coordinates?.lat || null,
      lng: submission.coordinates?.lng || null,
      contact: submission.contactName || null,
      email: submission.email || null,
      phone: submission.phone || null,
      channel: submission.channel,
      submittedAt: submission.submittedAt,
      rejectedAt: submission.rejectedAt,
      rejectionReason: submission.rejectionReason,
      skus: submission.carriedProducts || [],
      isManual: true,
      status: "rejected"
    };
  });

  // Save rejected locations to local file for persistence
  if (rejectedManualLocations.length > 0) {
    const existingRejected = await loadRejectedLocations();
    const updatedRejected = [...existingRejected, ...rejectedManualLocations];
    await saveRejectedLocations(updatedRejected);
  }

  // Remove approved and rejected submissions from the pending file
  await savePendingSubmissions(pendingSubmissions);

  return {
    newManualLocations,
    rejectedManualLocations,
    remainingPending: pendingSubmissions.length
  };
}

// Get all pending submissions for admin review
async function getPendingSubmissions() {
  const submissions = await loadPendingSubmissions();
  return submissions.filter(s => s.status === "pending");
}

// Get all rejected locations for admin review
async function getRejectedLocations() {
  return await loadRejectedLocations();
}

// Approve a submission
async function approveSubmission(submissionId) {
  const submissions = await loadPendingSubmissions();
  const submission = submissions.find(s => s.id === submissionId);
  
  if (!submission) {
    throw new Error("Submission not found");
  }

  submission.status = "approved";
  submission.approvedAt = new Date().toISOString();
  
  await savePendingSubmissions(submissions);
  return submission;
}

// Reject a submission
async function rejectSubmission(submissionId, reason) {
  const submissions = await loadPendingSubmissions();
  const submission = submissions.find(s => s.id === submissionId);
  
  if (!submission) {
    throw new Error("Submission not found");
  }

  submission.status = "rejected";
  submission.rejectedAt = new Date().toISOString();
  submission.rejectionReason = reason;
  
  await savePendingSubmissions(submissions);
  return submission;
}

// Validate and geocode a submission
async function validateAndGeocodeSubmission(submissionData) {
  const { businessName, address, city, state, zipCode, country } = submissionData;
  
  if (!businessName || !address || !city || !state || !zipCode || !country) {
    throw new Error("Missing required fields");
  }

  const fullAddress = `${address}, ${city}, ${state} ${zipCode}, ${country}`;
  
  let coordinates = null;
  try {
    coordinates = await geocodeAddress(fullAddress);
  } catch (error) {
    console.log(`Geocoding failed for ${fullAddress}:`, error.message);
    // Continue without coordinates - they can be added manually later
  }

  return {
    ...submissionData,
    fullAddress,
    coordinates
  };
}

module.exports = {
  loadPendingSubmissions,
  savePendingSubmissions,
  processApprovedSubmissions,
  getPendingSubmissions,
  approveSubmission,
  rejectSubmission,
  validateAndGeocodeSubmission,
  getRejectedLocations
}; 