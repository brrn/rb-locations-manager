require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs").promises;
const path = require("path");
const { geocodeAddress } = require("./lib/google");
const { sendSlack } = require("./lib/slack");
const { 
  getAllManualLocations, 
  updateManualLocation, 
  archiveManualLocation, 
  bulkArchiveLocations, 
  getLocationStats, 
  searchLocations 
} = require("./lib/location-management");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Store pending submissions in a JSON file
const SUBMISSIONS_FILE = "pending-locations.json";

// Product data - consolidated by flavor name
const PRODUCTS = [
  {
    "sku": "LT-BLK-AC-16-WH",
    "name": "Apricots & Cream",
    "url": "https://rarebrew.com/products/apricots-cream"
  },
  {
    "sku": "LT-BLK-BAM-16-WH",
    "name": "Blueberry Acai Mojito",
    "url": "https://rarebrew.com/products/blueberry-acai-mojito"
  },
  {
    "sku": "LT-BLK-BEG-16-WH",
    "name": "Blueberry Earl Grey",
    "url": "https://rarebrew.com/products/blueberry-earl-grey"
  },
  {
    "sku": "LT-BLK-BGP-16-WH",
    "name": "Bourbon Ginger Pear",
    "url": "https://rarebrew.com/products/bourbon-ginger-pear"
  },
  {
    "sku": "LT-BLK-DCC-16-WH",
    "name": "Dark Chocolate Cherry",
    "url": "https://rarebrew.com/products/dark-chocolate-cherry"
  },
  {
    "sku": "LT-BLK-GPC-16-WH",
    "name": "Green Tea Piña Colada",
    "url": "https://rarebrew.com/products/green-tea-pina-colada"
  },
  {
    "sku": "LT-BLK-MMC-16-WH",
    "name": "Matcha Mind Control",
    "url": "https://rarebrew.com/products/matcha-mind-control"
  },
  {
    "sku": "LT-BLK-MP-16-WH",
    "name": "Mango Passionfruit",
    "url": "https://rarebrew.com/products/mango-passion"
  },
  {
    "sku": "LT-BLK-RP-16-WH",
    "name": "Raspberry Pomegranate",
    "url": "https://rarebrew.com/products/raspberry-pomegranate"
  },
  {
    "sku": "ST-BTL-BGP-12-WS",
    "name": "Bourbon Ginger Pear",
    "url": "https://rarebrew.com/products/bourbon-ginger-pear-sparkling-tea"
  },
  {
    "sku": "ST-BTL-CL-12-WS",
    "name": "Cherry Lime",
    "url": "https://rarebrew.com/products/cherry-lime-sparkling-tea"
  },
  {
    "sku": "ST-BTL-GTP-12-WS",
    "name": "Green Tea Pilsner",
    "url": "https://rarebrew.com/products/green-tea-pilsner-sparkling-tea"
  },
  {
    "sku": "ST-BTL-PM-12-WS",
    "name": "Pineapple Melon",
    "url": "https://rarebrew.com/products/pineapple-melon-sparkling-tea"
  },
  {
    "sku": "ST-BTL-PT-12-WS",
    "name": "Passionfruit Tangerine",
    "url": "https://rarebrew.com/products/passionfruit-tangerine-sparkling-tea"
  },
  {
    "sku": "ST-BTL-PTH-12-WS",
    "name": "Peach Tree Hops",
    "url": "https://rarebrew.com/products/peach-tree-hops-sparkling-tea"
  },
  {
    "sku": "ST-BTL-RH-12-WS",
    "name": "Raspberry Hibiscus",
    "url": "https://rarebrew.com/products/raspberry-hibiscus-sparkling-tea"
  },
  {
    "sku": "ST-VAR-TOP-12-WS",
    "name": "Variety Pack",
    "url": "https://rarebrew.com/products/variety-pack-sparkling-tea"
  }
];

// Ensure submissions file exists
async function ensureSubmissionsFile() {
  try {
    await fs.access(SUBMISSIONS_FILE);
  } catch {
    await fs.writeFile(SUBMISSIONS_FILE, JSON.stringify([], null, 2));
  }
}

// Load pending submissions
async function loadPendingSubmissions() {
  await ensureSubmissionsFile();
  const data = await fs.readFile(SUBMISSIONS_FILE, "utf8");
  return JSON.parse(data);
}

// Save pending submissions
async function savePendingSubmissions(submissions) {
  await fs.writeFile(SUBMISSIONS_FILE, JSON.stringify(submissions, null, 2));
}

// Routes
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "admin.html"));
});

app.get("/manage-locations", (req, res) => {
  res.sendFile(path.join(__dirname, "manage-locations.html"));
});

