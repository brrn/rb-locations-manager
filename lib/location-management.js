const { getRejectedLocations } = require("./manual-submissions");

// Conditionally import Shopify functions to handle missing environment variables
let getShopifyLocationsAsset, updateShopifyLocationsAsset;
try {
  const shopifyModule = require("./shopify");
  getShopifyLocationsAsset = shopifyModule.getShopifyLocationsAsset;
  updateShopifyLocationsAsset = shopifyModule.updateShopifyLocationsAsset;
} catch (error) {
  console.warn("Shopify module not available, will only work with local data:", error.message);
  getShopifyLocationsAsset = async () => ({ manualLocations: [], storeLocations: [], skus: [] });
  updateShopifyLocationsAsset = async () => { console.warn("Shopify update not available"); };
}

// Get all manual locations from Shopify and local rejected locations
async function getAllManualLocations() {
  try {
    const { manualLocations } = await getShopifyLocationsAsset();
    const rejectedLocations = await getRejectedLocations();
    
    // Combine Shopify manual locations with local rejected locations
    const allLocations = [
      ...(manualLocations || []),
      ...rejectedLocations
    ];
    
    return allLocations;
  } catch (error) {
    console.error("Error fetching Shopify locations, returning only rejected locations:", error.message);
    // If Shopify API fails, still return rejected locations
    try {
      const rejectedLocations = await getRejectedLocations();
      return rejectedLocations;
    } catch (rejectedError) {
      console.error("Error fetching rejected locations:", rejectedError);
      return [];
    }
  }
}

// Update a specific manual location
async function updateManualLocation(locationId, updates) {
  try {
    const { manualLocations, storeLocations, skus } = await getShopifyLocationsAsset();
    
    // Find and update the location
    const locationIndex = manualLocations.findIndex(loc => loc.id === locationId);
    if (locationIndex === -1) {
      throw new Error("Location not found");
    }
    
    // Update the location with new data
    manualLocations[locationIndex] = {
      ...manualLocations[locationIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    // Update Shopify asset
    const assetContent = `var manualLocations = ${JSON.stringify(manualLocations, null, 2)};\nvar storeLocations = ${JSON.stringify(storeLocations, null, 2)};\nvar skus = ${JSON.stringify(skus, null, 2)};`;
    await updateShopifyLocationsAsset(assetContent);
    
    return manualLocations[locationIndex];
  } catch (error) {
    console.error("Error updating manual location:", error);
    throw error;
  }
}

// Archive a manual location (move to archived state instead of deleting)
async function archiveManualLocation(locationId, reason = "Archived by admin") {
  try {
    const { manualLocations, storeLocations, skus } = await getShopifyLocationsAsset();
    
    // Find the location
    const locationIndex = manualLocations.findIndex(loc => loc.id === locationId);
    if (locationIndex === -1) {
      throw new Error("Location not found");
    }
    
    // Mark as archived instead of removing
    manualLocations[locationIndex] = {
      ...manualLocations[locationIndex],
      status: "archived",
      archivedAt: new Date().toISOString(),
      archiveReason: reason
    };
    
    // Update Shopify asset
    const assetContent = `var manualLocations = ${JSON.stringify(manualLocations, null, 2)};\nvar storeLocations = ${JSON.stringify(storeLocations, null, 2)};\nvar skus = ${JSON.stringify(skus, null, 2)};`;
    await updateShopifyLocationsAsset(assetContent);
    
    return manualLocations[locationIndex];
  } catch (error) {
    console.error("Error archiving manual location:", error);
    throw error;
  }
}

// Bulk archive multiple locations
async function bulkArchiveLocations(locationIds, reason = "Bulk archived by admin") {
  try {
    const { manualLocations, storeLocations, skus } = await getShopifyLocationsAsset();
    
    let updatedCount = 0;
    
    // Update each location
    manualLocations.forEach(location => {
      if (locationIds.includes(location.id)) {
        location.status = "archived";
        location.archivedAt = new Date().toISOString();
        location.archiveReason = reason;
        updatedCount++;
      }
    });
    
    if (updatedCount === 0) {
      throw new Error("No locations found to archive");
    }
    
    // Update Shopify asset
    const assetContent = `var manualLocations = ${JSON.stringify(manualLocations, null, 2)};\nvar storeLocations = ${JSON.stringify(storeLocations, null, 2)};\nvar skus = ${JSON.stringify(skus, null, 2)};`;
    await updateShopifyLocationsAsset(assetContent);
    
    return { archivedCount: updatedCount };
  } catch (error) {
    console.error("Error bulk archiving locations:", error);
    throw error;
  }
}

// Get location statistics
async function getLocationStats() {
  try {
    const allLocations = await getAllManualLocations();
    
    const stats = {
      total: allLocations.length,
      active: allLocations.filter(loc => loc.status === "active").length,
      archived: allLocations.filter(loc => loc.status === "archived").length,
      rejected: allLocations.filter(loc => loc.status === "rejected").length,
      pending: allLocations.filter(loc => loc.status === "pending").length
    };
    
    return stats;
  } catch (error) {
    console.error("Error getting location stats:", error);
    throw error;
  }
}

// Search and filter locations
async function searchLocations(query, filters = {}) {
  try {
    const allLocations = await getAllManualLocations();
    
    let filtered = allLocations;
    
    // Text search
    if (query) {
      const searchTerm = query.toLowerCase();
      filtered = filtered.filter(location => 
        location.name.toLowerCase().includes(searchTerm) ||
        location.address.toLowerCase().includes(searchTerm) ||
        location.city.toLowerCase().includes(searchTerm) ||
        location.state.toLowerCase().includes(searchTerm)
      );
    }
    
    // Status filter
    if (filters.status) {
      filtered = filtered.filter(location => location.status === filters.status);
    }
    
    // Product filter
    if (filters.product) {
      filtered = filtered.filter(location => 
        location.skus && location.skus.includes(filters.product)
      );
    }
    
    // Date range filter
    if (filters.dateFrom || filters.dateTo) {
      filtered = filtered.filter(location => {
        const locationDate = new Date(location.submittedAt);
        if (filters.dateFrom && locationDate < new Date(filters.dateFrom)) return false;
        if (filters.dateTo && locationDate > new Date(filters.dateTo)) return false;
        return true;
      });
    }
    
    return filtered;
  } catch (error) {
    console.error("Error searching locations:", error);
    throw error;
  }
}

module.exports = {
  getAllManualLocations,
  updateManualLocation,
  archiveManualLocation,
  bulkArchiveLocations,
  getLocationStats,
  searchLocations
}; 