app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Add New Location - Rare Brew</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f5f5f5;
            }
            .container {
                background: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            h1 {
                color: #333;
                text-align: center;
                margin-bottom: 30px;
            }
            .form-group {
                margin-bottom: 20px;
            }
            label {
                display: block;
                margin-bottom: 5px;
                font-weight: 600;
                color: #555;
            }
            input, textarea, select {
                width: 100%;
                padding: 12px;
                border: 2px solid #ddd;
                border-radius: 6px;
                font-size: 16px;
                box-sizing: border-box;
            }
            input:focus, textarea:focus, select:focus {
                outline: none;
                border-color: #007cba;
            }
            button {
                background-color: #007cba;
                color: white;
                padding: 15px 30px;
                border: none;
                border-radius: 6px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                width: 100%;
                transition: background-color 0.2s;
            }
            button:hover {
                background-color: #005a87;
            }
            .success {
                background-color: #d4edda;
                color: #155724;
                padding: 15px;
                border-radius: 6px;
                margin-top: 20px;
                display: none;
            }
            .error {
                background-color: #f8d7da;
                color: #721c24;
                padding: 15px;
                border-radius: 6px;
                margin-top: 20px;
                display: none;
            }
            .required {
                color: #dc3545;
            }
            .product-selector {
                max-height: 300px;
                overflow-y: auto;
                border: 2px solid #ddd;
                border-radius: 6px;
                padding: 10px;
            }
            .product-category {
                margin-bottom: 20px;
            }
            .category-title {
                font-weight: 600;
                color: #333;
                margin-bottom: 10px;
                padding: 8px;
                background-color: #f8f9fa;
                border-radius: 4px;
            }
            .product-checkbox {
                display: flex;
                align-items: center;
                margin-bottom: 8px;
                padding: 8px;
                border-radius: 4px;
                transition: background-color 0.2s;
            }
            .product-checkbox:hover {
                background-color: #f8f9fa;
            }
            .product-checkbox input[type="checkbox"] {
                width: auto;
                margin-right: 10px;
            }
            .product-checkbox label {
                margin: 0;
                font-weight: normal;
                cursor: pointer;
                flex: 1;
            }

            .selected-count {
                color: #007cba;
                font-size: 14px;
                margin-top: 5px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Add New Location</h1>
            <form id="locationForm">
                <div class="form-group">
                    <label for="businessName">Business Name <span class="required">*</span></label>
                    <input type="text" id="businessName" name="businessName" required>
                </div>
                
                <div class="form-group">
                    <label for="contactName">Contact Name</label>
                    <input type="text" id="contactName" name="contactName">
                </div>
                
                <div class="form-group">
                    <label for="email">Email</label>
                    <input type="email" id="email" name="email">
                </div>
                
                <div class="form-group">
                    <label for="phone">Phone</label>
                    <input type="tel" id="phone" name="phone">
                </div>
                
                <div class="form-group">
                    <label for="address">Street Address <span class="required">*</span></label>
                    <input type="text" id="address" name="address" required>
                </div>
                
                <div class="form-group">
                    <label for="city">City <span class="required">*</span></label>
                    <input type="text" id="city" name="city" required>
                </div>
                
                <div class="form-group">
                    <label for="state">State/Province <span class="required">*</span></label>
                    <select id="state" name="state" required>
                        <option value="">Select a state...</option>
                        <option value="AL">Alabama</option>
                        <option value="AK">Alaska</option>
                        <option value="AZ">Arizona</option>
                        <option value="AR">Arkansas</option>
                        <option value="CA">California</option>
                        <option value="CO">Colorado</option>
                        <option value="CT">Connecticut</option>
                        <option value="DE">Delaware</option>
                        <option value="DC">District of Columbia</option>
                        <option value="FL">Florida</option>
                        <option value="GA">Georgia</option>
                        <option value="HI">Hawaii</option>
                        <option value="ID">Idaho</option>
                        <option value="IL">Illinois</option>
                        <option value="IN">Indiana</option>
                        <option value="IA">Iowa</option>
                        <option value="KS">Kansas</option>
                        <option value="KY">Kentucky</option>
                        <option value="LA">Louisiana</option>
                        <option value="ME">Maine</option>
                        <option value="MD">Maryland</option>
                        <option value="MA">Massachusetts</option>
                        <option value="MI">Michigan</option>
                        <option value="MN">Minnesota</option>
                        <option value="MS">Mississippi</option>
                        <option value="MO">Missouri</option>
                        <option value="MT">Montana</option>
                        <option value="NE">Nebraska</option>
                        <option value="NV">Nevada</option>
                        <option value="NH">New Hampshire</option>
                        <option value="NJ">New Jersey</option>
                        <option value="NM">New Mexico</option>
                        <option value="NY">New York</option>
                        <option value="NC">North Carolina</option>
                        <option value="ND">North Dakota</option>
                        <option value="OH">Ohio</option>
                        <option value="OK">Oklahoma</option>
                        <option value="OR">Oregon</option>
                        <option value="PA">Pennsylvania</option>
                        <option value="RI">Rhode Island</option>
                        <option value="SC">South Carolina</option>
                        <option value="SD">South Dakota</option>
                        <option value="TN">Tennessee</option>
                        <option value="TX">Texas</option>
                        <option value="UT">Utah</option>
                        <option value="VT">Vermont</option>
                        <option value="VA">Virginia</option>
                        <option value="WA">Washington</option>
                        <option value="WV">West Virginia</option>
                        <option value="WI">Wisconsin</option>
                        <option value="WY">Wyoming</option>
                        <option value="AS">American Samoa</option>
                        <option value="GU">Guam</option>
                        <option value="MP">Northern Mariana Islands</option>
                        <option value="PR">Puerto Rico</option>
                        <option value="VI">U.S. Virgin Islands</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="zipCode">ZIP/Postal Code <span class="required">*</span></label>
                    <input type="text" id="zipCode" name="zipCode" required>
                </div>
                
                <div class="form-group">
                    <label for="country">Country <span class="required">*</span></label>
                    <input type="text" id="country" name="country" value="United States" required>
                </div>
                
                <div class="form-group">
                    <label for="channel">Channel or Deal Owner <span class="required">*</span></label>
                    <input type="text" id="channel" name="channel" required>
                </div>
                
                <div class="form-group">
                    <label>Products Carried <span class="required">*</span></label>
                    <div class="product-selector" id="productSelector">
                        <div class="product-category">
                            <div class="category-title">Loose Tea</div>
                            <div class="product-checkbox">
                                <input type="checkbox" id="LT-BLK-AC-16-WH" name="carriedProducts" value="LT-BLK-AC-16-WH">
                                <label for="LT-BLK-AC-16-WH">Apricots & Cream</label>
                            </div>
                            <div class="product-checkbox">
                                <input type="checkbox" id="LT-BLK-BAM-16-WH" name="carriedProducts" value="LT-BLK-BAM-16-WH">
                                <label for="LT-BLK-BAM-16-WH">Blueberry Acai Mojito</label>
                            </div>
                            <div class="product-checkbox">
                                <input type="checkbox" id="LT-BLK-BEG-16-WH" name="carriedProducts" value="LT-BLK-BEG-16-WH">
                                <label for="LT-BLK-BEG-16-WH">Blueberry Earl Grey</label>
                            </div>
                            <div class="product-checkbox">
                                <input type="checkbox" id="LT-BLK-BGP-16-WH" name="carriedProducts" value="LT-BLK-BGP-16-WH">
                                <label for="LT-BLK-BGP-16-WH">Bourbon Ginger Pear</label>
                            </div>
                            <div class="product-checkbox">
                                <input type="checkbox" id="LT-BLK-DCC-16-WH" name="carriedProducts" value="LT-BLK-DCC-16-WH">
                                <label for="LT-BLK-DCC-16-WH">Dark Chocolate Cherry</label>
                            </div>
                            <div class="product-checkbox">
                                <input type="checkbox" id="LT-BLK-GPC-16-WH" name="carriedProducts" value="LT-BLK-GPC-16-WH">
                                <label for="LT-BLK-GPC-16-WH">Green Tea Piña Colada</label>
                            </div>
                            <div class="product-checkbox">
                                <input type="checkbox" id="LT-BLK-MMC-16-WH" name="carriedProducts" value="LT-BLK-MMC-16-WH">
                                <label for="LT-BLK-MMC-16-WH">Matcha Mind Control</label>
                            </div>
                            <div class="product-checkbox">
                                <input type="checkbox" id="LT-BLK-MP-16-WH" name="carriedProducts" value="LT-BLK-MP-16-WH">
                                <label for="LT-BLK-MP-16-WH">Mango Passionfruit</label>
                            </div>
                            <div class="product-checkbox">
                                <input type="checkbox" id="LT-BLK-RP-16-WH" name="carriedProducts" value="LT-BLK-RP-16-WH">
                                <label for="LT-BLK-RP-16-WH">Raspberry Pomegranate</label>
                            </div>
                        </div>
                        
                        <div class="product-category">
                            <div class="category-title">Sparkling Tea</div>
                            <div class="product-checkbox">
                                <input type="checkbox" id="ST-BTL-BGP-12-WS" name="carriedProducts" value="ST-BTL-BGP-12-WS">
                                <label for="ST-BTL-BGP-12-WS">Bourbon Ginger Pear</label>
                            </div>
                            <div class="product-checkbox">
                                <input type="checkbox" id="ST-BTL-CL-12-WS" name="carriedProducts" value="ST-BTL-CL-12-WS">
                                <label for="ST-BTL-CL-12-WS">Cherry Lime</label>
                            </div>
                            <div class="product-checkbox">
                                <input type="checkbox" id="ST-BTL-GTP-12-WS" name="carriedProducts" value="ST-BTL-GTP-12-WS">
                                <label for="ST-BTL-GTP-12-WS">Green Tea Pilsner</label>
                            </div>
                            <div class="product-checkbox">
                                <input type="checkbox" id="ST-BTL-PM-12-WS" name="carriedProducts" value="ST-BTL-PM-12-WS">
                                <label for="ST-BTL-PM-12-WS">Pineapple Melon</label>
                            </div>
                            <div class="product-checkbox">
                                <input type="checkbox" id="ST-BTL-PT-12-WS" name="carriedProducts" value="ST-BTL-PT-12-WS">
                                <label for="ST-BTL-PT-12-WS">Passionfruit Tangerine</label>
                            </div>
                            <div class="product-checkbox">
                                <input type="checkbox" id="ST-BTL-PTH-12-WS" name="carriedProducts" value="ST-BTL-PTH-12-WS">
                                <label for="ST-BTL-PTH-12-WS">Peach Tree Hops</label>
                            </div>
                            <div class="product-checkbox">
                                <input type="checkbox" id="ST-BTL-RH-12-WS" name="carriedProducts" value="ST-BTL-RH-12-WS">
                                <label for="ST-BTL-RH-12-WS">Raspberry Hibiscus</label>
                            </div>
                            <div class="product-checkbox">
                                <input type="checkbox" id="ST-VAR-TOP-12-WS" name="carriedProducts" value="ST-VAR-TOP-12-WS">
                                <label for="ST-VAR-TOP-12-WS">Variety Pack</label>
                            </div>
                        </div>
                    </div>
                    <div class="selected-count" id="selectedCount">0 products selected</div>
                </div>
                
                <button type="submit">Submit Location</button>
            </form>
            
            <div id="successMessage" class="success">
                Location submitted successfully! It will be added to the map within 24 hours.
            </div>
            
            <div id="errorMessage" class="error">
                There was an error submitting the location. Please try again.
            </div>
        </div>

        <script>
            // Update selected count
            function updateSelectedCount() {
                const checkboxes = document.querySelectorAll('input[name="carriedProducts"]:checked');
                const count = checkboxes.length;
                document.getElementById('selectedCount').textContent = count + ' product' + (count !== 1 ? 's' : '') + ' selected';
            }

            // Add event listeners to all checkboxes
            document.addEventListener('DOMContentLoaded', function() {
                const checkboxes = document.querySelectorAll('input[name="carriedProducts"]');
                checkboxes.forEach(checkbox => {
                    checkbox.addEventListener('change', updateSelectedCount);
                });
                updateSelectedCount();
            });

            document.getElementById('locationForm').addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const formData = new FormData(this);
                const data = Object.fromEntries(formData);
                
                // Get selected products
                const selectedProducts = Array.from(document.querySelectorAll('input[name="carriedProducts"]:checked')).map(cb => cb.value);
                data.carriedProducts = selectedProducts;
                
                try {
                    const response = await fetch('/api/submit-location', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(data)
                    });
                    
                    const result = await response.json();
                    
                    if (response.ok) {
                        document.getElementById('successMessage').style.display = 'block';
                        document.getElementById('errorMessage').style.display = 'none';
                        this.reset();
                        updateSelectedCount();
                    } else {
                        throw new Error(result.error || 'Submission failed');
                    }
                } catch (error) {
                    document.getElementById('errorMessage').style.display = 'block';
                    document.getElementById('successMessage').style.display = 'none';
                    console.error('Error:', error);
                }
            });
        </script>
    </body>
    </html>
  `);
});

// API endpoint to submit new locations
app.post("/api/submit-location", async (req, res) => {
  try {
    const {
      businessName,
      contactName,
      email,
      phone,
      address,
      city,
      state,
      zipCode,
      country,
      channel,
      carriedProducts
    } = req.body;

    // Validate required fields
    if (!businessName || !address || !city || !state || !zipCode || !country || !channel) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Validate that at least one product is selected
    if (!carriedProducts || carriedProducts.length === 0) {
      return res.status(400).json({ error: "Please select at least one product" });
    }

    // Create full address for geocoding
    const fullAddress = `${address}, ${city}, ${state} ${zipCode}, ${country}`;

    // Try to geocode the address
    let coordinates = null;
    try {
      coordinates = await geocodeAddress(fullAddress);
    } catch (error) {
      console.log(`Geocoding failed for ${fullAddress}:`, error.message);
      // Continue without coordinates - they can be added manually later
    }

    // Create submission object
    const submission = {
      id: `manual_${Date.now()}`,
      businessName,
      contactName,
      email,
      phone,
      address,
      city,
      state,
      zipCode,
      country,
      fullAddress,
      coordinates,
      channel,
      carriedProducts: carriedProducts || [],
      submittedAt: new Date().toISOString(),
      status: "pending"
    };

    // Load existing submissions and add new one
    const submissions = await loadPendingSubmissions();
    submissions.push(submission);
    await savePendingSubmissions(submissions);

    // Send Slack notification
    try {
      const productNames = (carriedProducts || []).map(sku => {
        const product = PRODUCTS.find(p => p.sku === sku);
        return product ? product.name : sku;
      }).join(', ') || 'None';

      const slackMessage = `New location submission: 
${businessName}

Address:
${fullAddress}

Channel or Deal Owner:
${channel}`;

      await sendSlack(slackMessage);
    } catch (slackError) {
      console.error("Failed to send Slack notification:", slackError);
    }

    res.json({ success: true, message: "Location submitted successfully" });
  } catch (error) {
    console.error("Error submitting location:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// API endpoint to get all submissions (for admin review)
app.get("/api/pending-submissions", async (req, res) => {
  try {
    const submissions = await loadPendingSubmissions();
    res.json(submissions);
  } catch (error) {
    console.error("Error loading submissions:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// API endpoint to approve a submission
app.post("/api/approve-submission/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const submissions = await loadPendingSubmissions();
    
    const submission = submissions.find(s => s.id === id);
    if (!submission) {
      return res.status(404).json({ error: "Submission not found" });
    }

    // Mark as approved
    submission.status = "approved";
    submission.approvedAt = new Date().toISOString();
    
    await savePendingSubmissions(submissions);
    
    res.json({ success: true, message: "Submission approved" });
  } catch (error) {
    console.error("Error approving submission:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// API endpoint to reject a submission
app.post("/api/reject-submission/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const submissions = await loadPendingSubmissions();
    
    const submission = submissions.find(s => s.id === id);
    if (!submission) {
      return res.status(404).json({ error: "Submission not found" });
    }

    // Mark as rejected
    submission.status = "rejected";
    submission.rejectedAt = new Date().toISOString();
    submission.rejectionReason = reason;
    
    await savePendingSubmissions(submissions);
    
    res.json({ success: true, message: "Submission rejected" });
  } catch (error) {
    console.error("Error rejecting submission:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Location Management API Endpoints

// Get all manual locations
app.get("/api/manual-locations", async (req, res) => {
  try {
    const locations = await getAllManualLocations();
    res.json(locations);
  } catch (error) {
    console.error("Error fetching manual locations:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get location statistics
app.get("/api/location-stats", async (req, res) => {
  try {
    const stats = await getLocationStats();
    res.json(stats);
  } catch (error) {
    console.error("Error fetching location stats:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Search locations
app.get("/api/search-locations", async (req, res) => {
  try {
    const { query, status, product, dateFrom, dateTo } = req.query;
    const filters = { status, product, dateFrom, dateTo };
    const locations = await searchLocations(query, filters);
    res.json(locations);
  } catch (error) {
    console.error("Error searching locations:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update a manual location
app.put("/api/manual-locations/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const updatedLocation = await updateManualLocation(id, updates);
    res.json({ success: true, location: updatedLocation });
  } catch (error) {
    console.error("Error updating manual location:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Archive a manual location
app.post("/api/archive-location/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const archivedLocation = await archiveManualLocation(id, reason);
    res.json({ success: true, location: archivedLocation });
  } catch (error) {
    console.error("Error archiving location:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Bulk archive locations
app.post("/api/bulk-archive-locations", async (req, res) => {
  try {
    const { locationIds, reason } = req.body;
    
    if (!locationIds || !Array.isArray(locationIds) || locationIds.length === 0) {
      return res.status(400).json({ error: "Location IDs array is required" });
    }
    
    const result = await bulkArchiveLocations(locationIds, reason);
    res.json({ success: true, result });
  } catch (error) {
    console.error("Error bulk archiving locations:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log(`Location submission server running on port ${PORT}`);
}); 